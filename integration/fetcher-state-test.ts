import { test, expect } from "@playwright/test";
import { ServerMode } from "@remix-run/server-runtime/mode";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

// idle, done, actionReload are tested during the testing of these flows
const TYPES = {
  actionSubmission: "actionSubmission",
  loaderSubmission: "loaderSubmission",
  actionRedirect: "actionRedirect",
  normalLoad: "normalLoad",
};

test.describe("fetcher states", () => {
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
      config: {
        future: { v2_routeConvention: true },
      },
      files: {
        "app/root.jsx": js`
          import { useMemo, useRef } from "react";
          import { Outlet, Scripts, useFetchers } from "@remix-run/react";

          export default function Comp() {
            // Only gonna use a single fetcher in any given test but this way
            // we can route away from the child route and preserve the info
            const [fetcher] = useFetchers();
            const fetcherRef = useRef();
            const states = useMemo(() => {
              if (!fetcher) return
              const savedStates = fetcherRef.current || [];
              // Concurrent mode can cause multiple re-renders here on transitions
              // here so only re-capture when our tested fetcher changes states
              if (savedStates[savedStates.length - 1]?.state !== fetcher.state) {
                savedStates.push({
                  state: fetcher.state,
                  type: fetcher.type,
                  formMethod: fetcher.formMethod,
                  formAction: fetcher.formAction,
                  formData:fetcher.formData ? Object.fromEntries(fetcher.formData.entries()) : undefined,
                  formEncType: fetcher.formEncType,
                  submission: fetcher.submission ? {
                    ...fetcher.submission,
                    formData: Object.fromEntries(fetcher.submission.formData.entries()),
                    key: undefined
                  }: undefined,
                  data: fetcher.data,
                });
              }
              fetcherRef.current = savedStates;
              return savedStates;
            }, [fetcher]);

            return (
              <html lang="en">
                <head><title>Test</title></head>
                <body>
                  <Outlet />
                    {fetcher && fetcher.state != "idle" && (
                      <p id="loading">Loading...</p>
                    )}
                  <p>
                    <code id="states">
                      {JSON.stringify(states, null, 2)}
                    </code>
                  </p>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/page.jsx": js`
          import { redirect } from "@remix-run/node";
          import { useFetcher } from "@remix-run/react";
          export function loader() {
            return { from: 'loader' }
          }
          export async function action({ request }) {
            let fd = await request.formData()
            if (fd.has('redirect')) {
              return redirect('/redirect');
            }
            return { from: 'action' }
          }
          export default function() {
            const fetcher = useFetcher();
            return (
              <>
                {fetcher.type === 'init' ?
                  <pre id="initial-state">
                    {
                      JSON.stringify({
                        state: fetcher.state,
                        type: fetcher.type,
                        formMethod: fetcher.formMethod,
                        formAction: fetcher.formAction,
                        formData: fetcher.formData,
                        formEncType: fetcher.formEncType,
                        submission: fetcher.submission,
                        data: fetcher.data,
                      })
                    }
                  </pre> :
                  null}
                <fetcher.Form method="post">
                  ${TYPES.actionSubmission}
                  <button type="submit" name="key" value="value" id="${TYPES.actionSubmission}">
                    Submit ${TYPES.actionSubmission}
                  </button>
                </fetcher.Form>
                <fetcher.Form method="get">
                  ${TYPES.loaderSubmission}
                  <button type="submit" name="key" value="value" id="${TYPES.loaderSubmission}">
                    Submit ${TYPES.loaderSubmission}
                  </button>
                </fetcher.Form>
                <fetcher.Form method="post">
                  ${TYPES.actionRedirect}
                  <button type="submit" name="redirect" value="yes" id="${TYPES.actionRedirect}">
                    Submit ${TYPES.actionRedirect}
                  </button>
                </fetcher.Form>
                <button id="${TYPES.normalLoad}" onClick={() => fetcher.load('/page')}>
                  Submit ${TYPES.normalLoad}
                </button>
              </>
            );
          }
        `,
        "app/routes/redirect.jsx": js`
          export function loader() {
            return { from: 'redirect loader' }
          }
          export default function() {
            return <h1>Redirect</h1>;
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture, ServerMode.Development);
  });

  test.afterAll(() => appFixture.close());

  test("represents a initial fetcher", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/page", true);
    let text = (await app.getElement("#initial-state")).text();
    expect(JSON.parse(text)).toEqual({
      state: "idle",
      type: "init",
    });
  });

  test("represents an actionSubmission fetcher", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/page", true);
    await app.clickElement(`#${TYPES.actionSubmission}`);
    await page.waitForSelector("#loading", { state: "hidden" });
    let text = (await app.getElement("#states")).text();
    expect(JSON.parse(text)).toEqual([
      {
        state: "submitting",
        type: "actionSubmission",
        formData: { key: "value" },
        formAction: "/page",
        formMethod: "POST",
        formEncType: "application/x-www-form-urlencoded",
        submission: {
          formData: { key: "value" },
          action: "/page",
          method: "POST",
          encType: "application/x-www-form-urlencoded",
        },
      },
      {
        state: "loading",
        type: "actionReload",
        formData: { key: "value" },
        formAction: "/page",
        formMethod: "POST",
        formEncType: "application/x-www-form-urlencoded",
        submission: {
          formData: { key: "value" },
          action: "/page",
          method: "POST",
          encType: "application/x-www-form-urlencoded",
        },
        data: {
          from: "action",
        },
      },
      {
        state: "idle",
        type: "done",
        data: {
          from: "action",
        },
      },
    ]);
  });

  test("represents a loaderSubmission fetcher", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/page", true);
    await app.clickElement(`#${TYPES.loaderSubmission}`);
    await page.waitForSelector("#loading", { state: "hidden" });
    let text = (await app.getElement("#states")).text();
    expect(JSON.parse(text)).toEqual([
      {
        state: "submitting",
        type: "loaderSubmission",
        formData: { key: "value" },
        formAction: "/page",
        formMethod: "GET",
        formEncType: "application/x-www-form-urlencoded",
        submission: {
          formData: { key: "value" },
          // Note: This is a bug in Remix but we're going to keep it that way
          // in useTransition (including the back-compat version) and it'll be
          // fixed with useNavigation
          action: "/page?key=value",
          method: "GET",
          encType: "application/x-www-form-urlencoded",
        },
      },
      {
        state: "idle",
        type: "done",
        data: {
          from: "loader",
        },
      },
    ]);
  });

  test("represents an actionRedirect fetcher", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/page", true);
    await app.clickElement(`#${TYPES.actionRedirect}`);
    await page.waitForSelector("#loading", { state: "hidden" });
    let text = (await app.getElement("#states")).text();
    expect(JSON.parse(text)).toEqual([
      {
        state: "submitting",
        type: "actionSubmission",
        formData: { redirect: "yes" },
        formAction: "/page",
        formMethod: "POST",
        formEncType: "application/x-www-form-urlencoded",
        submission: {
          formData: { redirect: "yes" },
          action: "/page",
          method: "POST",
          encType: "application/x-www-form-urlencoded",
        },
      },
      {
        state: "loading",
        type: "actionRedirect",
        formData: { redirect: "yes" },
        formAction: "/page",
        formMethod: "POST",
        formEncType: "application/x-www-form-urlencoded",
        submission: {
          formData: { redirect: "yes" },
          action: "/page",
          method: "POST",
          encType: "application/x-www-form-urlencoded",
        },
      },
      {
        state: "idle",
        type: "done",
      },
    ]);
  });

  test("represents a normalLoad fetcher", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/page", true);
    await app.clickElement(`#${TYPES.normalLoad}`);
    await page.waitForSelector("#loading", { state: "hidden" });
    let text = (await app.getElement("#states")).text();
    expect(JSON.parse(text)).toEqual([
      {
        state: "loading",
        type: "normalLoad",
      },
      {
        data: { from: "loader" },
        state: "idle",
        type: "done",
      },
    ]);
  });
});
