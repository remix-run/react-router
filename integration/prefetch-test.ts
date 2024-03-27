import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  css,
} from "./helpers/create-fixture.js";
import type {
  Fixture,
  FixtureInit,
  AppFixture,
} from "./helpers/create-fixture.js";
import type { RemixLinkProps } from "../build/node_modules/@remix-run/react/dist/components.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("multi fetch", () => {
  // Generate the test app using the given prefetch mode
  function fixtureFactory(mode: RemixLinkProps["prefetch"]): FixtureInit {
    return {
      files: {
        "app/root.tsx": js`
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

        "app/routes/_index.tsx": js`
          export default function() {
            return <h2 className="index">Index</h2>;
          }
        `,

        "app/routes/with-loader.tsx": js`
          export function loader() {
            return { message: 'data from the loader' };
          }
          export default function() {
            return <h2 className="with-loader">With Loader</h2>;
          }
        `,

        "app/routes/without-loader.tsx": js`
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

    test.afterAll(() => {
      appFixture.close();
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
  });

  test.describe("prefetch=render", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture(fixtureFactory("render"));
      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
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

    test.afterAll(() => {
      appFixture.close();
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

    test.afterAll(() => {
      appFixture.close();
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

  test.describe("prefetch=viewport", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "app/routes/_index.tsx": js`
            import { Link } from "@remix-run/react";

            export default function Component() {
              return (
                <>
                  <h1>Index Page - Scroll Down</h1>
                  <div style={{ marginTop: "150vh" }}>
                    <Link to="/test" prefetch="viewport">Click me!</Link>
                  </div>
                </>
              );
            }
          `,

          "app/routes/test.tsx": js`
            export function loader() {
              return null;
            }
            export default function Component() {
              return <h1>Test Page</h1>;
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

    test("should prefetch when the link enters the viewport", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      // No preloads to start
      await expect(page.locator("div link")).toHaveCount(0);

      // Preloads render on scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      await page.waitForSelector(
        "div link[rel='prefetch'][as='fetch'][href='/test?_data=routes%2Ftest']",
        { state: "attached" }
      );
      await page.waitForSelector(
        "div link[rel='modulepreload'][href^='/build/routes/test-']",
        { state: "attached" }
      );

      // Preloads removed on scroll up
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator("div link")).toHaveCount(0);
    });
  });

  test.describe("other scenarios", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.afterAll(() => {
      appFixture?.close();
    });

    test("does not add prefetch links for stylesheets already in the DOM (active routes)", async ({
      page,
    }) => {
      fixture = await createFixture({
        files: {
          "app/root.tsx": js`
              import { Links, Meta, Scripts, useFetcher } from "@remix-run/react";
              import globalCss from "./global.css";

              export function links() {
                return [{ rel: "stylesheet", href: globalCss }];
              }

              export async function action() {
                return null;
              }

              export async function loader() {
                return null;
              }

              export default function Root() {
                let fetcher = useFetcher();

                return (
                  <html lang="en">
                    <head>
                      <Meta />
                      <Links />
                    </head>
                    <body>
                      <button
                        id="submit-fetcher"
                        onClick={() => fetcher.submit({}, { method: 'post' })}>
                          Submit Fetcher
                      </button>
                      <p id={"fetcher-state--" + fetcher.state}>{fetcher.state}</p>
                      <Scripts />
                    </body>
                  </html>
                );
              }
            `,

          "app/global.css": `
              body {
                background-color: black;
                color: white;
              }
            `,

          "app/routes/_index.tsx": js`
              export default function() {
                return <h2 className="index">Index</h2>;
              }
            `,
        },
      });
      appFixture = await createAppFixture(fixture);
      let requests: { type: string; url: string }[] = [];

      page.on("request", (req) => {
        requests.push({
          type: req.resourceType(),
          url: req.url(),
        });
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("#submit-fetcher");
      await page.waitForSelector("#fetcher-state--idle");
      // We should not send a second request for this root stylesheet that's
      // already been rendered in the DOM
      let stylesheets = requests.filter(
        (r) => r.type === "stylesheet" && /\/global-[a-z0-9]+\.css/i.test(r.url)
      );
      expect(stylesheets.length).toBe(1);
    });

    test("dedupes prefetch tags", async ({ page }) => {
      fixture = await createFixture({
        files: {
          "app/root.tsx": js`
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
                      <Link to="/with-nested-links/nested" prefetch="intent">
                        Nested Links Page
                      </Link>
                    </nav>
                    <Outlet />
                    <Scripts />
                  </body>
                </html>
              );
            }
          `,

          "app/global.css": css`
            .global-class {
              background-color: gray;
              color: black;
            }
          `,

          "app/local.css": css`
            .local-class {
              background-color: black;
              color: white;
            }
          `,

          "app/routes/_index.tsx": js`
            export default function() {
              return <h2 className="index">Index</h2>;
            }
          `,

          "app/routes/with-nested-links.tsx": js`
            import { Outlet } from "@remix-run/react";
            import globalCss from "../global.css";

            export function links() {
              return [
                // Same links as child route but with different key order
                {
                  rel: "stylesheet",
                  href: globalCss,
                },
                {
                  rel: "preload",
                  as: "image",
                  imageSrcSet: "image-600.jpg 600w, image-1200.jpg 1200w",
                  imageSizes: "9999px",
                },
              ];
            }
            export default function() {
              return <Outlet />;
            }
          `,

          "app/routes/with-nested-links.nested.tsx": js`
            import globalCss from '../global.css';
            import localCss from '../local.css';

            export function links() {
              return [
                // Same links as parent route but with different key order
                {
                  href: globalCss,
                  rel: "stylesheet",
                },
                {
                  imageSrcSet: "image-600.jpg 600w, image-1200.jpg 1200w",
                  imageSizes: "9999px",
                  rel: "preload",
                  as: "image",
                },
                // Unique links for child route
                {
                  rel: "stylesheet",
                  href: localCss,
                },
                {
                  rel: "preload",
                  as: "image",
                  imageSrcSet: "image-700.jpg 700w, image-1400.jpg 1400w",
                  imageSizes: "9999px",
                },
              ];
            }
            export default function() {
              return <h2 className="with-nested-links">With Nested Links</h2>;
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.hover("a[href='/with-nested-links/nested']");
      await page.waitForSelector("#nav link[rel='prefetch'][as='style']", {
        state: "attached",
      });
      expect(
        await page.locator("#nav link[rel='prefetch'][as='style']").count()
      ).toBe(2);
      expect(
        await page.locator("#nav link[rel='prefetch'][as='image']").count()
      ).toBe(2);
    });
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  // Generate the test app using the given prefetch mode
  function fixtureFactory(mode: RemixLinkProps["prefetch"]): FixtureInit {
    return {
      config: {
        future: {
          unstable_singleFetch: true,
        },
      },
      files: {
        "app/root.tsx": js`
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

        "app/routes/_index.tsx": js`
          export default function() {
            return <h2 className="index">Index</h2>;
          }
        `,

        "app/routes/with-loader.tsx": js`
          export function loader() {
            return { message: 'data from the loader' };
          }
          export default function() {
            return <h2 className="with-loader">With Loader</h2>;
          }
        `,

        "app/routes/without-loader.tsx": js`
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

    test.afterAll(() => {
      appFixture.close();
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
  });

  test.describe("prefetch=render", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture(fixtureFactory("render"));
      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
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
        "#nav link[rel='prefetch'][as='fetch'][href='/with-loader.data']",
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

    test.afterAll(() => {
      appFixture.close();
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
        "#nav link[rel='prefetch'][as='fetch'][href='/with-loader.data']",
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

    test.afterAll(() => {
      appFixture.close();
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
        "#nav link[rel='prefetch'][as='fetch'][href='/with-loader.data']",
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

  test.describe("prefetch=viewport", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        config: {
          future: {
            unstable_singleFetch: true,
          },
        },
        files: {
          "app/routes/_index.tsx": js`
            import { Link } from "@remix-run/react";

            export default function Component() {
              return (
                <>
                  <h1>Index Page - Scroll Down</h1>
                  <div style={{ marginTop: "150vh" }}>
                    <Link to="/test" prefetch="viewport">Click me!</Link>
                  </div>
                </>
              );
            }
          `,

          "app/routes/test.tsx": js`
            export function loader() {
              return null;
            }
            export default function Component() {
              return <h1>Test Page</h1>;
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

    test("should prefetch when the link enters the viewport", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      // No preloads to start
      await expect(page.locator("div link")).toHaveCount(0);

      // Preloads render on scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      await page.waitForSelector(
        "div link[rel='prefetch'][as='fetch'][href='/test.data']",
        { state: "attached" }
      );
      await page.waitForSelector(
        "div link[rel='modulepreload'][href^='/build/routes/test-']",
        { state: "attached" }
      );

      // Preloads removed on scroll up
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator("div link")).toHaveCount(0);
    });
  });

  test.describe("other scenarios", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.afterAll(() => {
      appFixture?.close();
    });

    test("does not add prefetch links for stylesheets already in the DOM (active routes)", async ({
      page,
    }) => {
      fixture = await createFixture({
        config: {
          future: {
            unstable_singleFetch: true,
          },
        },
        files: {
          "app/root.tsx": js`
              import { Links, Meta, Scripts, useFetcher } from "@remix-run/react";
              import globalCss from "./global.css";

              export function links() {
                return [{ rel: "stylesheet", href: globalCss }];
              }

              export async function action() {
                return null;
              }

              export async function loader() {
                return null;
              }

              export default function Root() {
                let fetcher = useFetcher();

                return (
                  <html lang="en">
                    <head>
                      <Meta />
                      <Links />
                    </head>
                    <body>
                      <button
                        id="submit-fetcher"
                        onClick={() => fetcher.submit({}, { method: 'post' })}>
                          Submit Fetcher
                      </button>
                      <p id={"fetcher-state--" + fetcher.state}>{fetcher.state}</p>
                      <Scripts />
                    </body>
                  </html>
                );
              }
            `,

          "app/global.css": `
              body {
                background-color: black;
                color: white;
              }
            `,

          "app/routes/_index.tsx": js`
              export default function() {
                return <h2 className="index">Index</h2>;
              }
            `,
        },
      });
      appFixture = await createAppFixture(fixture);
      let requests: { type: string; url: string }[] = [];

      page.on("request", (req) => {
        requests.push({
          type: req.resourceType(),
          url: req.url(),
        });
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("#submit-fetcher");
      await page.waitForSelector("#fetcher-state--idle");
      // We should not send a second request for this root stylesheet that's
      // already been rendered in the DOM
      let stylesheets = requests.filter(
        (r) => r.type === "stylesheet" && /\/global-[a-z0-9]+\.css/i.test(r.url)
      );
      expect(stylesheets.length).toBe(1);
    });

    test("dedupes prefetch tags", async ({ page }) => {
      fixture = await createFixture({
        config: {
          future: {
            unstable_singleFetch: true,
          },
        },
        files: {
          "app/root.tsx": js`
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
                      <Link to="/with-nested-links/nested" prefetch="intent">
                        Nested Links Page
                      </Link>
                    </nav>
                    <Outlet />
                    <Scripts />
                  </body>
                </html>
              );
            }
          `,

          "app/global.css": css`
            .global-class {
              background-color: gray;
              color: black;
            }
          `,

          "app/local.css": css`
            .local-class {
              background-color: black;
              color: white;
            }
          `,

          "app/routes/_index.tsx": js`
            export default function() {
              return <h2 className="index">Index</h2>;
            }
          `,

          "app/routes/with-nested-links.tsx": js`
            import { Outlet } from "@remix-run/react";
            import globalCss from "../global.css";

            export function links() {
              return [
                // Same links as child route but with different key order
                {
                  rel: "stylesheet",
                  href: globalCss,
                },
                {
                  rel: "preload",
                  as: "image",
                  imageSrcSet: "image-600.jpg 600w, image-1200.jpg 1200w",
                  imageSizes: "9999px",
                },
              ];
            }
            export default function() {
              return <Outlet />;
            }
          `,

          "app/routes/with-nested-links.nested.tsx": js`
            import globalCss from '../global.css';
            import localCss from '../local.css';

            export function links() {
              return [
                // Same links as parent route but with different key order
                {
                  href: globalCss,
                  rel: "stylesheet",
                },
                {
                  imageSrcSet: "image-600.jpg 600w, image-1200.jpg 1200w",
                  imageSizes: "9999px",
                  rel: "preload",
                  as: "image",
                },
                // Unique links for child route
                {
                  rel: "stylesheet",
                  href: localCss,
                },
                {
                  rel: "preload",
                  as: "image",
                  imageSrcSet: "image-700.jpg 700w, image-1400.jpg 1400w",
                  imageSizes: "9999px",
                },
              ];
            }
            export default function() {
              return <h2 className="with-nested-links">With Nested Links</h2>;
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.hover("a[href='/with-nested-links/nested']");
      await page.waitForSelector("#nav link[rel='prefetch'][as='style']", {
        state: "attached",
      });
      expect(
        await page.locator("#nav link[rel='prefetch'][as='style']").count()
      ).toBe(2);
      expect(
        await page.locator("#nav link[rel='prefetch'][as='image']").count()
      ).toBe(2);
    });
  });
});
