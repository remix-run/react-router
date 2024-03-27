import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  viteDev,
  viteBuild,
  viteRemixServe,
  viteConfig,
} from "./helpers/vite.js";

let files = {
  "app/routes/node_env.tsx": String.raw`
    export default function NodeEnvRoute() {
      return <div data-node-env>{process.env.NODE_ENV}</div>
    }
  `,
};

test.describe(async () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      "vite.config.js": await viteConfig.basic({ port: port }),
      ...files,
    });
  });

  test.describe(() => {
    test.beforeAll(async () => {
      stop = await viteDev({ cwd, port });
    });
    test.afterAll(() => stop());

    test("Vite / NODE_ENV / dev", async ({ page }) => {
      let pageErrors: unknown[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}/node_env`, {
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
      viteBuild({ cwd });
      buildPort = await getPort();
      stop = await viteRemixServe({ cwd, port: buildPort });
    });
    test.afterAll(() => stop());

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
