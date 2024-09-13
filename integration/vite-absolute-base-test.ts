import { expect } from "@playwright/test";
import dedent from "dedent";

import type { Files } from "./helpers/vite.js";
import { test, viteConfig } from "./helpers/vite.js";

let files: Files = async ({ port }) => ({
  "vite.config.ts": dedent`
    import { reactRouter } from "@react-router/dev/vite";

    export default {
      base: "http://localhost:${port}/",
      ${await viteConfig.server({ port })}
      plugins: [reactRouter()],
    }
  `,
  "app/routes/_index.tsx": `
    export default () => <h1 data-title>This should work</h1>;
  `,
});

test("Vite absolute base / dev", async ({ page, dev }) => {
  let { port } = await dev(files);

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("[data-title]")).toHaveText("This should work");
  expect(page.errors).toEqual([]);
});

test("Vite absolute base / build", async ({ page, reactRouterServe }) => {
  let { port } = await reactRouterServe(files);

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("[data-title]")).toHaveText("This should work");
  expect(page.errors).toEqual([]);
});
