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
  await context.route(/\.data$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { Form } from "react-router";

        export function action({request}) {
          return { message: "Hey" + request.headers.get('content-type') };
        }

        export default function Index({actionData}) {
          return (
            <Form method="POST">
              <button
                id="form-urlencoded"
                type="submit"
                formEncType="application/x-www-form-urlencoded"
                className="px-2 py-1 rounded bg-blue-500 text-white"
              >
                Go form urlencoded
              </button>
              <button
                id="multipart"
                type="submit"
                formEncType="multipart/form-data"
                className="px-2 py-1 rounded bg-blue-500 text-white"
              >
                Go multipart
              </button>
              {actionData?.message}
            </Form>
          )
        }
      `,
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("[handle multipart/form-data actions]", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");

  // This works correctly
  await app.clickElement("#form-urlencoded");
  await page.waitForSelector("text=application/x-www-form-urlencoded");

  // This should also work, but it fails
  await app.clickElement("#multipart");
  await page.waitForSelector("text=multipart/form-data");
});
