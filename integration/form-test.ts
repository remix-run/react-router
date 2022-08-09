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

  let STATIC_ROUTE_ABSOLUTE_ACTION = "static-route-abs";
  let STATIC_ROUTE_CURRENT_ACTION = "static-route-cur";
  let STATIC_ROUTE_PARENT_ACTION = "static-route-parent";
  let STATIC_ROUTE_TOO_MANY_DOTS_ACTION = "static-route-too-many-dots";
  let INDEX_ROUTE_ABSOLUTE_ACTION = "index-route-abs";
  let INDEX_ROUTE_CURRENT_ACTION = "index-route-cur";
  let INDEX_ROUTE_PARENT_ACTION = "index-route-parent";
  let INDEX_ROUTE_TOO_MANY_DOTS_ACTION = "index-route-too-many-dots";
  let DYNAMIC_ROUTE_ABSOLUTE_ACTION = "dynamic-route-abs";
  let DYNAMIC_ROUTE_CURRENT_ACTION = "dynamic-route-cur";
  let DYNAMIC_ROUTE_PARENT_ACTION = "dynamic-route-parent";
  let DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION = "dynamic-route-too-many-dots";
  let LAYOUT_ROUTE_ABSOLUTE_ACTION = "layout-route-abs";
  let LAYOUT_ROUTE_CURRENT_ACTION = "layout-route-cur";
  let LAYOUT_ROUTE_PARENT_ACTION = "layout-route-parent";
  let LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION = "layout-route-too-many-dots";
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
          export default function() {
            return (
              <>
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
              </>
            )
          }
        `,

        "app/routes/blog/$postId.jsx": js`
          import { Form } from "@remix-run/react";
          export default function() {
            return (
              <>
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
      expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    });
  });

  test.describe("with JavaScript", () => {
    test("posts to a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      // this indirectly tests that clicking SVG children in buttons works
      await app.goto("/get-submission");
      await app.clickSubmitButton("/get-submission");
      expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    });
  });

  test("posts to a loader with an <input name='action' />", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${FORM_WITH_ACTION_INPUT} button`);
    await page.waitForLoadState("load");
    expect(await app.getHtml("pre")).toMatch(EAT);
  });

  test("posts to a loader with button data with click", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await Promise.all([
      page.waitForNavigation(),
      app.clickElement("#buttonWithValue"),
    ]);
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  test("posts to a loader with button data with keyboard", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await page.focus(`#${KEYBOARD_INPUT}`);
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  test("posts with the correct checkbox data", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${CHECKBOX_BUTTON}`);
    expect(await app.getHtml("pre")).toBe(
      `<pre>LUNCH=CHEESESTEAK&amp;LUNCH=LAKSA</pre>`
    );
  });

  test("posts button data from outside the form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/get-submission");
    await app.clickElement(`#${ORPHAN_BUTTON}`);
    expect(await app.getHtml("pre")).toMatch(SQUID_INK_HOTDOG);
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
      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/inbox");
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
      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog/abc");
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
      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
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
    });

    test.describe("in a layout route", () => {
      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/blog");
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
      test("absolute action resolves relative to the root route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/projects/blarg");
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

  test("<Form> submits the submitter's value appended to the form data", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/submitter");
    await app.clickElement("text=Add Task");
    await page.waitForLoadState("load");
    expect(await app.getHtml("pre")).toBe(
      `<pre>tasks=first&amp;tasks=second&amp;tasks=</pre>`
    );
  });
});
