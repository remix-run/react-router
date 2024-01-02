import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  viteDev,
  viteBuild,
  viteRemixServe,
  VITE_CONFIG,
} from "./helpers/vite.js";

let files = {
  "app/routes/node_env.tsx": String.raw`
    export default function NodeEnvRoute() {
      return <div data-node-env>{process.env.NODE_ENV}</div>
    }
  `,
};

test.describe(async () => {
  let devPort: number;
  let cwd: string;
  let stop: () => Promise<void> | void;

  test.beforeAll(async () => {
    devPort = await getPort();
    cwd = await createProject({
      "vite.config.js": await VITE_CONFIG({ port: devPort }),
      ...files,
    });
  });

  test.describe(() => {
    test.beforeAll(async () => {
      stop = await viteDev({ cwd, port: devPort });
    });
    test.afterAll(async () => await stop());

    test("Vite / NODE_ENV / dev", async ({ page }) => {
      let pageErrors: unknown[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${devPort}/node_env`, {
        waitUntil: "networkidle",
      });
      expect(pageErrors).toEqual([]);

      let nodeEnvContent = page.locator("[data-node-env]");
      await expect(nodeEnvContent).toHaveText("development");

      expect(pageErrors).toEqual([]);
    });
  });

  test.describe(() => {
    let buildPort: number;
    test.beforeAll(async () => {
      await viteBuild({ cwd });
      buildPort = await getPort();
      stop = await viteRemixServe({ cwd, port: buildPort });
    });
    test.afterAll(async () => await stop());

    test("Vite / NODE_ENV / build", async ({ page }) => {
      let pageErrors: unknown[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${buildPort}/node_env`, {
        waitUntil: "networkidle",
      });
      expect(pageErrors).toEqual([]);

      let nodeEnvContent = page.locator("[data-node-env]");
      await expect(nodeEnvContent).toHaveText("production");

      expect(pageErrors).toEqual([]);
    });
  });
});
