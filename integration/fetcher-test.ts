import { expect, test } from "@playwright/test";

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

        "app/routes/fetcher-echo.jsx": js`
        import { json } from "@remix-run/node";
        import { useFetcher } from "@remix-run/react";

          export async function action({ request }) {
            await new Promise(r => setTimeout(r, 1000));
            let value = (await request.formData()).get('value');
            return json({ data: "ACTION " + value })
          }

          export async function loader({ request }) {
            await new Promise(r => setTimeout(r, 1000));
            let value = new URL(request.url).searchParams.get('value');
            return json({ data: "LOADER " + value })
          }

          export default function Index() {
            let fetcherValues = [];
            if (typeof window !== 'undefined') {
              if (!window.fetcherValues) {
                window.fetcherValues = [];
              }
              fetcherValues = window.fetcherValues
            }

            let fetcher = useFetcher();

            let currentValue = fetcher.state + '/' + fetcher.data?.data;
            if (fetcherValues[fetcherValues.length - 1] !== currentValue) {
              fetcherValues.push(currentValue)
            }

            return (
              <>
                <input id="fetcher-input" name="value" />
                <button id="fetcher-load" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.load('/fetcher-echo?value=' + value)
                }}>Load</button>
                <button id="fetcher-submit" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.submit({ value }, { method: 'post', action: '/fetcher-echo' })
                }}>Submit</button>

                {fetcher.state === 'idle' ? <p id="fetcher-idle">IDLE</p> : null}
                <pre>{JSON.stringify(fetcherValues)}</pre>
              </>
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

      await page.waitForSelector(`pre:has-text("${LUNCH}")`);
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
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });
  });

  test("load can hit a loader", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector(`pre:has-text("${LUNCH}")`);
  });

  test("submit can hit an action", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
  });

  test("submit can hit an action only route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-action-only-call");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
  });

  test("fetchers handle ?index param correctly", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent");

    await app.clickElement("#load-parent");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

    await app.clickElement("#load-index");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    // fetcher.submit({}) defaults to GET for the current Route
    await app.clickElement("#submit-empty");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    await app.clickElement("#submit-parent-get");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

    await app.clickElement("#submit-index-get");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    await app.clickElement("#submit-parent-post");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_ACTION}")`);

    await app.clickElement("#submit-index-post");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_ACTION}")`);
  });

  test("fetcher.load persists data through reloads", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/fetcher-echo", true);
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined"])
    );

    await page.fill("#fetcher-input", "1");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined", "loading/undefined", "idle/LOADER 1"])
    );

    await page.fill("#fetcher-input", "2");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "loading/undefined",
        "idle/LOADER 1",
        "loading/LOADER 1", // Preserves old data during reload
        "idle/LOADER 2",
      ])
    );
  });

  test("fetcher.submit persists data through resubmissions", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/fetcher-echo", true);
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined"])
    );

    await page.fill("#fetcher-input", "1");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "submitting/undefined",
        "loading/ACTION 1",
        "idle/ACTION 1",
      ])
    );

    await page.fill("#fetcher-input", "2");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "submitting/undefined",
        "loading/ACTION 1",
        "idle/ACTION 1",
        "submitting/ACTION 1", // Preserves old data during resubmissions
        "loading/ACTION 2",
        "idle/ACTION 2",
      ])
    );
  });
});
