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

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
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

      "app/routes/test.tsx": js`
        export default function Component() {
          return (
            <>
              <h1 id="redirected">Redirected!</h1>
              <p style={{ marginTop: "150vh" }}>I should not be visible!!</p>
            </>
          );
        }
      `,

      "app/routes/hash.tsx": js`
        import { Link } from "@remix-run/react";

        export default function Component() {
          return (
            <>
              <h1>Hash Scrolling</h1>
              <Link to="#hello-world">hash link to hello-world</Link>
              <Link to="#hello 🌎">hash link to hello 🌎</Link>
              <div style={{ height: '3000px' }}>Spacer Div</div>
              <p id="hello-world">hello-world scroll target</p>
              <p id="hello 🌎">hello 🌎 scroll target</p>
            </>
          );
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

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  runTests();
});

test.describe("with JavaScript", () => {
  test.use({ javaScriptEnabled: true });
  runTests();
});

function runTests() {
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

  test("should scroll to hash locations", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/hash");
    let scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBe(0);
    await app.clickLink("/hash#hello-world");
    await new Promise((r) => setTimeout(r, 0));
    scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBeGreaterThan(0);
  });

  test("should scroll to hash locations with URL encoded characters", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/hash");
    let scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBe(0);
    await app.clickLink("/hash#hello 🌎");
    await new Promise((r) => setTimeout(r, 0));
    scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBeGreaterThan(0);
  });
}
