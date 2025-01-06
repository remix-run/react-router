import fs from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";

import {
  type Files,
  createProject,
  build,
  test,
  viteConfig,
  createEditor,
  viteMajorTemplates,
} from "./helpers/vite.js";

const js = String.raw;

test.describe("route config", () => {
  viteMajorTemplates.forEach(({ templateName, templateDisplayName }) => {
    test.describe(templateDisplayName, () => {
      test("fails the build if route config is missing", async () => {
        let cwd = await createProject({}, templateName);
        await fs.rm(path.join(cwd, "app/routes.ts"));
        let buildResult = build({ cwd });
        expect(buildResult.status).toBe(1);
        expect(buildResult.stderr.toString()).toContain(
          'Route config file not found at "app/routes.ts"'
        );
      });

      test("fails the build if route config is invalid", async () => {
        let cwd = await createProject(
          { "app/routes.ts": `export default INVALID(` },
          templateName
        );
        let buildResult = build({ cwd });
        expect(buildResult.status).toBe(1);
        expect(buildResult.stderr.toString()).toContain(
          'Route config in "routes.ts" is invalid.'
        );
      });

      test("fails the dev process if route config is initially invalid", async ({
        dev,
      }) => {
        let files: Files = async ({ port }) => ({
          "vite.config.js": await viteConfig.basic({ port }),
          "app/routes.ts": `export default INVALID(`,
        });
        let devError: Error | undefined;
        try {
          await dev(files);
        } catch (error: any) {
          devError = error;
        }
        expect(devError?.toString()).toContain(
          'Route config in "routes.ts" is invalid.'
        );
      });

      test("supports correcting an invalid route config", async ({
        page,
        dev,
      }) => {
        let files: Files = async ({ port }) => ({
          "vite.config.js": await viteConfig.basic({ port }),
          "app/routes.ts": js`
            import { type RouteConfig, index } from "@react-router/dev/routes";

            export default [
              index("test-route-1.tsx"),
            ] satisfies RouteConfig;
          `,
          "app/test-route-1.tsx": `
            export default () => <div data-test-route>Test route 1</div>
          `,
          "app/test-route-2.tsx": `
            export default () => <div data-test-route>Test route 2</div>
          `,
        });
        let { cwd, port } = await dev(files);

        await page.goto(`http://localhost:${port}/`, {
          waitUntil: "networkidle",
        });
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1"
        );

        let edit = createEditor(cwd);

        // Make config invalid
        await edit("app/routes.ts", (contents) => contents + "INVALID");

        // Ensure dev server is still running with old config + HMR
        await edit("app/test-route-1.tsx", (contents) =>
          contents.replace("Test route 1", "Test route 1 updated")
        );
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1 updated"
        );

        // Fix config with new route
        await edit("app/routes.ts", (contents) =>
          contents
            .replace("INVALID", "")
            .replace("test-route-1", "test-route-2")
        );

        await expect(async () => {
          // Reload to pick up new route for current path
          await page.reload();
          await expect(page.locator("[data-test-route]")).toHaveText(
            "Test route 2"
          );
        }).toPass();
      });

      test("supports correcting an invalid route config module graph", async ({
        page,
        dev,
      }) => {
        let files: Files = async ({ port }) => ({
          "vite.config.js": await viteConfig.basic({ port }),
          "app/routes.ts": js`
            export { default } from "./actual-routes";
          `,
          "app/actual-routes.ts": js`
            import { type RouteConfig, index } from "@react-router/dev/routes";

            export default [
              index("test-route-1.tsx"),
            ] satisfies RouteConfig;
          `,
          "app/test-route-1.tsx": `
            export default () => <div data-test-route>Test route 1</div>
          `,
          "app/test-route-2.tsx": `
            export default () => <div data-test-route>Test route 2</div>
          `,
        });
        let { cwd, port } = await dev(files);

        await page.goto(`http://localhost:${port}/`, {
          waitUntil: "networkidle",
        });
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1"
        );

        let edit = createEditor(cwd);

        // Make config invalid
        await edit("app/actual-routes.ts", (contents) => contents + "INVALID");

        // Ensure dev server is still running with old config + HMR
        await edit("app/test-route-1.tsx", (contents) =>
          contents.replace("Test route 1", "Test route 1 updated")
        );
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1 updated"
        );

        // Fix config with new route
        await edit("app/actual-routes.ts", (contents) =>
          contents
            .replace("INVALID", "")
            .replace("test-route-1", "test-route-2")
        );

        await expect(async () => {
          // Reload to pick up new route for current path
          await page.reload();
          await expect(page.locator("[data-test-route]")).toHaveText(
            "Test route 2"
          );
        }).toPass();
      });

      test("supports correcting a missing route config", async ({
        page,
        dev,
      }) => {
        let files: Files = async ({ port }) => ({
          "vite.config.js": await viteConfig.basic({ port }),
          "app/routes.ts": js`
            import { type RouteConfig, index } from "@react-router/dev/routes";

            export default [
              index("test-route-1.tsx"),
            ] satisfies RouteConfig;
          `,
          "app/test-route-1.tsx": js`
            export default () => <div data-test-route>Test route 1</div>
          `,
          "app/test-route-2.tsx": js`
            export default () => <div data-test-route>Test route 2</div>
          `,
        });
        let { cwd, port } = await dev(files);

        await page.goto(`http://localhost:${port}/`, {
          waitUntil: "networkidle",
        });
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1"
        );

        let edit = createEditor(cwd);

        let INVALID_FILENAME = "app/routes.ts.oops";

        // Rename config to make it missing
        await fs.rename(
          path.join(cwd, "app/routes.ts"),
          path.join(cwd, INVALID_FILENAME)
        );

        // Ensure dev server is still running with old config + HMR
        await edit("app/test-route-1.tsx", (contents) =>
          contents.replace("Test route 1", "Test route 1 updated")
        );
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route 1 updated"
        );

        // Add new route
        await edit(INVALID_FILENAME, (contents) =>
          contents.replace("test-route-1", "test-route-2")
        );

        // Rename config to bring it back
        await fs.rename(
          path.join(cwd, INVALID_FILENAME),
          path.join(cwd, "app/routes.ts")
        );

        await expect(async () => {
          // Reload to pick up new route for current path
          await page.reload();
          await expect(page.locator("[data-test-route]")).toHaveText(
            "Test route 2"
          );
        }).toPass();
      });

      test("supports absolute route file paths", async ({ page, dev }) => {
        let files: Files = async ({ port }) => ({
          "vite.config.js": await viteConfig.basic({ port }),
          "app/routes.ts": js`
            import path from "node:path";
            import { type RouteConfig, index } from "@react-router/dev/routes";

            export default [
              index(path.resolve(import.meta.dirname, "test-route.tsx")),
            ] satisfies RouteConfig;
          `,
          "app/test-route.tsx": `
            export default () => <div data-test-route>Test route</div>
          `,
        });
        let { port } = await dev(files);

        await page.goto(`http://localhost:${port}/`, {
          waitUntil: "networkidle",
        });
        await expect(page.locator("[data-test-route]")).toHaveText(
          "Test route"
        );
      });
    });
  });
});
