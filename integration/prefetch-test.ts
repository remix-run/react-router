import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import type { RemixLinkProps } from "../build/node_modules/@remix-run/react/components";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

// Generate the test app using the given prefetch mode
function fixtureFactory(mode: RemixLinkProps["prefetch"]) {
  return {
    files: {
      "app/root.jsx": js`
        import {
          Link,
          Links,
          Meta,
          Outlet,
          Scripts,
          useLoaderData,
        } from "@remix-run/react";

        export default function Root() {
          const styles =
          'a:hover { color: red; } a:hover:after { content: " (hovered)"; }' +
          'a:focus { color: green; } a:focus:after { content: " (focused)"; }';

          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <style>{styles}</style>
                <h1>Root</h1>
                <nav id="nav">
                  <Link to="/with-loader" prefetch="${mode}">
                    Loader Page
                  </Link>
                  <br/>
                  <Link to="/without-loader" prefetch="${mode}">
                    Non-Loader Page
                  </Link>
                </nav>
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }
      `,

      "app/routes/index.jsx": js`
        export default function() {
          return <h2 className="index">Index</h2>;
        }
      `,

      "app/routes/with-loader.jsx": js`
        export function loader() {
          return { message: 'data from the loader' };
        }
        export default function() {
          return <h2 className="with-loader">With Loader</h2>;
        }
      `,

      "app/routes/without-loader.jsx": js`
        export default function() {
          return <h2 className="without-loader">Without Loader</h2>;
        }
      `,
    },
  };
}

test.describe("prefetch=none", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("none"));
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  test("does not render prefetch tags during SSR", async ({ page }) => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("does not add prefetch tags on hydration", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await page.locator("#nav link").count()).toBe(0);
  });
});

test.describe("prefetch=render", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("render"));
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("does not render prefetch tags during SSR", async ({ page }) => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("adds prefetch tags on hydration", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    // Both data and asset fetch for /with-loader
    await page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']",
      { state: "attached" }
    );
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']",
      { state: "attached" }
    );
    // Only asset fetch for /without-loader
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']",
      { state: "attached" }
    );

    // Ensure no other links in the #nav element
    expect(await page.locator("#nav link").count()).toBe(3);
  });
});

test.describe("prefetch=intent (hover)", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("intent"));
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("does not render prefetch tags during SSR", async ({ page }) => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("does not add prefetch tags on hydration", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("adds prefetch tags on hover", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.hover("a[href='/with-loader']");
    await page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']",
      { state: "attached" }
    );
    // Check href prefix due to hashed filenames
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']",
      { state: "attached" }
    );
    expect(await page.locator("#nav link").count()).toBe(2);

    await page.hover("a[href='/without-loader']");
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']",
      { state: "attached" }
    );
    expect(await page.locator("#nav link").count()).toBe(1);
  });

  test("removes prefetch tags after navigating to/from the page", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    // Links added on hover
    await page.hover("a[href='/with-loader']");
    await page.waitForSelector("#nav link", { state: "attached" });
    expect(await page.locator("#nav link").count()).toBe(2);

    // Links removed upon navigating to the page
    await page.click("a[href='/with-loader']");
    await page.waitForSelector("h2.with-loader", { state: "attached" });
    expect(await page.locator("#nav link").count()).toBe(0);

    // Links stay removed upon navigating away from the page
    await page.click("a[href='/without-loader']");
    await page.waitForSelector("h2.without-loader", { state: "attached" });
    expect(await page.locator("#nav link").count()).toBe(0);
  });
});

test.describe("prefetch=intent (focus)", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("intent"));
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("does not render prefetch tags during SSR", async ({ page }) => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("does not add prefetch tags on hydration", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await page.locator("#nav link").count()).toBe(0);
  });

  test("adds prefetch tags on focus", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    // This click is needed to transfer focus to the main window, allowing
    // subsequent focus events to fire
    await page.click("body");
    await page.focus("a[href='/with-loader']");
    await page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']",
      { state: "attached" }
    );
    // Check href prefix due to hashed filenames
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']",
      { state: "attached" }
    );
    expect(await page.locator("#nav link").count()).toBe(2);

    await page.focus("a[href='/without-loader']");
    await page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']",
      { state: "attached" }
    );
    expect(await page.locator("#nav link").count()).toBe(1);
  });
});
