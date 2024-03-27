import { test } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("pathless layout routes", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    appFixture = await createAppFixture(
      await createFixture({
        files: {
          "app/routes/_layout.tsx": js`
            import { Outlet } from "@remix-run/react";

            export default () => <div data-testid="layout-route"><Outlet /></div>;
          `,
          "app/routes/_layout._index.tsx": js`
            export default () => <div data-testid="layout-index">Layout index</div>;
          `,
          "app/routes/_layout.subroute.tsx": js`
            export default () => <div data-testid="layout-subroute">Layout subroute</div>;
          `,
          "app/routes/sandwiches._pathless.tsx": js`
            import { Outlet } from "@remix-run/react";

            export default () => <div data-testid="sandwiches-pathless-route"><Outlet /></div>;
          `,
          "app/routes/sandwiches._pathless._index.tsx": js`
            export default () => <div data-testid="sandwiches-pathless-index">Sandwiches pathless index</div>;
          `,
        },
      })
    );
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("should render pathless index route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("[data-testid='layout-route']");
    await page.waitForSelector("[data-testid='layout-index']");
  });

  test("should render pathless sub route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/subroute");
    await page.waitForSelector("[data-testid='layout-route']");
    await page.waitForSelector("[data-testid='layout-subroute']");
  });

  test("should render pathless index as a sub route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/sandwiches");
    await page.waitForSelector("[data-testid='sandwiches-pathless-route']");
    await page.waitForSelector("[data-testid='sandwiches-pathless-index']");
  });
});
