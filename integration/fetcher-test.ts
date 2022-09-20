import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("useFetcher", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let CHEESESTEAK = "CHEESESTEAK";
  let LUNCH = "LUNCH";
  let PARENT_LAYOUT_LOADER = "parent layout loader";
  let PARENT_LAYOUT_ACTION = "parent layout action";
  let PARENT_INDEX_LOADER = "parent index loader";
  let PARENT_INDEX_ACTION = "parent index action";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/resource-route-action-only.ts": js`
          import { json } from "@remix-run/node";
          export function action() {
            return json("${CHEESESTEAK}");
          }
        `,

        "app/routes/fetcher-action-only-call.tsx": js`
          import { useFetcher } from "@remix-run/react";

          export default function FetcherActionOnlyCall() {
            let fetcher = useFetcher();

            let executeFetcher = () => {
              fetcher.submit(new URLSearchParams(), {
                method: 'post',
                action: '/resource-route-action-only',
              });
            };

            return (
              <>
                <button id="fetcher-submit" onClick={executeFetcher}>Click Me</button>
                {fetcher.data && <pre>{fetcher.data}</pre>}
              </>
            );
          }
        `,

        "app/routes/resource-route.jsx": js`
          export function loader() {
            return "${LUNCH}";
          }
          export function action() {
            return "${CHEESESTEAK}";
          }
        `,

        "app/routes/index.jsx": js`
          import { useFetcher } from "@remix-run/react";
          export default function Index() {
            let fetcher = useFetcher();
            return (
              <>
                <fetcher.Form action="/resource-route">
                  <button type="submit" formMethod="get">get</button>
                  <button type="submit" formMethod="post">post</button>
                </fetcher.Form>
                <button id="fetcher-load" type="button" onClick={() => {
                  fetcher.load('/resource-route');
                }}>
                  load
                </button>
                <button id="fetcher-submit" type="button" onClick={() => {
                  fetcher.submit(new URLSearchParams(), {
                    method: 'post',
                    action: '/resource-route'
                  });
                }}>
                  submit
                </button>
                <pre>{fetcher.data}</pre>
              </>
            );
          }
        `,

        "app/routes/parent.jsx": js`
          import { Outlet } from "@remix-run/react";

          export function action() {
            return "${PARENT_LAYOUT_ACTION}";
          };

          export function loader() {
            return "${PARENT_LAYOUT_LOADER}";
          };

          export default function Parent() {
            return <Outlet />;
          }
        `,

        "app/routes/parent/index.jsx": js`
          import { useFetcher } from "@remix-run/react";

          export function action() {
            return "${PARENT_INDEX_ACTION}";
          };

          export function loader() {
            return "${PARENT_INDEX_LOADER}";
          };

          export default function ParentIndex() {
            let fetcher = useFetcher();

            return (
              <>
                <pre>{fetcher.data}</pre>
                <button id="load-parent" onClick={() => fetcher.load('/parent')}>
                  Load parent
                </button>
                <button id="load-index" onClick={() => fetcher.load('/parent?index')}>
                  Load index
                </button>
                <button id="submit-empty" onClick={() => fetcher.submit({})}>
                  Submit empty
                </button>
                <button id="submit-parent-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent' })}>
                  Submit parent
                </button>
                <button id="submit-index-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent?index' })}>
                  Submit index
                </button>
                <button id="submit-parent-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent' })}>
                  Submit parent
                </button>
                <button id="submit-index-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent?index' })}>
                  Submit index
                </button>
              </>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test.describe("No JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("Form can hit a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      await Promise.all([
        page.waitForNavigation(),
        app.clickSubmitButton("/resource-route", {
          wait: false,
          method: "get",
        }),
      ]);

      expect(await app.getHtml("pre")).toMatch(LUNCH);
    });

    test("Form can hit an action", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        app.clickSubmitButton("/resource-route", {
          wait: false,
          method: "post",
        }),
      ]);
      expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    });
  });

  test("load can hit a loader", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-load");
    expect(await app.getHtml("pre")).toMatch(LUNCH);
  });

  test("submit can hit an action", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-submit");
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
  });

  test("submit can hit an action only route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-action-only-call");
    await app.clickElement("#fetcher-submit");
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
  });

  test("fetchers handle ?index param correctly", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent");

    await app.clickElement("#load-parent");
    expect(await app.getHtml("pre")).toMatch(PARENT_LAYOUT_LOADER);

    await app.clickElement("#load-index");
    expect(await app.getHtml("pre")).toMatch(PARENT_INDEX_LOADER);

    // fetcher.submit({}) defaults to GET for the current Route
    await app.clickElement("#submit-empty");
    expect(await app.getHtml("pre")).toMatch(PARENT_INDEX_LOADER);

    await app.clickElement("#submit-parent-get");
    expect(await app.getHtml("pre")).toMatch(PARENT_LAYOUT_LOADER);

    await app.clickElement("#submit-index-get");
    expect(await app.getHtml("pre")).toMatch(PARENT_INDEX_LOADER);

    await app.clickElement("#submit-parent-post");
    expect(await app.getHtml("pre")).toMatch(PARENT_LAYOUT_ACTION);

    await app.clickElement("#submit-index-post");
    expect(await app.getHtml("pre")).toMatch(PARENT_INDEX_ACTION);
  });
});
