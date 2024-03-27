import { test } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe(".js route files", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    appFixture = await createAppFixture(
      await createFixture({
        files: {
          "app/routes/js.js": js`
            export default () => <div data-testid="route-js">Rendered with .js ext</div>;
          `,
          "app/routes/jsx.jsx": js`
            export default () => <div data-testid="route-jsx">Rendered with .jsx ext</div>;
          `,
        },
      })
    );
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("should render all .js routes", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/js");
    await page.waitForSelector("[data-testid='route-js']");
    test.expect(await page.content()).toContain("Rendered with .js ext");
  });

  test("should render all .jsx routes", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/jsx");
    await page.waitForSelector("[data-testid='route-jsx']");
    test.expect(await page.content()).toContain("Rendered with .jsx ext");
  });
});
