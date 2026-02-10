import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("CSub-Resource Integrity", () => {
  test.use({ javaScriptEnabled: false });

  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "react-router.config.ts": reactRouterConfig({
          future: { unstable_subResourceIntegrity: true },
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
});
