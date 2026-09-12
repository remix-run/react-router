import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import {
  type Files,
  reactRouterConfig,
  test,
  viteConfig,
} from "./helpers/vite.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("Sub-Resource Integrity", () => {
  test.use({ javaScriptEnabled: false });

  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "react-router.config.ts": reactRouterConfig({
          subResourceIntegrity: true,
        }),
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "react-router";

          export default function Root() {
            return (
              <html>
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Outlet />
                  <Scripts nonce="test-nonce-123" />
                </body>
              </html>
            );
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test("includes an importmap", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    let json = await page.locator('script[type="importmap"]').innerText();
    let importMap = JSON.parse(json);
    expect(Object.keys(importMap.integrity).length).toBeGreaterThan(0);
    for (let key in importMap.integrity) {
      if (key.includes("manifest")) continue;
      let value = importMap.integrity[key];
      expect(value).toMatch(/^sha384-/);

      let linkEl = page.locator(`link[rel="modulepreload"][href="${key}"]`);
      expect(await linkEl.getAttribute("href")).toBe(key);
      expect(await linkEl.getAttribute("integrity")).toBe(value);

      let scriptEl = page.locator(`script[type="module"]`);
      expect(await scriptEl.innerText()).toContain(key);
    }
  });

  test("includes a nonce on the importmap script", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(
      await page.locator('script[type="importmap"]').getAttribute("nonce"),
    ).toBe("test-nonce-123");
  });

  test("includes a nonce on modulepreload links", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    let modulePreloads = page.locator('link[rel="modulepreload"]');
    let count = await modulePreloads.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect(await modulePreloads.nth(i).getAttribute("nonce")).toBe(
        "test-nonce-123",
      );
    }
  });
});

test.describe("Sub-Resource Integrity in RSC Framework Mode (production)", () => {
  test.use({ javaScriptEnabled: false });

  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      templateName: "rsc-vite-framework",
      files: {
        "react-router.config.ts": reactRouterConfig({
          subResourceIntegrity: true,
        }),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test("includes an importmap with integrity hashes", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    let json = await page.locator('script[type="importmap"]').innerText();
    let importMap = JSON.parse(json);
    expect(Object.keys(importMap.integrity).length).toBeGreaterThan(0);
    for (let [url, value] of Object.entries(importMap.integrity)) {
      expect(value).toMatch(/^sha384-/);

      let asset = await readFile(
        path.join(fixture.projectDir, "build/client", url),
      );
      let expected = `sha384-${createHash("sha384")
        .update(asset)
        .digest("base64")}`;
      expect(value).toBe(expected);
    }
  });
});

test.describe("Sub-Resource Integrity in RSC Framework Mode (development)", () => {
  test("accepts the config without emitting production integrity hashes", async ({
    page,
    dev,
  }) => {
    let files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig({
        subResourceIntegrity: true,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "rsc-vite-framework",
      }),
    });

    let { port } = await dev(files, "rsc-vite-framework");

    await page.goto(`http://localhost:${port}/`);
    await expect(page.getByRole("heading")).toHaveText(
      "Welcome to React Router",
    );
    await expect(page.locator('script[type="importmap"]')).toHaveCount(0);
    expect(page.errors).toEqual([]);
  });
});
