import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import getPort from "get-port";
import {
  createRequestHandler,
  UNSAFE_ServerMode as ServerMode,
  type UNSAFE_AssetsManifest as AssetsManifest,
} from "react-router";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  build,
  createProject,
  dev,
  reactRouterConfig,
} from "./helpers/vite.js";
import { spawnTestServer } from "./helpers/create-fixture.js";

test.describe("API-only Mode", () => {
  test.describe.configure({ mode: "serial" });

  let fixture: Fixture;
  let appFixture: AppFixture | undefined;
  let stopDev: (() => unknown) | undefined;
  let stopServe: (() => unknown) | undefined;
  let devPort: number;
  let servePort: number;

  test.beforeAll(async () => {
    devPort = await getPort();
    fixture = await createFixture({
      port: devPort,
      files: {
        "react-router.config.ts": reactRouterConfig({
          ssr: "unstable_api-only",
          unstable_apiServerOrigin: `http://localhost:${devPort}`,
        }),
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "react-router";

          export function Layout({ children }) {
            return (
              <html lang="en">
                <head>
                  <meta charSet="utf-8" />
                  <Meta />
                  <Links />
                </head>
                <body>
                  {children}
                  <Scripts />
                </body>
              </html>
            );
          }

          export function HydrateFallback() {
            return <p data-hydrate-fallback>Loading...</p>;
          }

          export default function Root() {
            return <Outlet />;
          }
        `,
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";

          export function loader() {
            return { server: "root-loader" };
          }

          export default function Index({ loaderData }) {
            return (
              <>
                <p data-root-loader>{loaderData.server}</p>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/loader-only">Loader only</Link>
                <Link to="/action-only">Action only</Link>
              </>
            );
          }
        `,
        "app/routes/loader-only.tsx": js`
          export async function loader() {
            return { server: "loader-only" };
          }

          export default function LoaderOnly({ loaderData }) {
            return <p data-loader-only>{loaderData.server}</p>;
          }
        `,
        "app/routes/action-only.tsx": js`
          import { Form } from "react-router";

          export function loader() {
            return { ready: true };
          }

          export async function action() {
            return { action: "action-only-server" };
          }

          export default function ActionOnly({ actionData }) {
            return (
              <>
                <p data-action-only>{actionData?.action ?? ""}</p>
                <Form method="post">
                  <button type="submit">Submit action</button>
                </Form>
              </>
            );
          }
        `,
        "app/routes/dashboard.tsx": js`
          import { Form, Link } from "react-router";

          export async function loader() {
            return { server: "server-loader" };
          }

          export async function action() {
            return { action: "server-action" };
          }

          export async function clientLoader({ serverLoader }) {
            let data = await serverLoader();
            return { ...data, client: "client-loader" };
          }

          export async function clientAction({ serverAction }) {
            let data = await serverAction();
            return { ...data, client: "client-action" };
          }

          export default function Dashboard({ loaderData, actionData }) {
            return (
              <>
                <p data-server>{loaderData.server}</p>
                <p data-client>{loaderData.client}</p>
                <p data-action>
                  {actionData?.action ?? ""}:{actionData?.client ?? ""}
                </p>
                <Form method="post">
                  <button type="submit">Submit</button>
                </Form>
                <Link to="/">Home</Link>
              </>
            );
          }
        `,
      },
    });
  });

  async function startServe() {
    servePort = await getPort();
    let serveServer = await spawnTestServer({
      cwd: fixture.projectDir,
      command: [
        process.argv[0],
        "node_modules/@react-router/serve/dist/cli.js",
        "build/server/index.js",
      ],
      env: {
        NODE_ENV: "production",
        PORT: String(servePort),
      },
      regex: new RegExp(`react-router-serve.*localhost:${servePort}\\s`),
    });
    stopServe = serveServer.stop;
  }

  async function startDev() {
    stopDev = await dev({
      cwd: fixture.projectDir,
      port: devPort,
    });
  }

  async function startApp() {
    appFixture = await createAppFixture(fixture, undefined, devPort);
  }

  async function stopServers() {
    stopServe?.();
    stopServe = undefined;
    stopDev?.();
    stopDev = undefined;
    await appFixture?.close();
    appFixture = undefined;
  }

  test.afterEach(stopServers);
  test.afterAll(stopServers);

  test("builds an API-only server with server APIs but no route UI exports", async () => {
    expect(fixture.build?.unstable_apiOnly).toBe(true);
    expect(fixture.build?.routeDiscovery).toEqual({
      mode: "lazy",
      manifestPath: "/__manifest",
    });
    expect(fixture.build?.unstable_apiServerOrigin).toBe(
      `http://localhost:${devPort}`,
    );

    let route = fixture.build?.routes["routes/dashboard"];
    expect(route?.module.loader).toEqual(expect.any(Function));
    expect(route?.module.action).toEqual(expect.any(Function));
    expect(route?.module.default).toBeUndefined();
    expect(route?.module.clientLoader).toBeUndefined();
    expect(route?.module.clientAction).toBeUndefined();
  });

  test("preserves root exports for the generated SPA document", async () => {
    let root = fixture.build?.routes.root;
    expect(root?.module.default).toEqual(expect.any(Function));
    expect(root?.module.HydrateFallback).toEqual(expect.any(Function));

    let document = await readFile(
      path.join(fixture.projectDir, "build/client/index.html"),
      "utf8",
    );
    expect(document).toContain("Loading...");
  });

  test("handles server data requests and rejects document requests", async () => {
    await startServe();

    let loaderData = await fixture.requestSingleFetchData("/dashboard.data");
    expect(loaderData.status).toBe(200);
    expect(loaderData.data).toMatchObject({
      "routes/dashboard": { data: { server: "server-loader" } },
    });

    let actionData = await fixture.requestSingleFetchData("/dashboard.data", {
      method: "POST",
      body: new URLSearchParams(),
    });
    expect(actionData.status).toBe(200);
    expect(actionData.data).toMatchObject({
      data: { action: "server-action" },
    });

    let documentResponse = await fixture.requestDocument("/dashboard");
    expect(documentResponse.status).toBe(404);

    let serveDocumentResponse = await fetch(`http://localhost:${servePort}/`);
    expect(serveDocumentResponse.status).toBe(200);
    expect(await serveDocumentResponse.text()).toContain(
      "window.__reactRouterContext",
    );

    let serveAssetResponse = await fetch(
      `http://localhost:${servePort}${fixture.build!.assets.entry.module}`,
    );
    expect(serveAssetResponse.status).toBe(200);
  });

  test("handles document requests in development mode", async () => {
    let build = fixture.build;
    expect(build).not.toBeNull();

    let response = await createRequestHandler(
      build!,
      ServerMode.Development,
    )(new Request("http://localhost/"));
    expect(response.status).toBe(200);
  });

  test("does not produce a hydration error in development mode", async ({
    page,
  }) => {
    await startDev();

    let errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`http://localhost:${devPort}/`);
    await expect(page.locator("[data-root-loader]")).toHaveText("root-loader");
    await page.waitForTimeout(1000);
    expect(errors.filter((error) => error.includes("Hydration"))).toEqual([]);
  });

  test("navigates and runs clientLoader through serverLoader", async ({
    page,
  }) => {
    await startApp();

    let app = new PlaywrightFixture(appFixture!, page);
    await app.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/dashboard");

    await expect(page.locator("[data-server]")).toHaveText("server-loader");
    await expect(page.locator("[data-client]")).toHaveText("client-loader");
    await app.clickLink("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/loader-only");
    await expect(page.locator("[data-loader-only]")).toHaveText("loader-only");
  });

  test("submits a Form through clientAction to the server action", async ({
    page,
  }) => {
    await startApp();

    let app = new PlaywrightFixture(appFixture!, page);
    await app.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/dashboard");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("[data-action]")).toHaveText(
      "server-action:client-action",
    );
  });

  test("submits a Form directly to a server action without a clientAction", async ({
    page,
  }) => {
    await startApp();

    let app = new PlaywrightFixture(appFixture!, page);
    await app.goto("/action-only");
    await page.getByRole("button", { name: "Submit action" }).click();

    await expect(page.locator("[data-action-only]")).toHaveText(
      "action-only-server",
    );
  });
});

test("rejects API-only mode in RSC Framework Mode", async () => {
  let cwd = await createProject(
    {
      "react-router.config.ts": reactRouterConfig({
        ssr: "unstable_api-only",
      }),
    },
    "rsc-vite-framework",
  );

  let result = build({ cwd });
  expect(result.status).toBe(1);
  expect(result.stderr.toString()).toContain(
    'RSC Framework Mode does not currently support the following React Router config:\n - ssr: "unstable_api-only"',
  );
});

test.describe("API-only prerender config", () => {
  test("prerenders routes with an explicit path config", async () => {
    let cwd = await createProject({
      "react-router.config.ts": reactRouterConfig({
        ssr: "unstable_api-only",
        prerender: ["/"],
      }),
      "app/root.tsx": js`
        import { Outlet, Scripts } from "react-router";
        export function Layout({ children }) {
          return <html><head /><body>{children}<Scripts /></body></html>;
        }
        export function HydrateFallback() { return <p>API_ONLY_SHELL</p>; }
        export default function Root() { return <Outlet />; }
      `,
      "app/routes/_index.tsx": js`
        export function loader() { return { message: "PRERENDER_DATA" }; }
        export default function Index({ loaderData }) {
          return <p>PRERENDER_UI: {loaderData.message}</p>;
        }
      `,
    });

    let result = build({ cwd });
    expect(result.status, result.stderr.toString()).toBe(0);
    let document = await readFile(
      path.join(cwd, "build/client/index.html"),
      "utf8",
    );
    expect(document).toContain("PRERENDER_UI");
    expect(document).toContain("PRERENDER_DATA");
    let data = await readFile(path.join(cwd, "build/client/_.data"), "utf8");
    expect(data).toContain("PRERENDER_DATA");
    let shell = await readFile(
      path.join(cwd, "build/client/__spa-fallback.html"),
      "utf8",
    );
    expect(shell).toContain("API_ONLY_SHELL");
    expect(shell).not.toContain("PRERENDER_UI");
  });

  ["undefined", "false"].forEach((prerender) => {
    test(`generates the SPA shell with prerender: ${prerender}`, async () => {
      let cwd = await createProject({
        "react-router.config.ts": js`
          export default { ssr: "unstable_api-only", prerender: ${prerender} };
        `,
        "app/root.tsx": js`
          import { Outlet, Scripts } from "react-router";

          export function Layout({ children }) {
            return <html><head /><body>{children}<Scripts /></body></html>;
          }

          export function HydrateFallback() { return <p>API_ONLY_SHELL</p>; }
          export default function Root() { return <Outlet />; }
        `,
        "app/routes/_index.tsx": js`
          export function loader() { return { message: "API_ONLY_LOADER" }; }
          export default function Index() { throw new Error("Route UI rendered at build time"); }
        `,
      });

      let result = build({ cwd });
      expect(result.status, result.stderr.toString()).toBe(0);
      let document = await readFile(
        path.join(cwd, "build/client/index.html"),
        "utf8",
      );
      expect(document).toContain("API_ONLY_SHELL");
      let serverBuild = await readFile(
        path.join(cwd, "build/server/index.js"),
        "utf8",
      );
      expect(serverBuild).toContain("API_ONLY_LOADER");
      expect(serverBuild).not.toContain("Route UI rendered at build time");
    });
  });
});

for (let splitRouteModules of [false, true]) {
  test.describe(`API-only prerender runtime: splitRouteModules=${splitRouteModules}`, () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        useReactRouterServe: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: "unstable_api-only",
            splitRouteModules,
            prerender: ["/", "/about", "/no-loader", "/resource.json"],
          }),
          "app/root.tsx": js`
            import { useEffect, useState } from "react";
            import { Outlet, Scripts } from "react-router";
            export function Layout({ children }) {
              let [mounted, setMounted] = useState(false);
              useEffect(() => setMounted(true), []);
              return <html><head /><body>
                {mounted ? <p data-mounted>Mounted</p> : null}
                {children}<Scripts />
              </body></html>;
            }
            export function HydrateFallback() { return <p>API_ONLY_SHELL</p>; }
            export default function Root() { return <Outlet />; }
          `,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export function loader() {
              return { message: process.env.IS_RR_BUILD_REQUEST === "yes" ? "BUILD_DATA" : "RUNTIME_DATA" };
            }
            export default function Index({ loaderData }) {
              return <><p data-index>INDEX_UI: {loaderData.message}</p>
                <Link to="/runtime">Runtime</Link>
                <Link to="/about">About</Link>
              </>;
            }
          `,
          "app/routes/about.tsx": js`
            import { Link } from "react-router";
            export function loader() { return { message: "ABOUT_DATA" }; }
            export default function About({ loaderData }) {
              return <><p data-about>ABOUT_UI: {loaderData.message}</p>
                <Link to="/runtime">Runtime</Link>
              </>;
            }
          `,
          "app/routes/no-loader.tsx": js`
            export default function NoLoader() { return <p>NO_LOADER_UI</p>; }
          `,
          "app/routes/resource[.json].tsx": js`
            export function loader() { return Response.json({ message: "RESOURCE_DATA" }); }
          `,
          "app/routes/runtime.tsx": js`
            import { Form } from "react-router";
            let count = 0;
            export function loader() { return { count }; }
            export function action() { count++; return null; }
            export default function Runtime({ loaderData }) {
              return <><p data-count>RUNTIME_UI: {loaderData.count}</p>
                <Form method="post"><button type="submit">Increment</button></Form>
              </>;
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(async () => {
      await appFixture?.close();
    });

    test("serves prerendered documents through react-router-serve", async () => {
      let response = await fetch(`${appFixture.serverUrl}/about/`);
      expect(response.status).toBe(200);
      let document = await response.text();
      expect(document).toContain("ABOUT_UI");
      expect(document).not.toContain("INDEX_UI");
    });

    test("serves the SPA fallback through react-router-serve", async () => {
      let response = await fetch(`${appFixture.serverUrl}/runtime`);
      expect(response.status).toBe(200);
      let document = await response.text();
      expect(document).toContain("API_ONLY_SHELL");
      expect(document).not.toContain("INDEX_UI");
    });

    test("renders routes with and without loaders and resource routes at build time", async () => {
      let clientDir = path.join(fixture.projectDir, "build/client");
      expect(
        await readFile(path.join(clientDir, "index.html"), "utf8"),
      ).toContain("INDEX_UI");
      expect(
        await readFile(path.join(clientDir, "about/index.html"), "utf8"),
      ).toContain("ABOUT_UI");
      expect(
        await readFile(path.join(clientDir, "no-loader/index.html"), "utf8"),
      ).toContain("NO_LOADER_UI");
      expect(
        JSON.parse(
          await readFile(path.join(clientDir, "resource.json"), "utf8"),
        ),
      ).toEqual({ message: "RESOURCE_DATA" });
    });

    test("hydrates prerendered data and navigates to runtime loaders and actions", async ({
      page,
    }) => {
      let dataRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname.endsWith(".data")) {
          dataRequests.push(request.url());
        }
      });
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await expect(page.locator("[data-mounted]")).toBeVisible();
      await expect(page.locator("[data-index]")).toHaveText(
        "INDEX_UI: BUILD_DATA",
      );
      expect(dataRequests).toEqual([]);
      await page.getByRole("link", { name: "About", exact: true }).click();
      await expect(page.locator("[data-about]")).toHaveText(
        "ABOUT_UI: ABOUT_DATA",
      );
      await page.getByRole("link", { name: "Runtime", exact: true }).click();
      await expect(page.locator("[data-count]")).toHaveText("RUNTIME_UI: 0");
      await page.getByRole("button", { name: "Increment" }).click();
      await expect(page.locator("[data-count]")).toHaveText("RUNTIME_UI: 1");
    });

    test("hydrates the SPA fallback on a non-prerendered route", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/runtime");
      await expect(page.locator("[data-mounted]")).toBeVisible();
      await expect(page.locator("[data-count]")).toContainText("RUNTIME_UI:");
      await expect(page.locator("[data-index]")).toHaveCount(0);
    });

    test("serves runtime data for prerendered and non-prerendered routes", async () => {
      let index = await fixture.requestSingleFetchData("/_.data");
      expect(index.status).toBe(200);
      expect(index.data).toMatchObject({
        "routes/_index": { data: { message: "RUNTIME_DATA" } },
      });
      let runtime = await fixture.requestSingleFetchData("/runtime.data");
      expect(runtime.status).toBe(200);
      expect(runtime.data).toMatchObject({
        "routes/runtime": { data: { count: expect.any(Number) } },
      });
    });

    test("rejects production document requests even with build-time headers", async () => {
      for (let route of ["/", "/about", "/runtime", "/resource.json"]) {
        for (let headers of [
          undefined,
          new Headers({ "X-React-Router-Prerender": "yes" }),
          new Headers({
            "X-React-Router-SPA-Mode": "yes",
            "X-React-Router-Prerender-Data": "spoofed",
          }),
        ]) {
          let response = await fixture.requestDocument(route, { headers });
          expect(response.status).toBe(404);
        }
      }
    });
  });
}

for (let discoveryMode of ["initial", "lazy"] as const) {
  test.describe(`API-only revalidation and discovery: ${discoveryMode}`, () => {
    test.describe.configure({ mode: "default" });

    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: "unstable_api-only",
            routeDiscovery:
              discoveryMode === "initial" ? { mode: "initial" } : undefined,
          }),
          "app/state.server.ts": js`
            export let state = { value: 0, parentCalls: 0, clientCalls: 0 };
          `,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Index() {
              return <>
                <Link to="/counter" discover="none">Counter</Link>
                <Link to="/delegated" discover="none">Delegated</Link>
              </>;
            }
          `,
          "app/routes/counter.tsx": js`
            import { Form, Link } from "react-router";
            import { state } from "../state.server";

            export function loader({ request }) {
              return {
                value: state.value,
                query: new URL(request.url).searchParams.get("query") ?? "initial",
              };
            }

            export function action() {
              state.value++;
              return { updated: true };
            }

            export default function Counter({ loaderData, actionData }) {
              return <>
                <p data-value>{loaderData.value}</p>
                <p data-query>{loaderData.query}</p>
                <p data-action>{actionData?.updated ? "updated" : "idle"}</p>
                <Form method="post"><button type="submit">Increment</button></Form>
                <Link to="?query=changed">Change query</Link>
              </>;
            }
          `,
          "app/routes/delegated.tsx": js`
            export { loader, action, default } from "./counter";
            export function shouldRevalidate({ defaultShouldRevalidate }) {
              return defaultShouldRevalidate;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet } from "react-router";
            import { state } from "../state.server";

            export function loader({ request }) {
              if (new URL(request.url).pathname.startsWith("/client")) {
                state.clientCalls++;
              } else {
                state.parentCalls++;
              }
              return { ready: true };
            }

            export function shouldRevalidate() { return false; }

            export default function Parent() {
              return <>
                <Link to="two" discover="none">Next child</Link>
                <Outlet />
              </>;
            }
          `,
          "app/routes/client.tsx": js`
            export { loader, default } from "./parent";
            export function clientLoader({ serverLoader }) { return serverLoader(); }
            export function shouldRevalidate() { return true; }
          `,
          "app/routes/parent.one.tsx": js`
            export function loader() { return "one"; }
            export default function Child({ loaderData }) {
              return <p data-child>{loaderData}</p>;
            }
          `,
          "app/routes/parent.two.tsx": js`
            export function loader() { return "two"; }
            export default function Child({ loaderData }) {
              return <p data-child>{loaderData}</p>;
            }
          `,
          "app/routes/client.one.tsx": js`
            export { loader, default } from "./parent.one";
          `,
          "app/routes/client.two.tsx": js`
            export { loader, default } from "./parent.two";
          `,
          "app/routes/stats.ts": js`
            import { state } from "../state.server";
            export function headers({ loaderHeaders }) { return loaderHeaders; }
            export function loader() {
              return Response.json(state, { headers: {
                "X-Parent-Calls": String(state.parentCalls),
                "X-Client-Calls": String(state.clientCalls),
              } });
            }
          `,
        },
      });
    });

    test.beforeEach(async () => {
      appFixture = await createAppFixture(fixture);
    });

    test.afterEach(async () => {
      await appFixture?.close();
    });

    ["counter", "delegated"].forEach((route) => {
      test(`revalidates ${route} loader data after actions and search changes`, async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/");
        await expect(
          page.getByRole("link", { name: "Counter", exact: true }),
        ).toBeVisible();
        if (discoveryMode === "lazy") {
          expect(
            await page.evaluate(
              (id) =>
                (
                  window as unknown as {
                    __reactRouterManifest: AssetsManifest;
                  }
                ).__reactRouterManifest.routes[id],
              `routes/${route}`,
            ),
          ).toBeUndefined();
        }
        await app.clickLink(`/${route}`);
        await expect(page.locator("[data-query]")).toHaveText("initial");
        let value = Number(await page.locator("[data-value]").textContent());

        await page.getByRole("button", { name: "Increment" }).click();
        await expect(page.locator("[data-action]")).toHaveText("updated");
        await expect(page.locator("[data-value]")).toHaveText(
          String(value + 1),
        );

        await page.getByRole("link", { name: "Change query" }).click();
        await expect(page.locator("[data-query]")).toHaveText("changed");
      });
    });

    test("does not run server loaders that opt out of revalidation", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent/one");
      await expect(page.locator("[data-child]")).toHaveText("one");
      let before = await fixture.requestSingleFetchData("/stats.data");
      let calls = before.headers.get("X-Parent-Calls");
      expect(Number(calls)).toBeGreaterThan(0);

      await app.clickLink("/parent/two");
      await expect(page.locator("[data-child]")).toHaveText("two");
      let after = await fixture.requestSingleFetchData("/stats.data");
      expect(after.headers.get("X-Parent-Calls")).toBe(calls);
    });

    test("does not duplicate serverLoader calls in the combined request", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/client/one");
      await expect(page.locator("[data-child]")).toHaveText("one");
      let before = await fixture.requestSingleFetchData("/stats.data");
      let calls = Number(before.headers.get("X-Client-Calls"));
      expect(calls).toBeGreaterThan(0);

      await app.clickLink("/client/two");
      await expect(page.locator("[data-child]")).toHaveText("two");
      let after = await fixture.requestSingleFetchData("/stats.data");
      expect(Number(after.headers.get("X-Client-Calls"))).toBe(calls + 1);
    });
  });
}
