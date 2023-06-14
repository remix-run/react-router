import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

const STATES = {
  NORMAL_LOAD: "normal-load",
  LOADING_REDIRECT: "loading-redirect",
  SUBMITTING_LOADER: "submitting-loader",
  SUBMITTING_LOADER_REDIRECT: "submitting-loader-redirect",
  SUBMITTING_ACTION: "submitting-action",
  SUBMITTING_ACTION_REDIRECT: "submitting-action-redirect",
  FETCHER_REDIRECT: "fetcher-redirect",
} as const;

const IDLE_STATE = {
  state: "idle",
  type: "idle",
};

test.describe("rendering", () => {
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
          import { Outlet, Scripts, useTransition } from "@remix-run/react";
          export default function() {
            const transition = useTransition();

            const transitionsRef = useRef();
            const transitions = useMemo(() => {
              const savedTransitions = transitionsRef.current || [];
              savedTransitions.push(transition);
              transitionsRef.current = savedTransitions;
              return savedTransitions;
            }, [transition]);

            return (
              <html lang="en">
                <head><title>Test</title></head>
                <body>
                  <Outlet />
                    {transition.state != "idle" && (
                      <p id="loading-indicator">Loading...</p>
                    )}
                  <p>
                    <code id="transitions">
                      {JSON.stringify(transitions, null, 2)}
                    </code>
                  </p>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.jsx": js`
          import { Form, Link, useFetcher } from "@remix-run/react";
          export function loader() { return null; }
          export default function() {
            const fetcher = useFetcher();
            return (
              <ul>
                <li>
                  <Link to="/${STATES.NORMAL_LOAD}">
                    ${STATES.NORMAL_LOAD}
                  </Link>
                </li>
                <li>
                  <Link to="/${STATES.LOADING_REDIRECT}">
                    ${STATES.LOADING_REDIRECT}
                  </Link>
                </li>
                <li>
                  <Form action="/${STATES.SUBMITTING_LOADER}" method="get">
                    <button type="submit" name="key" value="value">
                      ${STATES.SUBMITTING_LOADER}
                    </button>
                  </Form>
                </li>
                <li>
                  <Form action="/${STATES.SUBMITTING_LOADER_REDIRECT}" method="get">
                    <button type="submit">
                      ${STATES.SUBMITTING_LOADER_REDIRECT}
                    </button>
                  </Form>
                </li>
                <li>
                  <Form action="/${STATES.SUBMITTING_ACTION}" method="post">
                    <button type="submit">
                      ${STATES.SUBMITTING_ACTION}
                    </button>
                  </Form>
                </li>
                <li>
                  <Form action="/${STATES.SUBMITTING_ACTION_REDIRECT}" method="post">
                    <button type="submit">
                      ${STATES.SUBMITTING_ACTION_REDIRECT}
                    </button>
                  </Form>
                </li>
                <li>
                  <fetcher.Form action="/${STATES.FETCHER_REDIRECT}" method="post">
                    <button type="submit">
                      ${STATES.FETCHER_REDIRECT}
                    </button>
                  </fetcher.Form>
                </li>
              </ul>
            );
          }
        `,

        [`app/routes/${STATES.NORMAL_LOAD}.jsx`]: js`
          export default function() {
            return (
              <h2 id="${STATES.NORMAL_LOAD}">
                ${STATES.NORMAL_LOAD}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.LOADING_REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function loader() {
            return redirect("/?redirected");
          }
          export default function() {
            return (
              <h2 id="${STATES.LOADING_REDIRECT}">
                ${STATES.LOADING_REDIRECT}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.SUBMITTING_LOADER}.jsx`]: js`
          export default function() {
            return (
              <h2 id="${STATES.SUBMITTING_LOADER}">
                ${STATES.SUBMITTING_LOADER}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.SUBMITTING_LOADER_REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function loader() {
            return redirect("/?redirected");
          }
          export default function() {
            return (
              <h2 id="${STATES.SUBMITTING_LOADER_REDIRECT}">
                ${STATES.SUBMITTING_LOADER_REDIRECT}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.SUBMITTING_ACTION}.jsx`]: js`
          export function loader() { return null; }
          export function action() { return null; }
          export default function() {
            return (
              <h2 id="${STATES.SUBMITTING_ACTION}">
                ${STATES.SUBMITTING_ACTION}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.SUBMITTING_ACTION_REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function action() {
            return redirect("/?redirected");
          }
          export default function() {
            return (
              <h2 id="${STATES.SUBMITTING_ACTION_REDIRECT}">
                ${STATES.SUBMITTING_ACTION_REDIRECT}
              </h2>
            );
          }
        `,

        [`app/routes/${STATES.FETCHER_REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          export function action() {
            return redirect("/?redirected");
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("transitions to normal load (Loading)", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickLink(`/${STATES.NORMAL_LOAD}`);
    await page.waitForSelector(`#${STATES.NORMAL_LOAD}`);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });

    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "loading",
        type: "normalLoad",
        location: {
          pathname: `/${STATES.NORMAL_LOAD}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to normal redirect (LoadingRedirect)", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickLink(`/${STATES.LOADING_REDIRECT}`);
    await page.waitForURL(/\?redirected/);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "loading",
        type: "normalLoad",
        location: {
          pathname: `/${STATES.LOADING_REDIRECT}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
      },
      {
        state: "loading",
        type: "normalRedirect",
        location: {
          pathname: "/",
          search: "?redirected",
          hash: "",
          state: {
            _isRedirect: true,
            // These were private API for transition manager that are no longer
            // needed with the new router so OK to disappear
            // setCookie: false,
            // type: "loader",
          },
          key: expect.any(String),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to loader submission (SubmittingLoader)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickSubmitButton(`/${STATES.SUBMITTING_LOADER}`);
    await page.waitForSelector(`#${STATES.SUBMITTING_LOADER}`);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "submitting",
        type: "loaderSubmission",
        location: {
          pathname: `/${STATES.SUBMITTING_LOADER}`,
          search: "?key=value",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        submission: {
          // Note: This is a bug in Remix but we're going to keep it that way
          // in useTransition (including the back-compat version) and it'll be
          // fixed with useNavigation
          action: `/${STATES.SUBMITTING_LOADER}?key=value`,
          encType: "application/x-www-form-urlencoded",
          method: "GET",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to loader submission redirect (LoadingLoaderSubmissionRedirect)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickSubmitButton(`/${STATES.SUBMITTING_LOADER_REDIRECT}`);
    await page.waitForURL(/\?redirected/);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "submitting",
        type: "loaderSubmission",
        location: {
          pathname: `/${STATES.SUBMITTING_LOADER_REDIRECT}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_LOADER_REDIRECT}`,
          encType: "application/x-www-form-urlencoded",
          method: "GET",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      {
        state: "loading",
        type: "loaderSubmissionRedirect",
        location: {
          pathname: "/",
          search: "?redirected",
          hash: "",
          state: {
            _isRedirect: true,
            // These were private API for transition manager that are no longer
            // needed with the new router so OK to disappear
            // setCookie: false,
            // type: "loader",
          },
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_LOADER_REDIRECT}`,
          encType: "application/x-www-form-urlencoded",
          method: "GET",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to action submission (SubmittingAction)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickSubmitButton(`/${STATES.SUBMITTING_ACTION}`);
    await page.waitForSelector(`#${STATES.SUBMITTING_ACTION}`);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "submitting",
        type: "actionSubmission",
        location: {
          pathname: `/${STATES.SUBMITTING_ACTION}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_ACTION}`,
          encType: "application/x-www-form-urlencoded",
          method: "POST",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      {
        state: "loading",
        type: "actionReload",
        location: {
          pathname: `/${STATES.SUBMITTING_ACTION}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_ACTION}`,
          encType: "application/x-www-form-urlencoded",
          method: "POST",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to action submission redirect (LoadingActionRedirect)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickSubmitButton(`/${STATES.SUBMITTING_ACTION_REDIRECT}`);
    await page.waitForURL(/\?redirected/);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "submitting",
        type: "actionSubmission",
        location: {
          pathname: `/${STATES.SUBMITTING_ACTION_REDIRECT}`,
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_ACTION_REDIRECT}`,
          encType: "application/x-www-form-urlencoded",
          method: "POST",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      {
        state: "loading",
        type: "actionRedirect",
        location: {
          pathname: "/",
          search: "?redirected",
          hash: "",
          state: {
            _isRedirect: true,
            // These were private API for transition manager that are no longer
            // needed with the new router so OK to disappear
            // setCookie: false,
            // type: "loader",
          },
          key: expect.any(String),
        },
        submission: {
          action: `/${STATES.SUBMITTING_ACTION_REDIRECT}`,
          encType: "application/x-www-form-urlencoded",
          method: "POST",
          key: expect.any(String),
          formData: expect.any(Object),
        },
      },
      IDLE_STATE,
    ]);
  });

  test("transitions to fetcher action submission redirect (LoadingFetchActionRedirect)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    await app.clickSubmitButton(`/${STATES.FETCHER_REDIRECT}`);
    await page.waitForURL(/\?redirected/);
    await page.waitForSelector("#loading-indicator", { state: "hidden" });
    let transitionsCode = await app.getElement("#transitions");
    let transitionsJson = transitionsCode.text();
    let transitions = JSON.parse(transitionsJson);
    expect(transitions).toEqual([
      IDLE_STATE,
      {
        state: "loading",
        type: "fetchActionRedirect",
        location: {
          pathname: "/",
          search: "?redirected",
          hash: "",
          state: {
            _isRedirect: true,
            _isFetchActionRedirect: true,
            // These were private API for transition manager that are no longer
            // needed with the new router so OK to disappear
            // setCookie: false,
            // type: "loader",
          },
          key: expect.any(String),
        },
      },
      IDLE_STATE,
    ]);
  });
});
