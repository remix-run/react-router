import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeEach(async ({ context }) => {
  await context.route(/_data/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import imgSrc from "getos/imgs/logo.svg";

        export default function () {
          return (
            <div>
              <img src={imgSrc} data-testid="example-svg" alt="example img"/>
            </div>
          )
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("renders SVG images imported from node_modules", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  // You can test any request your app might get using `fixture`.
  await app.goto("/");
  expect(await page.getByTestId("example-svg").getAttribute("src")).toMatch(
    /\/build\/_assets\/logo-.*\.svg/
  );
});
