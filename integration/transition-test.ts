import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("rendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let PAGE = "page";
  let PAGE_TEXT = "PAGE_TEXT";
  let PAGE_INDEX_TEXT = "PAGE_INDEX_TEXT";
  let CHILD = "child";
  let CHILD_TEXT = "CHILD_TEXT";
  let REDIRECT = "redirect";
  let REDIRECT_HASH = "redirect-hash";
  let REDIRECT_TARGET = "page";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <main>
                    <Outlet />
                  </main>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          import { Link } from "@remix-run/react";
          export default function() {
            return (
              <div>
                <h2>Index</h2>
                <Link to="/${PAGE}">${PAGE}</Link>
                <Link to="/${REDIRECT}">${REDIRECT}</Link>
                <Link to="/${REDIRECT_HASH}">${REDIRECT_HASH}</Link>
              </div>
            );
          }
        `,

        [`app/routes/${PAGE}.jsx`]: js`
          import { Outlet, useLoaderData } from "@remix-run/react";

          export function loader() {
            return "${PAGE_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return (
              <>
                <h2>{text}</h2>
                <Outlet />
              </>
            );
          }
        `,

        [`app/routes/${PAGE}._index.jsx`]: js`
          import { useLoaderData, Link } from "@remix-run/react";

          export function loader() {
            return "${PAGE_INDEX_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return (
              <>
                <h3>{text}</h3>
                <Link to="/${PAGE}/${CHILD}">${CHILD}</Link>
              </>
            );
          }
        `,

        [`app/routes/${PAGE}.${CHILD}.jsx`]: js`
          import { useLoaderData } from "@remix-run/react";

          export function loader() {
            return "${CHILD_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return <h3>{text}</h3>;
          }
        `,

        [`app/routes/${REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function loader() {
            return redirect("/${REDIRECT_TARGET}")
          }
          export default function() {
            return null;
          }
        `,

        [`app/routes/${REDIRECT_HASH}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function loader() {
            return redirect("/${REDIRECT_TARGET}#my-hash")
          }
          export default function() {
            return null;
          }
        `,

        "app/routes/gh-1691.tsx": js`
          import { json, redirect } from "@remix-run/node";
          import { useFetcher} from "@remix-run/react";

          export const action = async ( ) => {
            return redirect("/gh-1691");
          };

          export const loader = async () => {
            return json({});
          };

          export default function GitHubIssue1691() {
            const fetcher = useFetcher();

            return (
              <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
                <span>{fetcher.state}</span>
                <fetcher.Form method="post">
                  <input type="hidden" name="source" value="fetcher" />
                  <button type="submit" name="intent" value="add">
                    Submit
                  </button>
                </fetcher.Form>
              </div>
            );
          }
        `,

        "app/routes/parent.tsx": js`
          import { Outlet, useLoaderData } from "@remix-run/react";

          if (!global.counts) {
            global.count = 0;
            global.counts = new Set();
          }
          export const loader = async ({ request, context }) => {
            let count = global.count;
            if (!global.counts.has(context)) {
              counts.add(context);
              count = ++global.count;
            }
            return { count };
          };

          export default function Parent() {
            const data = useLoaderData();
            return (
              <div>
                <div id="parent">{data.count}</div>
                <Outlet />
              </div>
            );
          }
        `,

        "app/routes/parent.child.tsx": js`
          import { redirect } from "@remix-run/node";
          import { useFetcher} from "@remix-run/react";

          export const action = async ({ request }) => {
            return redirect("/parent");
          };

          export default function Child() {
            const fetcher = useFetcher();

            return (
              <fetcher.Form method="post">
                <button id="fetcher-submit-redirect" type="submit">Submit</button>
              </fetcher.Form>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("calls all loaders for new routes", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    let responses = app.collectDataResponses();
    await app.clickLink(`/${PAGE}`);
    await page.waitForLoadState("networkidle");

    expect(
      responses
        .map((res) => new URL(res.url()).searchParams.get("_data"))
        .sort()
    ).toEqual([`routes/${PAGE}`, `routes/${PAGE}._index`].sort());

    await page.waitForSelector(`h2:has-text("${PAGE_TEXT}")`);
    await page.waitForSelector(`h3:has-text("${PAGE_INDEX_TEXT}")`);
  });

  test("calls only loaders for changing routes", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/${PAGE}`);
    let responses = app.collectDataResponses();
    await app.clickLink(`/${PAGE}/${CHILD}`);
    await page.waitForLoadState("networkidle");

    expect(
      responses.map((res) => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${PAGE}.${CHILD}`]);

    await page.waitForSelector(`h2:has-text("${PAGE_TEXT}")`);
    await page.waitForSelector(`h3:has-text("${CHILD_TEXT}")`);
  });

  test("loader redirect", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    let responses = app.collectDataResponses();

    await app.clickLink(`/${REDIRECT}`);
    await page.waitForURL(/\/page/);
    await page.waitForLoadState("networkidle");

    expect(
      responses
        .map((res) => new URL(res.url()).searchParams.get("_data"))
        .sort()
    ).toEqual(
      [`routes/${REDIRECT}`, `routes/${PAGE}`, `routes/${PAGE}._index`].sort()
    );

    await page.waitForSelector(`h2:has-text("${PAGE_TEXT}")`);
    await page.waitForSelector(`h3:has-text("${PAGE_INDEX_TEXT}")`);
  });

  test("loader redirect with hash", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    await app.clickLink(`/${REDIRECT_HASH}`);

    await page.waitForURL(/\/page#my-hash/);
    let url = new URL(page.url());
    expect(url.pathname).toBe(`/${REDIRECT_TARGET}`);
    expect(url.hash).toBe(`#my-hash`);
  });

  test("calls changing routes on POP", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/${PAGE}`);
    await app.clickLink(`/${PAGE}/${CHILD}`);

    let responses = app.collectDataResponses();
    await app.goBack();
    await page.waitForLoadState("networkidle");

    expect(
      responses.map((res) => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${PAGE}._index`]);

    await page.waitForSelector(`h2:has-text("${PAGE_TEXT}")`);
    await page.waitForSelector(`h3:has-text("${PAGE_INDEX_TEXT}")`);
  });

  test("useFetcher state should return to the idle when redirect from an action", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/gh-1691");
    expect(await app.getHtml("span")).toMatch("idle");

    await app.waitForNetworkAfter(async () => {
      await app.clickSubmitButton("/gh-1691");
    });
    await page.waitForSelector(`span:has-text("idle")`);
  });

  test("fetcher action redirects re-call parent loaders", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent/child");
    await page.waitForSelector(`#parent:has-text("1")`);

    await app.clickElement("#fetcher-submit-redirect");
    await page.waitForSelector(`#parent:has-text("2")`);
  });
});
