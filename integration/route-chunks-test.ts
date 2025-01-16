import { test, expect, type Page } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import {
  createProject,
  build,
  reactRouterServe,
  viteConfig,
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
          <li>
            <Link to="/mixed">/mixed</Link>
          </li>
        </ul>
      );
    }
  `,
  "app/routes/chunkable/route.tsx": js`
    import { useLoaderData, useActionData, Form } from "react-router";
    
    // Ensure these style imports are still included in the page even though
    // they're not used in the main chunk
    import clientLoaderStyles from "./clientLoader.module.css";
    import clientActionStyles from "./clientAction.module.css";
    import hydrateFallbackStyles from "./hydrateFallback.module.css";

    // Usage of this exported function forces any consuming code into the main
    // chunk. The variable name is globally unique to prevent name mangling,
    // e.g. inChunkableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inChunkableMainChunk = () => console.log() || true;

    export const clientLoader = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        message: "clientLoader in main chunk: " + eval("typeof inChunkableMainChunk === 'function'"),
        className: clientLoaderStyles.root,
      };
    };

    export const clientAction = (function() {
      (globalThis as any).chunkableClientActionDownloaded = true;
      return () => ({
        message: "clientAction in main chunk: " + eval("typeof inChunkableMainChunk === 'function'"),
        className: clientActionStyles.root,
      });
    })();

    export const HydrateFallback = (function() {
      (globalThis as any).chunkableHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback className={hydrateFallbackStyles.root}>Loading...</div>;
    })();

    export default function ChunkableRoute() {
      inChunkableMainChunk();
      const loaderData = useLoaderData();
      const actionData = useActionData();
      return (
        <>
          <div
            data-loader-data
            className={loaderData?.className}>
            loaderData = {JSON.stringify(loaderData?.message)}
          </div>
          <div
            data-action-data
            className={actionData?.className}>
            actionData = {JSON.stringify(actionData?.message)}
          </div>
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,
  "app/routes/chunkable/clientLoader.module.css": `
    .root { padding: 20px; }
  `,
  "app/routes/chunkable/clientAction.module.css": `
    .root { padding: 20px; }
  `,
  "app/routes/chunkable/hydrateFallback.module.css": `
    .root { padding: 20px; }
  `,

  "app/routes/unchunkable.tsx": js`
    import { useLoaderData, useActionData, Form } from "react-router";

    // Usage of this exported function forces any consuming code into the main
    // chunk. The variable name is globally unique to prevent name mangling,
    // e.g. inUnchunkableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inUnchunkableMainChunk = () => console.log() || true;

    export const clientLoader = async () => {
      inUnchunkableMainChunk();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return "clientLoader in main chunk: " + eval("typeof inUnchunkableMainChunk === 'function'");
    };
 
    export const clientAction = (function() {
      inUnchunkableMainChunk();
      (globalThis as any).unchunkableClientActionDownloaded = true;
      return () => "clientAction in main chunk: " + eval("typeof inUnchunkableMainChunk === 'function'");
    })();

    export const HydrateFallback = (function() {
      inUnchunkableMainChunk();
      (globalThis as any).unchunkableHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback>Loading...</div>;
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

  "app/routes/mixed.tsx": js`
    import { useLoaderData, useActionData, Form } from "react-router";

    // Usage of this exported function forces any consuming code into the main
    // chunk. The variable name is globally unique to prevent name mangling,
    // e.g. inMixedMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inMixedMainChunk = () => console.log() || true;

    export const clientLoader = async () => {
      inMixedMainChunk();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return "clientLoader in main chunk: " + eval("typeof inMixedMainChunk === 'function'");
    };
 
    export const clientAction = (function() {
      (globalThis as any).mixedClientActionDownloaded = true;
      return () => "clientAction in main chunk: " + eval("typeof inMixedMainChunk === 'function'");
    })();

    export const HydrateFallback = (function() {
      inMixedMainChunk();
      (globalThis as any).mixedHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback>Loading...</div>;
    })();

    export default function MixedRoute() {
      inMixedMainChunk();
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

async function chunkableClientActionDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).chunkableClientActionDownloaded)
  );
}

async function chunkableHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).chunkableHydrateFallbackDownloaded)
  );
}

async function unchunkableClientActionDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).unchunkableClientActionDownloaded)
  );
}

async function unchunkableHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).unchunkableHydrateFallbackDownloaded)
  );
}

async function mixedClientActionDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).mixedClientActionDownloaded)
  );
}

async function mixedHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).mixedHydrateFallbackDownloaded)
  );
}

test.describe("Route chunks", async () => {
  test.describe("enabled", () => {
    let routeChunks = true;
    let port: number;
    let cwd: string;
    let stop: Awaited<ReturnType<typeof reactRouterServe>>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ routeChunks }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
      stop = await reactRouterServe({ cwd, port });
    });

    test.afterAll(() => {
      stop();
    });

    test("supports route chunks", async ({ page }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
      expect(pageErrors).toEqual([]);

      // Ensure chunkable exports are not in main chunk
      await page.getByRole("link", { name: "/chunkable" }).click();
      expect(await chunkableHydrateFallbackDownloaded(page)).toBe(false);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`
      );
      expect(await chunkableHydrateFallbackDownloaded(page)).toBe(false);
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");
      expect(await chunkableClientActionDownloaded(page)).toBe(false);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"'
      );
      expect(page.locator("[data-action-data]")).toHaveCSS("padding", "20px");
      expect(await chunkableClientActionDownloaded(page)).toBe(true);

      await page.goBack();

      // Ensure unchunkable exports are in main chunk
      await page.getByRole("link", { name: "/unchunkable" }).click();
      expect(await unchunkableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      expect(await unchunkableClientActionDownloaded(page)).toBe(true);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );

      await page.goBack();

      // Ensure mix of chunkable and unchunkable exports are handled correctly.
      // Note that only the client action is in its own chunk.
      await page.getByRole("link", { name: "/mixed" }).click();
      expect(await mixedHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      expect(await mixedClientActionDownloaded(page)).toBe(false);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"'
      );
      expect(await mixedClientActionDownloaded(page)).toBe(true);

      // Ensure chunkable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/chunkable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px"
      );
      expect(await chunkableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`
      );
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");

      // Ensure unchunkable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/unchunkable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(await unchunkableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
    });
  });

  test.describe("disabled", () => {
    let routeChunks = false;
    let port: number;
    let cwd: string;
    let stop: Awaited<ReturnType<typeof reactRouterServe>>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ routeChunks }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
      stop = await reactRouterServe({ cwd, port });
    });

    test.afterAll(() => {
      stop();
    });

    test("keeps exports in main chunk", async ({ page }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
      expect(pageErrors).toEqual([]);

      // Ensure chunkable exports are kept in main chunk
      await page.getByRole("link", { name: "/chunkable" }).click();
      expect(await chunkableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");
      expect(await chunkableClientActionDownloaded(page)).toBe(true);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );
      expect(page.locator("[data-action-data]")).toHaveCSS("padding", "20px");

      await page.goBack();

      // Ensure unchunkable exports are kept in main chunk
      await page.getByRole("link", { name: "/unchunkable" }).click();
      expect(await unchunkableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      expect(await unchunkableClientActionDownloaded(page)).toBe(true);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );

      // Ensure chunkable client loader works during SSR
      await page.goto(`http://localhost:${port}/chunkable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px"
      );
      expect(await chunkableClientActionDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );

      // Ensure unchunkable client loader works during SSR
      await page.goto(`http://localhost:${port}/unchunkable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(await unchunkableClientActionDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
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
          // Make unchunkable routes valid so the build can pass
          "app/routes/unchunkable.tsx": "export default function(){}",
          "app/routes/mixed.tsx": "export default function(){}",
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
          // Ensure we're only testing the mixed route
          "app/routes/unchunkable.tsx": "export default function(){}",
        });
      });

      test("build fails", async () => {
        let { stderr, status } = build({ cwd });
        expect(status).toBe(1);
        expect(stderr.toString()).toMatch(
          dedent`
            Route chunks error: routes/mixed.tsx
            
            - clientLoader
            - HydrateFallback

            These exports were unable to be split into their own chunks because they reference code in the same file that is used by other route module exports.
            
            If you need to share code between these and other exports, you should extract the shared code into a separate module.
          `
        );
      });
    });
  });
});
