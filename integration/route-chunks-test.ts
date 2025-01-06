import { test, expect, type Page } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import {
  createProject,
  dev,
  build,
  reactRouterServe,
  viteConfig,
  createEditor,
  reactRouterConfig,
} from "./helpers/vite.js";

const js = String.raw;

const files = {
  "app/routes/_index.tsx": js`
    import { useState, useEffect } from "react";
    import { Link } from "react-router";

    export default function IndexRoute() {
      return (
        <ul>
          <li>
            <Link to="/chunkable">/chunkable</Link>
          </li>
          <li>
            <Link to="/unchunkable">/unchunkable</Link>
          </li>
        </ul>
      );
    }
  `,
  "app/routes/chunkable.tsx": js`
    import { useLoaderData, useActionData, Form } from "react-router";

    // Variable name is globally unique to prevent name mangling, e.g.
    // inChunkableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inChunkableMainChunk = () => console.log() || true;

    export const clientLoader = () => {
      // UNCOMMENT TO DE-OPT CLIENT LOADER: inChunkableMainChunk();
      // eval is used here to avoid a chunking de-opt:
      return "clientLoader in main chunk: " + eval("typeof inChunkableMainChunk === 'function'");
    };

    export const clientAction = (function() {
      // UNCOMMENT TO DE-OPT CLIENT ACTION: inChunkableMainChunk();
      (globalThis as any).chunkableClientActionDownloaded = true;
      // eval is used here to avoid a chunking de-opt:
      return () => "clientAction in main chunk: " + eval("typeof inChunkableMainChunk === 'function'");
    })();

    export default function ChunkableRoute() {
      inChunkableMainChunk();
      const loaderData = useLoaderData();
      const actionData = useActionData();
      return (
        <>
          <div data-loader-data>loaderData = {JSON.stringify(loaderData)}</div>
          <div data-action-data>actionData = {JSON.stringify(actionData)}</div>
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,

  "app/routes/unchunkable.tsx": js`
    import { useLoaderData, useActionData, Form } from "react-router";

    // Variable name is globally unique to prevent name mangling, e.g.
    // inUnchunkableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inUnchunkableMainChunk = () => console.log() || true;

    export const clientLoader = () => {
      /* COMMENT THIS LINE TO CHUNK CLIENT LOADER: */ inUnchunkableMainChunk();
      // eval is used here to avoid a chunking de-opt:
      return "clientLoader in main chunk: " + eval("typeof inUnchunkableMainChunk === 'function'");
    };

    export const clientAction = (function() {
      /* COMMENT THIS LINE TO CHUNK CLIENT ACTION: */ inUnchunkableMainChunk();
      (globalThis as any).unchunkableClientActionDownloaded = true;
      // eval is used here to avoid a chunking de-opt:
      return () => "clientAction in main chunk: " + eval("typeof inUnchunkableMainChunk === 'function'");
    })();

    export default function UnchunkableRoute() {
      inUnchunkableMainChunk();
      const loaderData = useLoaderData();
      const actionData = useActionData();
      return (
        <>
          <div data-loader-data>loaderData = {JSON.stringify(loaderData)}</div>
          <div data-action-data>actionData = {JSON.stringify(actionData)}</div>
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,
};

test.describe("Route chunks", async () => {
  test.describe("enabled", () => {
    let routeChunks = true;
    let port: number;
    let cwd: string;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ routeChunks }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
    });

    test("development", async ({ page }) => {
      await workflow({ cwd, page, port, routeChunks, mode: "development" });
    });

    test("production", async ({ page }) => {
      await workflow({ cwd, page, port, routeChunks, mode: "production" });
    });
  });

  test.describe("disabled", () => {
    let routeChunks = false;
    let port: number;
    let cwd: string;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ routeChunks }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
    });

    test("development", async ({ page }) => {
      await workflow({ cwd, page, port, routeChunks, mode: "development" });
    });

    test("production", async ({ page }) => {
      await workflow({ cwd, page, port, routeChunks, mode: "production" });
    });
  });

  test.describe("enforce", () => {
    let routeChunks = "enforce" as const;
    let port: number;
    let cwd: string;

    test.describe("chunkable routes", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({ routeChunks }),
          "vite.config.js": await viteConfig.basic({ port }),
          ...files,
          "app/routes/unchunkable.tsx": files["app/routes/chunkable.tsx"],
        });
      });

      test("build passes", async () => {
        let { status } = build({ cwd });
        expect(status).toBe(0);
      });
    });

    test.describe("unchunkable routes", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({ routeChunks }),
          "vite.config.js": await viteConfig.basic({ port }),
          ...files,
        });
      });

      test("build fails", async () => {
        let { stderr, status } = build({ cwd });
        expect(status).toBe(1);
        expect(stderr.toString()).toMatch(
          dedent`
            Route chunks error: routes/unchunkable.tsx
            
            - clientAction
            - clientLoader

            These exports were unable to be split into their own chunks because they reference code in the same file that is used by other route module exports.
            
            If you need to share code between these and other exports, you should extract the shared code into a separate module.
          `
        );
      });
    });
  });
});

async function workflow({
  cwd,
  page,
  port,
  routeChunks,
  mode,
}: {
  cwd: string;
  page: Page;
  port: number;
  routeChunks: boolean;
  mode: "development" | "production";
}) {
  let stopServer =
    mode === "development"
      ? await dev({ cwd, port })
      : await reactRouterServe({ cwd, port });

  let edit = createEditor(cwd);

  let isDev = mode === "development";
  let isProd = mode === "production";

  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
  expect(pageErrors).toEqual([]);

  async function hasChunkableClientActionDownloaded() {
    return await page.evaluate(() =>
      Boolean((globalThis as any).chunkableClientActionDownloaded)
    );
  }

  async function hasUnchunkableClientActionDownloaded() {
    return await page.evaluate(() =>
      Boolean((globalThis as any).unchunkableClientActionDownloaded)
    );
  }

  if (routeChunks) {
    // Ensure chunkable client loader is not in main chunk
    await page.getByRole("link", { name: "/chunkable" }).click();
    await expect(page.locator("[data-loader-data]")).toHaveText(
      'loaderData = "clientLoader in main chunk: false"'
    );

    // Ensure chunkable client action hasn't downloaded yet
    if (isProd) {
      expect(await hasChunkableClientActionDownloaded()).toBe(false);
    }

    // Ensure chunkable client action is not in main chunk
    await page.getByRole("button").click();
    await expect(page.locator("[data-action-data]")).toHaveText(
      'actionData = "clientAction in main chunk: false"'
    );

    // Ensure the previous `hasChunkableClientActionDownloaded` check is valid
    if (isProd) {
      expect(await hasChunkableClientActionDownloaded()).toBe(true);
    }

    if (isDev) {
      // Test HMR when an edit causes a client loader de-opt and then back again

      // Ensure page doesn't reload
      await page.locator('input[type="text"]').fill("stateful");

      let revert = await edit("app/routes/chunkable.tsx", (contents) =>
        contents
          .replace("// UNCOMMENT TO DE-OPT CLIENT LOADER: ", "")
          .replace("// UNCOMMENT TO DE-OPT CLIENT ACTION: ", "")
      );

      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );

      await revert();

      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: false"'
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"'
      );

      // Ensure page hasn't reloaded
      await expect(page.locator('input[type="text"]')).toHaveValue("stateful");

      expect(pageErrors).toEqual([]);
    }

    await page.goBack();
  }
  await page.getByRole("link", { name: "/unchunkable" }).click();
  await expect(page.locator("[data-loader-data]")).toHaveText(
    'loaderData = "clientLoader in main chunk: true"'
  );

  // Ensure unchunkable client action downloads at the same time as the rest of
  // the route module
  if (isProd) {
    expect(await hasUnchunkableClientActionDownloaded()).toBe(true);
  }

  await page.getByRole("button").click();
  await expect(page.locator("[data-action-data]")).toHaveText(
    'actionData = "clientAction in main chunk: true"'
  );

  // Test HMR when an edit causes an opt and then back again
  if (routeChunks && isDev) {
    // Ensure page doesn't reload
    await page.locator('input[type="text"]').fill("stateful");

    let revert = await edit("app/routes/unchunkable.tsx", (contents) =>
      contents
        .replace("/* COMMENT THIS LINE TO CHUNK CLIENT LOADER: */", "//")
        .replace("/* COMMENT THIS LINE TO CHUNK CLIENT ACTION: */", "//")
    );

    await expect(page.locator("[data-loader-data]")).toHaveText(
      'loaderData = "clientLoader in main chunk: false"'
    );
    await page.getByRole("button").click();
    await expect(page.locator("[data-action-data]")).toHaveText(
      'actionData = "clientAction in main chunk: false"'
    );

    await revert();

    await expect(page.locator("[data-loader-data]")).toHaveText(
      'loaderData = "clientLoader in main chunk: true"'
    );
    await page.getByRole("button").click();
    await expect(page.locator("[data-action-data]")).toHaveText(
      'actionData = "clientAction in main chunk: true"'
    );

    // Ensure page hasn't reloaded
    await expect(page.locator('input[type="text"]')).toHaveValue("stateful");

    expect(pageErrors).toEqual([]);
  }

  if (routeChunks) {
    // Ensure chunkable client loader works during SSR
    await page.goto(`http://localhost:${port}/chunkable`);
    await expect(page.locator("[data-loader-data]")).toHaveText(
      'loaderData = "clientLoader in main chunk: false"'
    );
  }

  // Ensure unchunkable client loader works during SSR
  await page.goto(`http://localhost:${port}/unchunkable`);
  await expect(page.locator("[data-loader-data]")).toHaveText(
    `loaderData = "clientLoader in main chunk: true"`
  );

  stopServer();
}
