import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createEditor,
  createProject,
  customDev,
  build,
  viteConfig,
  dev,
  viteDevCmd,
  reactRouterServe,
  reactRouterConfig,
} from "./helpers/vite.js";
import { js } from "./helpers/create-fixture.js";

const sharedFiles = {
  "app/routes/_index.tsx": js`
    import { useState, useEffect } from "react";
    import { Link } from "react-router"

    export default function IndexRoute() {
      const [mounted, setMounted] = useState(false);
      useEffect(() => {
        setMounted(true);
      }, []);

      return (
        <div id="index">
          <h2 data-title>Index</h2>
          <input />
          <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
          <p data-hmr>HMR updated: 0</p>
          <Link to="/other">other</Link>
        </div>
      );
    }
  `,
  "app/routes/other.tsx": js`
    import { useLoaderData } from "react-router";

    export const loader = () => {
      return "other-loader";
    };

    export default function OtherRoute() {
      const loaderData = useLoaderData()

      return (
        <div id="other">
          <p>{loaderData}</p>
        </div>
      );
    }
  `,
};

async function configFiles({
  port,
  base,
  basename,
}: {
  port: number;
  base?: string;
  basename?: string;
}) {
  return {
    "react-router.config.ts": reactRouterConfig({
      basename: basename !== "/" ? basename : undefined,
    }),
    "vite.config.js": js`
    import { reactRouter } from "@react-router/dev/vite";

    export default {
      ${base !== "/" ? 'base: "' + base + '",' : ""}
      ${await viteConfig.server({ port })}
      plugins: [reactRouter()]
    }
  `,
  };
}

const customServerFile = ({
  port,
  base,
  basename,
}: {
  port: number;
  base?: string;
  basename?: string;
}) => {
  base = base ?? "/mybase/";
  basename = basename ?? base;

  return js`
    import { createRequestHandler } from "@react-router/express";
    import express from "express";

    const viteDevServer =
      process.env.NODE_ENV === "production"
        ? undefined
        : await import("vite").then(({ createServer }) =>
            createServer({
              server: {
                middlewareMode: true,
              },
            })
          );

    const app = express();
    app.use("${base}", viteDevServer?.middlewares || express.static("build/client"));
    app.all(
      "${basename}*",
      createRequestHandler({
        build: viteDevServer
          ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
          : await import("./build/server/index.js"),
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("content-type", "text/html")
      res.end('React Router app is at <a href="${basename}">${basename}</a>');
    });

    const port = ${port};
    app.listen(port, () => console.log('http://localhost:' + port));
  `;
};

test.describe("Vite base / React Router basename / Vite dev", () => {
  let port: number;
  let cwd: string;
  let stop: () => unknown;

  async function setup({
    base,
    basename,
    startServer,
    files,
  }: {
    base: string;
    basename: string;
    startServer?: boolean;
    files?: Record<string, string>;
  }) {
    port = await getPort();
    cwd = await createProject({
      ...(await configFiles({ port, base, basename })),
      ...(files || sharedFiles),
    });
    if (startServer !== false) {
      stop = await dev({ cwd, port, basename });
    }
  }

  test.afterAll(async () => await stop?.());

  test("works when the base and basename are the same", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/" });
    await workflowDev({ page, cwd, port });
  });

  test("works when the base and basename are different", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/app/" });
    await workflowDev({ page, cwd, port, basename: "/mybase/app/" });
  });

  test("errors if basename does not start with base", async ({ page }) => {
    await setup({
      base: "/mybase/",
      basename: "/notmybase/",
      startServer: false,
    });
    let proc = await viteDevCmd({ cwd });
    expect(proc.stderr.toString()).toMatch(
      "When using the React Router `basename` and the Vite `base` config, the " +
        "`basename` config must begin with `base` for the default Vite dev server."
    );
  });

  test("works with child routes using client loaders", async ({ page }) => {
    let basename = "/mybase/";
    await setup({
      base: basename,
      basename,
      files: {
        ...sharedFiles,
        "app/routes/parent.tsx": js`
          import { Outlet } from 'react-router'
          export default function Parent() {
            return <div id="parent"><Outlet /></div>;
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { useState, useEffect } from "react";
          import { useLoaderData } from 'react-router'
          export async function clientLoader() {
            await new Promise(resolve => setTimeout(resolve, 500))
            return "CHILD"
          }
          export function HydrateFallback() {
            const [mounted, setMounted] = useState(false);
            useEffect(() => setMounted(true), []);
            return (
              <>
                <p id="loading">Loading...</p>
                <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
              </>
            );
          }
          export default function Child() {
            const data = useLoaderData()
            const [mounted, setMounted] = useState(false);
            useEffect(() => setMounted(true), []);
            return (
              <>
                <div id="child">{data}</div>;
                <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
              </>
            );
          }
        `,
      },
    });

    let hydrationErrors: Error[] = [];
    page.on("pageerror", (error) => {
      if (
        error.message.includes("Hydration failed") ||
        error.message.includes("error while hydrating") ||
        error.message.includes("does not match server-rendered HTML")
      ) {
        hydrationErrors.push(error);
      }
    });

    // setup: initial render at basename
    await page.goto(`http://localhost:${port}${basename}parent/child`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("#parent")).toBeDefined();
    await expect(page.locator("#loading")).toContainText("Loading...");
    await expect(page.locator("[data-mounted]")).toHaveText("Mounted: yes");

    expect(hydrationErrors).toEqual([]);

    await page.waitForSelector("#child");
    await expect(page.locator("#child")).toHaveText("CHILD");
    await expect(page.locator("[data-mounted]")).toHaveText("Mounted: yes");
  });
});

test.describe("Vite base / React Router basename / express dev", async () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  async function setup({
    base,
    basename,
    startServer,
  }: {
    base: string;
    basename: string;
    startServer?: boolean;
  }) {
    port = await getPort();
    cwd = await createProject({
      ...(await configFiles({ port, base, basename })),
      "server.mjs": customServerFile({ port, basename }),
      ...sharedFiles,
    });
    if (startServer !== false) {
      stop = await customDev({ cwd, port, basename });
    }
  }

  test.afterAll(() => stop());

  test("works when base and basename are the same", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/" });
    await workflowDev({ page, cwd, port });
  });

  test("works when base and basename are different", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/dashboard/" });
    await workflowDev({ page, cwd, port, basename: "/mybase/dashboard/" });
  });

  test("works when basename does not start with base", async ({ page }) => {
    await setup({
      base: "/mybase/",
      basename: "/notmybase/",
    });
    await workflowDev({ page, cwd, port, basename: "/notmybase/" });
  });
});

async function workflowDev({
  page,
  cwd,
  port,
  base,
  basename,
}: {
  page: Page;
  cwd: string;
  port: number;
  base?: string;
  basename?: string;
}) {
  base = base ?? "/mybase/";
  basename = basename ?? base;

  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  let edit = createEditor(cwd);

  let requestUrls: string[] = [];
  page.on("request", (request) => {
    requestUrls.push(request.url());
  });

  // setup: initial render at basename
  await page.goto(`http://localhost:${port}${basename}`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-title]")).toHaveText("Index");

  // setup: hydration
  await expect(page.locator("#index [data-mounted]")).toHaveText(
    "Mounted: yes"
  );

  // setup: browser state
  let hmrStatus = page.locator("#index [data-hmr]");
  await expect(hmrStatus).toHaveText("HMR updated: 0");
  let input = page.locator("#index input");
  await expect(input).toBeVisible();
  await input.type("stateful");
  expect(pageErrors).toEqual([]);

  // route: HMR
  await edit("app/routes/_index.tsx", (contents) =>
    contents.replace("HMR updated: 0", "HMR updated: 1")
  );
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 1");
  await expect(input).toHaveValue("stateful");
  expect(pageErrors).toEqual([]);

  // client side navigation
  await page.getByRole("link", { name: "other" }).click();
  await page.waitForURL(`http://localhost:${port}${basename}other`);
  await page.getByText("other-loader").click();
  expect(pageErrors).toEqual([]);

  let isAssetRequest = (url: string) =>
    /\.[jt]sx?/.test(url) ||
    /\/@id\/__x00__virtual:/.test(url) ||
    /\/@vite\/client/.test(url) ||
    /\/@fs\//.test(url);

  // verify client asset requests are all under base
  expect(
    requestUrls
      .filter((url) => isAssetRequest(url))
      .every((url) => url.startsWith(`http://localhost:${port}${base}`))
  ).toBe(true);

  // verify client route requests are all under basename
  expect(
    requestUrls
      .filter((url) => !isAssetRequest(url))
      .every((url) => url.startsWith(`http://localhost:${port}${basename}`))
  ).toBe(true);
}

test.describe("Vite base / React Router basename / vite build", () => {
  let port: number;
  let cwd: string;
  let stop: () => unknown;

  async function setup({
    base,
    basename,
    startServer,
  }: {
    base: string;
    basename: string;
    startServer?: boolean;
  }) {
    port = await getPort();
    cwd = await createProject({
      ...(await configFiles({ port, base, basename })),
      ...sharedFiles,
    });
    build({ cwd });
    if (startServer !== false) {
      stop = await reactRouterServe({ cwd, port, basename });
    }
  }

  test.afterAll(() => stop());

  test("works when base and basename are the same", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/" });
    await workflowBuild({ page, port });
  });

  test("works when base and basename are different", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/dashboard/" });
    await workflowBuild({ page, port, basename: "/mybase/dashboard/" });
  });

  test("works when basename does not start with base", async ({ page }) => {
    await setup({
      base: "/mybase/",
      basename: "/notmybase/",
    });
    await workflowBuild({ page, port, basename: "/notmybase/" });
  });
});

test.describe("Vite base / React Router basename / express build", async () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  async function setup({
    base,
    basename,
    startServer,
  }: {
    base: string;
    basename: string;
    startServer?: boolean;
  }) {
    port = await getPort();
    cwd = await createProject({
      ...(await configFiles({ port, base, basename })),
      "server.mjs": customServerFile({ port, base, basename }),
      ...sharedFiles,
    });
    build({ cwd });
    if (startServer !== false) {
      stop = await customDev({
        cwd,
        port,
        basename,
        env: { NODE_ENV: "production" },
      });
    }
  }

  test.afterAll(() => stop());

  test("works when base and basename are the same", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/" });
    await workflowBuild({ page, port });
  });

  test("works when base and basename are different", async ({ page }) => {
    await setup({ base: "/mybase/", basename: "/mybase/app/" });
    await workflowBuild({ page, port, basename: "/mybase/app/" });
  });

  test("works when basename does not start with base", async ({ page }) => {
    await setup({
      base: "/mybase/",
      basename: "/notmybase/",
    });
    await workflowBuild({ page, port, basename: "/notmybase/" });
  });

  test("works when when base is an absolute external URL", async ({ page }) => {
    port = await getPort();
    cwd = await createProject({
      ...(await configFiles({
        port,
        base: "https://cdn.example.com/assets/",
        basename: "/app/",
      })),
      // Slim server that only serves basename (route) requests from the React Router handler
      "server.mjs": String.raw`
        import { createRequestHandler } from "@react-router/express";
        import express from "express";

        const app = express();
        app.all(
          "/app/*",
          createRequestHandler({ build: await import("./build/server/index.js") })
        );

        const port = ${port};
        app.listen(port, () => console.log('http://localhost:' + port));
      `,
      ...sharedFiles,
    });

    build({ cwd });
    stop = await customDev({
      cwd,
      port,
      basename: "/app/",
      env: { NODE_ENV: "production" },
    });

    // Intercept and make all CDN requests 404
    let requestUrls: string[] = [];
    await page.route("**/*.js", (route) => {
      requestUrls.push(route.request().url());
      route.fulfill({ status: 404 });
    });

    // setup: initial render
    await page.goto(`http://localhost:${port}/app/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("#index [data-title]")).toHaveText("Index");

    // Can't validate hydration here due to 404s, but we can ensure assets are
    // attempting to load from the CDN
    expect(
      requestUrls.length > 0 &&
        requestUrls.every((url) =>
          url.startsWith("https://cdn.example.com/assets/")
        )
    ).toBe(true);
  });
});

async function workflowBuild({
  page,
  port,
  base,
  basename,
}: {
  page: Page;
  port: number;
  base?: string;
  basename?: string;
}) {
  base = base ?? "/mybase/";
  basename = basename ?? base;

  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  let requestUrls: string[] = [];
  page.on("request", (request) => {
    requestUrls.push(request.url());
  });

  // setup: initial render
  await page.goto(`http://localhost:${port}${basename}`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-title]")).toHaveText("Index");

  // setup: hydration
  await expect(page.locator("#index [data-mounted]")).toHaveText(
    "Mounted: yes"
  );

  // client side navigation
  await page.getByRole("link", { name: "other" }).click();
  await page.waitForURL(`http://localhost:${port}${basename}other`);
  await page.getByText("other-loader").click();
  expect(pageErrors).toEqual([]);

  let isAssetRequest = (url: string) => /\.js/.test(url);

  // verify client asset requests are all under base
  expect(
    requestUrls
      .filter((url) => isAssetRequest(url))
      .every((url) => url.startsWith(`http://localhost:${port}${base}`))
  ).toBe(true);

  // verify client route requests are all under basename
  expect(
    requestUrls
      .filter((url) => !isAssetRequest(url))
      .every((url) => url.startsWith(`http://localhost:${port}${basename}`))
  ).toBe(true);
}
