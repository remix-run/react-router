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
            <Link to="/splittable">/splittable</Link>
          </li>
          <li>
            <Link to="/unsplittable">/unsplittable</Link>
          </li>
          <li>
            <Link to="/mixed">/mixed</Link>
          </li>
        </ul>
      );
    }
  `,
  "app/routes/splittable/route.tsx": js`
    import type { Route } from "./+types/splittable/route";
    import { Form } from "react-router";
    
    // Ensure these style imports are still included in the page even though
    // they're not used in the main chunk
    import clientLoaderStyles from "./clientLoader.module.css";
    import clientActionStyles from "./clientAction.module.css";
    import hydrateFallbackStyles from "./hydrateFallback.module.css";

    // Usage of this exported function forces any consuming code into the main
    // chunk. The variable name is globally unique to prevent name mangling,
    // e.g. inSplittableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inSplittableMainChunk = () => console.log() || true;

    export const clientLoader = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        message: "clientLoader in main chunk: " + eval("typeof inSplittableMainChunk === 'function'"),
        className: clientLoaderStyles.root,
      };
    };

    export const clientAction = () => ({
      message: "clientAction in main chunk: " + eval("typeof inSplittableMainChunk === 'function'"),
      className: clientActionStyles.root,
    });

    export const HydrateFallback = (function() {
      (globalThis as any).splittableHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback className={hydrateFallbackStyles.root}>Loading...</div>;
    })();

    export default function SplittableRoute({
      loaderData,
      actionData,
    }: Route.ComponentProps) {
      inSplittableMainChunk();
      return (
        <>
          <div
            data-loader-data
            className={loaderData.className}>
            loaderData = {JSON.stringify(loaderData.message)}
          </div>
          {actionData ? (
            <div
              data-action-data
              className={actionData.className}>
              actionData = {JSON.stringify(actionData.message)}
            </div>
          ) : null}
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,
  "app/routes/splittable/clientLoader.module.css": `
    .root { padding: 20px; }
  `,
  "app/routes/splittable/clientAction.module.css": `
    .root { padding: 20px; }
  `,
  "app/routes/splittable/hydrateFallback.module.css": `
    .root { padding: 20px; }
  `,

  "app/routes/unsplittable.tsx": js`
    import type { Route } from "./+types/unsplittable";
    import { Form } from "react-router";

    // Usage of this exported function forces any consuming code into the main
    // chunk. The variable name is globally unique to prevent name mangling,
    // e.g. inUnsplittableMainChunk$1. The use of console.log prevents dead code
    // elimination in the build by introducing a side effect
    export const inUnsplittableMainChunk = () => console.log() || true;

    export const clientLoader = async () => {
      inUnsplittableMainChunk();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return "clientLoader in main chunk: " + eval("typeof inUnsplittableMainChunk === 'function'");
    };
 
    export const clientAction = () => {
      inUnsplittableMainChunk();
      return "clientAction in main chunk: " + eval("typeof inUnsplittableMainChunk === 'function'");
    }

    export const HydrateFallback = (function() {
      inUnsplittableMainChunk();
      (globalThis as any).unsplittableHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback>Loading...</div>;
    })();

    export default function UnsplittableRoute({
      loaderData,
      actionData,
    }: Route.ComponentProps) {
      inUnsplittableMainChunk();
      return (
        <>
          <div data-loader-data>loaderData = {JSON.stringify(loaderData)}</div>
          {actionData ? (
            <div data-action-data>actionData = {JSON.stringify(actionData)}</div>
          ) : null}
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,

  "app/routes/mixed.tsx": js`
    import type { Route } from "./+types/mixed";
    import { Form } from "react-router";

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
 
    export const clientAction = () => {
      return "clientAction in main chunk: " + eval("typeof inMixedMainChunk === 'function'");
    };

    export const HydrateFallback = (function() {
      inMixedMainChunk();
      (globalThis as any).mixedHydrateFallbackDownloaded = true;
      return () => <div data-hydrate-fallback>Loading...</div>;
    })();

    export default function MixedRoute({
      loaderData,
      actionData,
    }: Route.ComponentProps) {
      inMixedMainChunk();
      return (
        <>
          <div data-loader-data>loaderData = {JSON.stringify(loaderData)}</div>
          {actionData ? (
            <div data-action-data>actionData = {JSON.stringify(actionData)}</div>
          ) : null}
          <input type="text" />
          <Form method="post">
            <button>Submit</button>
          </Form>
        </>
      );
    }
  `,
};

async function splittableHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).splittableHydrateFallbackDownloaded)
  );
}

async function unsplittableHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).unsplittableHydrateFallbackDownloaded)
  );
}
async function mixedHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).mixedHydrateFallbackDownloaded)
  );
}

test.describe("Split route modules", async () => {
  test.describe("enabled", () => {
    let splitRouteModules = true;
    let port: number;
    let cwd: string;
    let stop: Awaited<ReturnType<typeof reactRouterServe>>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ splitRouteModules }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
      stop = await reactRouterServe({ cwd, port });
    });

    test.afterAll(() => {
      stop();
    });

    test("supports splitting route modules", async ({ page }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
      expect(pageErrors).toEqual([]);

      // Ensure splittable exports are not in main chunk
      await page.getByRole("link", { name: "/splittable" }).click();
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(false);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`
      );
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(false);
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"'
      );
      expect(page.locator("[data-action-data]")).toHaveCSS("padding", "20px");

      await page.goBack();

      // Ensure unsplittable exports are in main chunk
      await page.getByRole("link", { name: "/unsplittable" }).click();
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );

      await page.goBack();

      // Ensure mix of splittable and unsplittable exports are handled correctly.
      // Note that only the client action is in its own chunk.
      await page.getByRole("link", { name: "/mixed" }).click();
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      expect(await mixedHydrateFallbackDownloaded(page)).toBe(true);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"'
      );

      // Ensure splittable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/splittable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px"
      );
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`
      );
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");

      // Ensure unsplittable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/unsplittable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
    });
  });

  test.describe("disabled", () => {
    let splitRouteModules = false;
    let port: number;
    let cwd: string;
    let stop: Awaited<ReturnType<typeof reactRouterServe>>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ splitRouteModules }),
        "vite.config.js": await viteConfig.basic({ port }),
        ...files,
      });
      build({ cwd });
      stop = await reactRouterServe({ cwd, port });
    });

    test.afterAll(() => {
      stop();
    });

    test("keeps route module in a single chunk", async ({ page }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
      expect(pageErrors).toEqual([]);

      // Ensure splittable exports are kept in main chunk
      await page.getByRole("link", { name: "/splittable" }).click();
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );
      expect(page.locator("[data-action-data]")).toHaveCSS("padding", "20px");

      await page.goBack();

      // Ensure unsplittable exports are kept in main chunk
      await page.getByRole("link", { name: "/unsplittable" }).click();
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"'
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"'
      );

      // Ensure splittable client loader works during SSR
      await page.goto(`http://localhost:${port}/splittable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px"
      );
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );

      // Ensure unsplittable client loader works during SSR
      await page.goto(`http://localhost:${port}/unsplittable`);
      expect(page.locator("[data-hydrate-fallback]")).toHaveText("Loading...");
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`
      );
    });
  });

  test.describe("enforce", () => {
    let splitRouteModules = "enforce" as const;
    let port: number;
    let cwd: string;

    test.describe("splittable routes", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({ splitRouteModules }),
          "vite.config.js": await viteConfig.basic({ port }),
          // Make unsplittable routes valid so the build can pass
          "app/routes/unsplittable.tsx": "export default function(){}",
          "app/routes/mixed.tsx": "export default function(){}",
        });
      });

      test("build passes", async () => {
        let { status } = build({ cwd });
        expect(status).toBe(0);
      });
    });

    test.describe("unsplittable routes", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({ splitRouteModules }),
          "vite.config.js": await viteConfig.basic({ port }),
          ...files,
          // Ensure we're only testing the mixed route
          "app/routes/unsplittable.tsx": "export default function(){}",
        });
      });

      test("build fails", async () => {
        let { stderr, status } = build({ cwd });
        expect(status).toBe(1);
        expect(stderr.toString()).toMatch(
          dedent`
            Error splitting route module: routes/mixed.tsx
            
            - clientLoader
            - HydrateFallback

            These exports could not be split into their own chunks because they share code with other exports. You should extract any shared code into its own module and then import it within the route module.
          `
        );
      });
    });
  });
});
