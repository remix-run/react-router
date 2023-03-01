import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/index.jsx": js`
        import { redirect } from "@remix-run/node";
        import { Form } from "@remix-run/react";

        export function action() {
          return redirect("/test");
        };

        export default function Component() {
          return (
            <>
              <h1>Index Page - Scroll Down</h1>
              <Form method="post" style={{ marginTop: "150vh" }}>
                <button type="submit">Submit</button>
              </Form>
            </>
          );
        }
      `,

      "app/routes/test.jsx": js`
        export default function Component() {
          return (
            <>
              <h1 id="redirected">Redirected!</h1>
              <p style={{ marginTop: "150vh" }}>I should not be visible!!</p>
            </>
          );
        }
      `,
    },
  });

  // This creates an interactive app using puppeteer.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("page scroll should be at the top on the new page", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");

  // Scroll to the bottom and submit
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  let scroll = await page.evaluate(() => window.scrollY);
  expect(scroll).toBeGreaterThan(0);
  await app.clickSubmitButton("/?index");
  await page.waitForSelector("#redirected");

  // Ensure we scrolled back to the top
  scroll = await page.evaluate(() => window.scrollY);
  expect(scroll).toBe(0);
});
