import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("useFetcher", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let CHEESESTEAK = "CHEESESTEAK";
  let LUNCH = "LUNCH";

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
});
