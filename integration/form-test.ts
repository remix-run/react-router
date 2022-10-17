import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { getElement, PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("Forms", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let KEYBOARD_INPUT = "KEYBOARD_INPUT";
  let CHECKBOX_BUTTON = "CHECKBOX_BUTTON";
  let ORPHAN_BUTTON = "ORPHAN_BUTTON";
  let FORM_WITH_ACTION_INPUT = "FORM_WITH_ACTION_INPUT";
  let FORM_WITH_ORPHAN = "FORM_WITH_ORPHAN";
  let LUNCH = "LUNCH";
  let CHEESESTEAK = "CHEESESTEAK";
  let LAKSA = "LAKSA";
  let SQUID_INK_HOTDOG = "SQUID_INK_HOTDOG";
  let ACTION = "action";
  let EAT = "EAT";

  let STATIC_ROUTE_NO_ACTION = "static-route-none";
  let STATIC_ROUTE_ABSOLUTE_ACTION = "static-route-abs";
  let STATIC_ROUTE_CURRENT_ACTION = "static-route-cur";
  let STATIC_ROUTE_PARENT_ACTION = "static-route-parent";
  let STATIC_ROUTE_TOO_MANY_DOTS_ACTION = "static-route-too-many-dots";
  let INDEX_ROUTE_NO_ACTION = "index-route-none";
  let INDEX_ROUTE_NO_ACTION_POST = "index-route-none-post";
  let INDEX_ROUTE_ABSOLUTE_ACTION = "index-route-abs";
  let INDEX_ROUTE_CURRENT_ACTION = "index-route-cur";
  let INDEX_ROUTE_PARENT_ACTION = "index-route-parent";
  let INDEX_ROUTE_TOO_MANY_DOTS_ACTION = "index-route-too-many-dots";
  let DYNAMIC_ROUTE_NO_ACTION = "dynamic-route-none";
  let DYNAMIC_ROUTE_ABSOLUTE_ACTION = "dynamic-route-abs";
  let DYNAMIC_ROUTE_CURRENT_ACTION = "dynamic-route-cur";
  let DYNAMIC_ROUTE_PARENT_ACTION = "dynamic-route-parent";
  let DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION = "dynamic-route-too-many-dots";
  let LAYOUT_ROUTE_NO_ACTION = "layout-route-none";
  let LAYOUT_ROUTE_ABSOLUTE_ACTION = "layout-route-abs";
  let LAYOUT_ROUTE_CURRENT_ACTION = "layout-route-cur";
  let LAYOUT_ROUTE_PARENT_ACTION = "layout-route-parent";
  let LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION = "layout-route-too-many-dots";
  let SPLAT_ROUTE_NO_ACTION = "splat-route-none";
  let SPLAT_ROUTE_ABSOLUTE_ACTION = "splat-route-abs";
  let SPLAT_ROUTE_CURRENT_ACTION = "splat-route-cur";
  let SPLAT_ROUTE_PARENT_ACTION = "splat-route-parent";
  let SPLAT_ROUTE_TOO_MANY_DOTS_ACTION = "splat-route-too-many-dots";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/get-submission.jsx": js`
          import { useLoaderData, Form } from "@remix-run/react";

          export function loader({ request }) {
            let url = new URL(request.url);
            return url.searchParams.toString()
          }

          export default function() {
            let data = useLoaderData();
            return (
              <>
                <Form>
                  <input type="text" name="${LUNCH}" defaultValue="${CHEESESTEAK}" />
                  <input type="text" name="${ACTION}" defaultValue="${EAT}" />
                  <button type="submit">
                  </button>
                </Form>

                <Form id="${FORM_WITH_ACTION_INPUT}">
                  <input type="text" name="${ACTION}" defaultValue="${EAT}" />
                  <button type="submit">
                  </button>
                </Form>

                <Form id="${FORM_WITH_ORPHAN}">
                  <input id="${KEYBOARD_INPUT}" type="text" />
                  <button
                    id="buttonWithValue"
                    type="submit"
                    name="${LUNCH}"
                    value="${LAKSA}"
                  >
                    <svg height="100" width="100">
                      <circle id="svg-button-enhanced" cx="50" cy="50" r="40" stroke="black" strokeWidth="3" fill="red" />
                    </svg>
                  </button>
                </Form>

                <button
                  type="submit"
                  id="${ORPHAN_BUTTON}"
                  form="${FORM_WITH_ORPHAN}"
                  name="${LUNCH}"
                  value="${SQUID_INK_HOTDOG}"
                >Orphan</button>

                <Form>
                  <input
                    defaultChecked={true}
                    type="checkbox"
                    name="${LUNCH}"
                    defaultValue="${CHEESESTEAK}"
                  />
                  <input
                    defaultChecked={true}
                    type="checkbox"
                    name="${LUNCH}"
                    defaultValue="${LAKSA}"
                  />

                  <button
                    id="${CHECKBOX_BUTTON}"
                    type="submit"
                  >Go</button>
                </Form>

                <pre>{data}</pre>
              </>
            )
          }
        `,

        "app/routes/about.jsx": js`
          export async function action({ request }) {
            return json({ submitted: true });
          }
          export default function () {
            return <h1>About</h1>;
          }
        `,

        "app/routes/inbox.jsx": js`
          import { Form } from "@remix-run/react";
          export default function() {
            return (
              <>
                <Form id="${STATIC_ROUTE_NO_ACTION}">
                  <button>Submit</button>
                </Form>
                <Form id="${STATIC_ROUTE_ABSOLUTE_ACTION}" action="/about">
                  <button>Submit</button>
                </Form>
                <Form id="${STATIC_ROUTE_CURRENT_ACTION}" action=".">
                  <button>Submit</button>
                </Form>
                <Form id="${STATIC_ROUTE_PARENT_ACTION}" action="..">
                  <button>Submit</button>
                </Form>
                <Form id="${STATIC_ROUTE_TOO_MANY_DOTS_ACTION}" action="../../../about">
                  <button>Submit</button>
                </Form>
              </>
            )
          }
        `,

        "app/routes/blog.jsx": js`
          import { Form, Outlet } from "@remix-run/react";
          export default function() {
            return (
              <>
                <h1>Blog</h1>
                <Form id="${LAYOUT_ROUTE_NO_ACTION}">
                  <button>Submit</button>
                </Form>
                <Form id="${LAYOUT_ROUTE_ABSOLUTE_ACTION}" action="/about">
                  <button>Submit</button>
                </Form>
                <Form id="${LAYOUT_ROUTE_CURRENT_ACTION}" action=".">
                  <button>Submit</button>
                </Form>
                <Form id="${LAYOUT_ROUTE_PARENT_ACTION}" action="..">
                  <button>Submit</button>
                </Form>
                <Form id="${LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION}" action="../../../../about">
                  <button>Submit</button>
                </Form>
                <Outlet />
              </>
            )
          }
        `,

        "app/routes/blog/index.jsx": js`
          import { Form } from "@remix-run/react";
          export function action() {
            return { ok: true };
          }
          export default function() {
            return (
              <>
                <Form id="${INDEX_ROUTE_NO_ACTION}">
                  <input type="hidden" name="foo" defaultValue="1" />
                  <button>Submit</button>
                </Form>
                <Form id="${INDEX_ROUTE_ABSOLUTE_ACTION}" action="/about">
                  <button>Submit</button>
                </Form>
                <Form id="${INDEX_ROUTE_CURRENT_ACTION}" action=".">
                  <button>Submit</button>
                </Form>
                <Form id="${INDEX_ROUTE_PARENT_ACTION}" action="..">
                  <button>Submit</button>
                </Form>
                <Form id="${INDEX_ROUTE_TOO_MANY_DOTS_ACTION}" action="../../../../about">
                  <button>Submit</button>
                </Form>

                <Form method="post" id="${INDEX_ROUTE_NO_ACTION_POST}">
                  <input type="hidden" name="bar" defaultValue="2" />
                  <button>Submit</button>
                </Form>
              </>
            )
          }
        `,

        "app/routes/blog/$postId.jsx": js`
          import { Form } from "@remix-run/react";
          export default function() {
            return (
              <>
                <Form id="${DYNAMIC_ROUTE_NO_ACTION}">
                  <button>Submit</button>
                </Form>
                <Form id="${DYNAMIC_ROUTE_ABSOLUTE_ACTION}" action="/about">
                  <button>Submit</button>
                </Form>
                <Form id="${DYNAMIC_ROUTE_CURRENT_ACTION}" action=".">
                  <button>Submit</button>
                </Form>
                <Form id="${DYNAMIC_ROUTE_PARENT_ACTION}" action="..">
                  <button>Submit</button>
                </Form>
                <Form id="${DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION}" action="../../../../about">
                  <button>Submit</button>
                </Form>
              </>
            )
          }
        `,

        "app/routes/projects.jsx": js`
          import { Form, Outlet } from "@remix-run/react";
          export default function() {
            return (
              <>
                <h1>Projects</h1>
                <Outlet />
              </>
            )
          }
        `,

        "app/routes/projects/index.jsx": js`
          export default function() {
            return <h2>All projects</h2>
          }
        `,

        "app/routes/projects/$.jsx": js`
          import { Form } from "@remix-run/react";
          export default function() {
            return (
              <>
                <Form id="${SPLAT_ROUTE_NO_ACTION}">
                  <button>Submit</button>
                </Form>
                <Form id="${SPLAT_ROUTE_ABSOLUTE_ACTION}" action="/about">
                  <button>Submit</button>
                </Form>
                <Form id="${SPLAT_ROUTE_CURRENT_ACTION}" action=".">
                  <button>Submit</button>
                </Form>
                <Form id="${SPLAT_ROUTE_PARENT_ACTION}" action="..">
                  <button>Submit</button>
                </Form>
                <Form id="${SPLAT_ROUTE_TOO_MANY_DOTS_ACTION}" action="../../../../about">
                  <button>Submit</button>
                </Form>
              </>
            )
          }
        `,

        "app/routes/stop-propagation.jsx": js`
          import { json } from "@remix-run/node";
          import { Form, useActionData } from "@remix-run/react";

          export async function action({ request }) {
            let formData = await request.formData();
            return json(Object.fromEntries(formData));
          }

          export default function Index() {
            let actionData = useActionData();
            return (
              <div onClick={(event) => event.stopPropagation()}>
                <pre>{JSON.stringify(actionData)}</pre>
                <Form method="post">
                  <button type="submit" name="action" value="add">Add</button>
                </Form>
              </div>
            )
          }
        `,

        "app/routes/submitter-formmethod.jsx": js`
          import { useActionData, useLoaderData, Form } from "@remix-run/react";
          import { json } from '@remix-run/node'

          export function action({ request }) {
            return json(request.method)
          }

          export function loader({ request }) {
            return json(request.method)
          }

          export default function Index() {
            let actionData = useActionData();
            let loaderData = useLoaderData();
            return (
              <>
                <Form method="post">
                  <button type="submit" formMethod="get">Submit with GET</button>
                </Form>
                <Form method="get">
                  <button type="submit" formMethod="post">Submit with POST</button>
                </Form>

                <pre>{actionData || loaderData}</pre>
              </>
            )
          }
        `,

        "app/routes/form-method.jsx": js`
          import { Form, useActionData } from "@remix-run/react";
          import { json } from "@remix-run/node";

          export function action({ request }) {
            return json(request.method)
          }
          export default function() {
            let actionData = useActionData();
            return (
              <>
                <Form method="post">
                  <button type="submit">Submit</button>
                </Form>
                <pre>{actionData}</pre>
              </>
            )
          }
        `,

        "app/routes/button-form-method.jsx": js`
          import { Form, useActionData } from "@remix-run/react";
          import { json } from "@remix-run/node";

          export function action({ request }) {
            return json(request.method)
          }
          export default function() {
            let actionData = useActionData();
            return (
              <>
                <Form>
                  <button type="submit" formMethod="post">Submit</button>
                </Form>
                <pre>{actionData}</pre>
              </>
            )
          }
        `,

        "app/routes/submitter.jsx": js`
          import { useLoaderData, Form } from "@remix-run/react";

          export function loader({ request }) {
            let url = new URL(request.url);
            return url.searchParams.toString()
          }

          export default function() {
            let data = useLoaderData();
            return (
              <Form>
                <input type="text" name="tasks" defaultValue="first" />
                <input type="text" name="tasks" defaultValue="second" />
                <button type="submit" name="tasks" value="">
                  Add Task
                </button>
                <pre>{data}</pre>
              </Form>
            )
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("posts to a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await Promise.all([
        page.waitForNavigation(),
        app.clickSubmitButton("/get-submission", { wait: false }),
      ]);
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });
  });

  test.describe("with JavaScript", () => {
    test("posts to a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      // this indirectly tests that clicking SVG children in buttons works
      await app.goto("/get-submission");
      await app.clickSubmitButton("/get-submission");
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });
  });

  test("posts to a loader with an <input name='action' />", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${FORM_WITH_ACTION_INPUT} button`);
    await page.waitForLoadState("load");
    await page.waitForSelector(`pre:has-text("${EAT}")`);
  });

  test("posts to a loader with button data with click", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await Promise.all([
      page.waitForNavigation(),
      app.clickElement("#buttonWithValue"),
    ]);
    await page.waitForSelector(`pre:has-text("${LAKSA}")`);
  });

  test("posts to a loader with button data with keyboard", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await page.focus(`#${KEYBOARD_INPUT}`);
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(`pre:has-text("${LAKSA}")`);
  });

  test("posts with the correct checkbox data", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${CHECKBOX_BUTTON}`);
    await page.waitForSelector(`pre:has-text("${LAKSA}")`);
    await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
  });

  test("posts button data from outside the form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${ORPHAN_BUTTON}`);
    await page.waitForSelector(`pre:has-text("${SQUID_INK_HOTDOG}")`);
  });

  test("when clicking on a submit button as a descendant of an element that stops propagation on click, still passes the clicked submit button's `name` and `value` props to the request payload", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/stop-propagation");
    await app.clickSubmitButton("/stop-propagation");
    expect(await app.getHtml()).toMatch('{"action":"add"}');
  });

  test.describe("<Form> action", () => {
    test.describe("in a static route", () => {
      test("no action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/inbox");
      });

      test("no action resolves to URL including search params", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/inbox?foo=bar");
      });

      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/inbox");
      });

      test("'.' excludes search params", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/inbox");
      });

      test("'..' action resolves relative to the parent route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    test.describe("in a dynamic route", () => {
      test("no action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog/abc");
      });

      test("no action resolves to URL including search params", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog/abc?foo=bar");
      });

      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog/abc");
      });

      test("'.' excludes search params", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog/abc");
      });

      test("'..' action resolves relative to the parent route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    test.describe("in an index route", () => {
      test("no action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("no action resolves to URL including search params", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog?index&foo=bar");
      });

      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'.' excludes search params", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action resolves relative to the parent route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("handles search params correctly on GET submissions", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);

        // Start with a query param
        await app.goto("/blog?junk=1");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toBe("/blog?index&junk=1");
        expect(app.page.url()).toMatch(/\/blog\?junk=1$/);

        // On submission, we replace existing parameters (reflected in the
        // form action) with the values from the form data.  We also do not
        // need to preserve the index param in the URL on GET submissions
        await app.clickElement(`#${INDEX_ROUTE_NO_ACTION} button`);
        html = await app.getHtml();
        el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toBe("/blog?index&foo=1");
        expect(app.page.url()).toMatch(/\/blog\?foo=1$/);

        // Does not append duplicate params on re-submissions
        await app.clickElement(`#${INDEX_ROUTE_NO_ACTION} button`);
        html = await app.getHtml();
        el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toBe("/blog?index&foo=1");
        expect(app.page.url()).toMatch(/\/blog\?foo=1$/);
      });

      test("handles search params correctly on POST submissions", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);

        // Start with a query param
        await app.goto("/blog?junk=1");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_NO_ACTION_POST}`);
        expect(el.attr("action")).toBe("/blog?index&junk=1");
        expect(app.page.url()).toMatch(/\/blog\?junk=1$/);

        // Form action reflects the current params and change them on submission
        await app.clickElement(`#${INDEX_ROUTE_NO_ACTION_POST} button`);
        html = await app.getHtml();
        el = getElement(html, `#${INDEX_ROUTE_NO_ACTION_POST}`);
        expect(el.attr("action")).toBe("/blog?index&junk=1");
        expect(app.page.url()).toMatch(/\/blog\?index&junk=1$/);
      });
    });

    test.describe("in a layout route", () => {
      test("no action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("no action resolves to URL including search params", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/blog?foo=bar");
      });

      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'.' excludes search params", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action resolves relative to the parent route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    test.describe("in a splat route", () => {
      test("no action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("no action resolves to URL including search params", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_NO_ACTION}`);
        expect(el.attr("action")).toMatch("/projects?foo=bar");
      });

      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the closest route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("'.' excludes search params", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg?foo=bar");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("'..' action resolves relative to the parent route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });
  });

  test.describe("with submitter button having `formMethod` attribute", () => {
    test.describe("overrides the form `method` attribute with the button `formmethod` attribute", () => {
      test("submits with GET instead of POST", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/submitter-formmethod");
        await app.clickElement("text=Submit with GET");
        await page.waitForLoadState("load");
        expect(await app.getHtml("pre")).toBe("<pre>GET</pre>");
      });

      test("submits with POST instead of GET", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/submitter-formmethod");
        await app.clickElement("text=Submit with POST");
        await page.waitForLoadState("load");
        expect(await app.getHtml("pre")).toBe("<pre>POST</pre>");
      });
    });

    test("uses the form `method` attribute", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/form-method");
      await app.clickElement("button");
      await page.waitForLoadState("load");
      expect(await app.getHtml("pre")).toMatch("POST");
    });

    test("uses the button `formmethod` attribute", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/button-form-method");
      await app.clickElement("button");
      await page.waitForLoadState("load");
      expect(await app.getHtml("pre")).toMatch("POST");
    });
  });

  test("<Form> submits the submitter's value appended to the form data", async ({
    page,
    browserName,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/submitter");
    await app.clickElement("text=Add Task");
    await page.waitForLoadState("load");
    // TODO: remove after playwright ships safari 16
    if (browserName === "webkit") {
      expect(await app.getHtml("pre")).toBe(
        `<pre>tasks=first&amp;tasks=second&amp;tasks=&amp;tasks=</pre>`
      );
    } else {
      expect(await app.getHtml("pre")).toBe(
        `<pre>tasks=first&amp;tasks=second&amp;tasks=</pre>`
      );
    }
  });
});
