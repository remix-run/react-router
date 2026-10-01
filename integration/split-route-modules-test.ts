import { test, expect, type Page } from "@playwright/test";
import { globSync, readFileSync } from "node:fs";
import { SourceMap } from "node:module";
import path from "node:path";
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
      const pollingPromise = (async () => {
        while (globalThis.blockClientLoader !== false) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      })();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Client loader wasn't unblocked after 5s")), 5000);
      });
      await Promise.race([pollingPromise, timeoutPromise]);
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
          <h1>Splittable Route</h1>
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
      const pollingPromise = (async () => {
        while (globalThis.blockClientLoader !== false) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      })();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Client loader wasn't unblocked after 5s")), 5000);
      });
      await Promise.race([pollingPromise, timeoutPromise]);
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
          <h1>Unsplittable Route</h1>
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
      const pollingPromise = (async () => {
        while (globalThis.blockClientLoader !== false) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      })();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Client loader wasn't unblocked after 2s")), 2000);
      });
      await Promise.race([pollingPromise, timeoutPromise]);
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
          <h1>Mixed Route</h1>
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
    Boolean((globalThis as any).splittableHydrateFallbackDownloaded),
  );
}

async function unsplittableHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).unsplittableHydrateFallbackDownloaded),
  );
}
async function mixedHydrateFallbackDownloaded(page: Page) {
  return await page.evaluate(() =>
    Boolean((globalThis as any).mixedHydrateFallbackDownloaded),
  );
}

async function unblockClientLoader(page: Page) {
  await page.evaluate(() => {
    (globalThis as any).blockClientLoader = false;
  });
}

test.describe("Split route modules", async () => {
  test("emits source maps for split route chunks", async () => {
    let marker = "SPLIT_ROUTE_SOURCE_MAP_TEST";
    let cwd = await createProject({
      "react-router.config.ts": reactRouterConfig({
        splitRouteModules: true,
      }),
      "vite.config.js": await viteConfig.basic({ sourcemap: true }),
      "app/routes/_index.tsx": js`
        export async function clientLoader() {
          throw new Error("${marker}");
        }

        export default function Index() {
          return <h1>Index</h1>;
        }
      `,
    });

    let { status, stderr } = build({ cwd });
    expect(status).toBe(0);
    expect(stderr.toString()).not.toContain("SOURCEMAP_BROKEN");

    let chunkPath = globSync(path.join(cwd, "build/client/assets/*.js")).find(
      (file) => readFileSync(file, "utf8").includes(marker),
    );
    expect(chunkPath).toBeDefined();

    let chunk = readFileSync(chunkPath!, "utf8");
    let markerOffset = chunk.indexOf(marker);
    let generatedLines = chunk.slice(0, markerOffset).split("\n");
    let generatedLine = generatedLines.length - 1;
    let generatedColumn = generatedLines.at(-1)!.length;

    let map = JSON.parse(readFileSync(`${chunkPath}.map`, "utf8"));
    let entry = new SourceMap(map).findEntry(generatedLine, generatedColumn);
    if (!("originalSource" in entry)) {
      throw new Error("Expected to find a source map entry for the marker");
    }
    expect(entry.originalSource?.split("?")[0].replaceAll("\\", "/")).toMatch(
      /app\/routes\/_index\.tsx$/,
    );

    let sourceIndex = map.sources.findIndex((source: string) =>
      source
        .split("?")[0]
        .replaceAll("\\", "/")
        .endsWith("app/routes/_index.tsx"),
    );
    expect(sourceIndex).not.toBe(-1);
    let source = map.sourcesContent[sourceIndex];
    expect(source).toContain(marker);
    let originalMarkerOffset = source.indexOf(marker);
    let originalLine =
      source.slice(0, originalMarkerOffset).split("\n").length - 1;
    expect(entry.originalLine).toBe(originalLine);
  });

  test.describe("enabled", () => {
    let port: number;
    let cwd: string;
    let stop: Awaited<ReturnType<typeof reactRouterServe>>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig(),
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
      await unblockClientLoader(page);
      expect(pageErrors).toEqual([]);

      // Ensure splittable exports are not in main chunk
      await page.getByRole("link", { name: "/splittable" }).click();
      await expect(page.getByText("Splittable Route")).toBeVisible();
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(false);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`,
      );
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(false);
      expect(page.locator("[data-loader-data]")).toHaveCSS("padding", "20px");
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"',
      );
      expect(page.locator("[data-action-data]")).toHaveCSS("padding", "20px");

      await page.goBack();

      // Ensure unsplittable exports are in main chunk
      await page.getByRole("link", { name: "/unsplittable" }).click();
      await expect(page.getByText("Unsplittable Route")).toBeVisible();
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"',
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"',
      );

      await page.goBack();

      // Ensure mix of splittable and unsplittable exports are handled correctly.
      // Note that only the client action is in its own chunk.
      await page.getByRole("link", { name: "/mixed" }).click();
      await expect(page.getByText("Mixed Route")).toBeVisible();
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"',
      );
      expect(await mixedHydrateFallbackDownloaded(page)).toBe(true);
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: false"',
      );

      // Ensure splittable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/splittable`);
      await expect(page.locator("[data-hydrate-fallback]")).toHaveText(
        "Loading...",
      );
      await expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px",
      );
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(true);
      await unblockClientLoader(page);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: false"`,
      );
      await expect(page.locator("[data-loader-data]")).toHaveCSS(
        "padding",
        "20px",
      );

      // Ensure unsplittable HydrateFallback and client loader work during SSR
      await page.goto(`http://localhost:${port}/unsplittable`);
      await expect(page.locator("[data-hydrate-fallback]")).toHaveText(
        "Loading...",
      );
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await unblockClientLoader(page);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`,
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
        "react-router.config.ts": reactRouterConfig({
          splitRouteModules,
        }),
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
      await unblockClientLoader(page);
      expect(pageErrors).toEqual([]);

      // Ensure splittable exports are kept in main chunk
      await page.getByRole("link", { name: "/splittable" }).click();
      await expect(page.getByText("Splittable Route")).toBeVisible();
      expect(await splittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`,
      );
      await expect(page.locator("[data-loader-data]")).toHaveCSS(
        "padding",
        "20px",
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"',
      );
      await expect(page.locator("[data-action-data]")).toHaveCSS(
        "padding",
        "20px",
      );

      await page.goBack();

      // Ensure unsplittable exports are kept in main chunk
      await page.getByRole("link", { name: "/unsplittable" }).click();
      await expect(page.getByText("Unsplittable Route")).toBeVisible();
      expect(await unsplittableHydrateFallbackDownloaded(page)).toBe(true);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        'loaderData = "clientLoader in main chunk: true"',
      );
      await page.getByRole("button").click();
      await expect(page.locator("[data-action-data]")).toHaveText(
        'actionData = "clientAction in main chunk: true"',
      );

      // Ensure splittable client loader works during SSR
      await page.goto(`http://localhost:${port}/splittable`);
      await expect(page.locator("[data-hydrate-fallback]")).toHaveText(
        "Loading...",
      );
      await expect(page.locator("[data-hydrate-fallback]")).toHaveCSS(
        "padding",
        "20px",
      );
      await unblockClientLoader(page);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`,
      );

      // Ensure unsplittable client loader works during SSR
      await page.goto(`http://localhost:${port}/unsplittable`);
      await expect(page.locator("[data-hydrate-fallback]")).toHaveText(
        "Loading...",
      );
      await unblockClientLoader(page);
      await expect(page.locator("[data-loader-data]")).toHaveText(
        `loaderData = "clientLoader in main chunk: true"`,
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
          "react-router.config.ts": reactRouterConfig({
            splitRouteModules,
          }),
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

    test.describe("splittable routes with splittable root route exports", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({
            splitRouteModules,
          }),
          "vite.config.js": await viteConfig.basic({ port }),
          "app/root.tsx": js`
            import { Outlet } from "react-router";
            export const clientLoader = () => null;
            export const clientAction = () => null;
            export default function() {
              return <Outlet />;
            }
          `,
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

    test.describe("splittable routes with unsplittable root route exports", () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject({
          "react-router.config.ts": reactRouterConfig({
            splitRouteModules,
          }),
          "vite.config.js": await viteConfig.basic({ port }),
          "app/root.tsx": js`
            import { Outlet } from "react-router";
            const shared = null;
            export const clientLoader = () => shared;
            export const clientAction = () => shared;
            export default function() {
              return <Outlet />;
            }
          `,
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
          "react-router.config.ts": reactRouterConfig({
            splitRouteModules,
          }),
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
          `,
        );
      });
    });
  });
});
