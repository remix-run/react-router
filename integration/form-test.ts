import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { getElement, PlaywrightFixture } from "./helpers/playwright-fixture.js";

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

  test.beforeEach(async ({ context }) => {
    await context.route(/\.data$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      route.continue();
    });
  });

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/get-submission.tsx": js`
          import { useLoaderData, Form } from "react-router";

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

        "app/routes/about.tsx": js`
          export async function action({ request }) {
            return { submitted: true };
          }
          export default function () {
            return <h1>About</h1>;
          }
        `,

        "app/routes/inbox.tsx": js`
          import { Form } from "react-router";
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

        "app/routes/blog.tsx": js`
          import { Form, Outlet } from "react-router";
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

        "app/routes/blog._index.tsx": js`
          import { Form } from "react-router";

          export function loader() {
            return { timestamp: Date.now() }
          }

          export function action() {
            return { ok: true };
          }

          export default function Component({ loaderData }) {
            return (
              <>
                <div id="timestamp">{loaderData.timestamp}</div>
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

        "app/routes/blog.$postId.tsx": js`
          import { Form } from "react-router";
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

        "app/routes/projects.tsx": js`
          import { Form, Outlet } from "react-router";
          export default function() {
            return (
              <>
                <h1>Projects</h1>
                <Outlet />
              </>
            )
          }
        `,

        "app/routes/projects._index.tsx": js`
          export default function() {
            return <h2>All projects</h2>
          }
        `,

        "app/routes/projects.$.tsx": js`
          import { Form } from "react-router";
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

        "app/routes/stop-propagation.tsx": js`
          import { Form, useActionData } from "react-router";

          export async function action({ request }) {
            let formData = await request.formData();
            return Object.fromEntries(formData);
          }

          export default function Index() {
            let actionData = useActionData();
            return (
              <div onClick={(event) => event.stopPropagation()}>
                {actionData ? <pre id="action-data">{JSON.stringify(actionData)}</pre> : null}
                <Form method="post">
                  <button type="submit" name="intent" value="add">Add</button>
                </Form>
              </div>
            )
          }
        `,

        "app/routes/form-method.tsx": js`
          import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";

          export function action({ request }) {
            return request.method
          }

          export function loader({ request }) {
            return request.method
          }

          export default function() {
            let actionData = useActionData();
            let loaderData = useLoaderData();
            let [searchParams] = useSearchParams();
            let formMethod = searchParams.get('method') || 'GET';
            let submitterFormMethod = searchParams.get('submitterFormMethod') || 'GET';
            return (
              <>
                <Form method={formMethod}>
                  <button>Submit</button>
                  <button formMethod={submitterFormMethod}>Submit with {submitterFormMethod}</button>
                </Form>
                {actionData ? <pre id="action-method">{actionData}</pre> : null}
                <pre id="loader-method">{loaderData}</pre>
              </>
            )
          }
        `,

        "app/routes/submitter.tsx": js`
          import { Form } from "react-router";

          export default function() {
            return (
              <>
                <button name="tasks" value="outside" form="myform">Outside</button>
                <Form action="/outputFormData" id="myform">
                  <input type="text" name="tasks" defaultValue="first" />
                  <input type="text" name="tasks" defaultValue="second" />

                  <button name="tasks" value="">Add Task</button>
                  <button value="">No Name</button>
                  <input type="image" name="tasks" alt="Add Task" />
                  <input type="image" alt="No Name" />

                  <input type="text" name="tasks" defaultValue="last" />
                </Form>
              </>
            )
          }
        `,

        "app/routes/file-upload.tsx": js`
          import { Form, useSearchParams } from "react-router";

          export default function() {
            const [params] = useSearchParams();
            return (
              <Form
                action="/outputFormData"
                method={params.get("method") ?? undefined}
                encType={params.get("encType") ?? undefined}
              >
                <input type="file" name="filey" />
                <input type="file" name="filey2" multiple />
                <input type="file" name="filey3" />
                <button />
              </Form>
            )
          }
        `,

        "app/routes/empty-file-upload.tsx": js`
          import { Form, useActionData } from "react-router";

          export async function action({ request }) {
            let formData = await request.formData();
            return {
              text: formData.get('text'),
              file: {
                name: formData.get('file').name,
                size: formData.get('file').size,
              },
              fileMultiple: formData.getAll('fileMultiple').map(f => ({
                name: f.name,
                size: f.size,
              })),
            }
          }

          export default function() {
            const actionData = useActionData();
            return (
              <Form method="post" encType="multipart/form-data">
                <input name="text" />
                <input type="file" name="file" />
                <input type="file" name="fileMultiple" multiple />
                <button type="submit">Submit</button>
                {actionData ? <p id="action-data">{JSON.stringify(actionData)}</p> : null}
              </Form>
            )
          }
        `,

        // Generic route for outputting url-encoded form data (either from the request body or search params)
        //
        // TODO: refactor other tests to use this
        "app/routes/outputFormData.tsx": js`
          import { useActionData, useSearchParams } from "react-router";

          export async function action({ request }) {
            const formData = await request.formData();
            const body = new URLSearchParams();
            for (let [key, value] of formData) {
              body.append(
                key,
                value instanceof File ? await streamToString(value.stream()) : value
              );
            }
            return body.toString();
          }

          export default function OutputFormData() {
            const requestBody = useActionData();
            const searchParams = useSearchParams()[0];
            return <input id="formData" defaultValue={requestBody ?? searchParams} />;
          }
        `,

        "myfile.txt": "stuff",

        "app/routes/pathless-layout-parent.tsx": js`
          import { Form, Outlet, useActionData } from "react-router"

          export async function action({ request }) {
            return { submitted: true };
          }
          export default function () {
            let data = useActionData();
            return (
              <>
                <Form method="post">
                  <h1>Pathless Layout Parent</h1>
                  <button type="submit">Submit</button>
                </Form>
                <Outlet />
                <p>{data?.submitted === true ? 'Submitted - Yes' : 'Submitted - No'}</p>
              </>
            );
          }
        `,

        "app/routes/pathless-layout-parent._pathless.nested.tsx": js`
          import { Outlet } from "react-router";

          export default function () {
            return (
              <>
                <h2>Pathless Layout</h2>
                <Outlet />
              </>
            );
          }
        `,

        "app/routes/pathless-layout-parent._pathless.nested._index.tsx": js`
          export default function () {
            return <h3>Pathless Layout Index</h3>
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    runFormTests();
  });

  test.describe("with JavaScript", () => {
    test.use({ javaScriptEnabled: true }); // explicitly set so we don't have to check against undefined

    runFormTests();
  });

  function runFormTests() {
    test("posts to a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      // this indirectly tests that clicking SVG children in buttons works
      await app.goto("/get-submission");
      await app.clickSubmitButton("/get-submission", { wait: true });
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });

    test("posts to a loader with an <input name='action' />", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await page.locator(`#${FORM_WITH_ACTION_INPUT} button`).click();
      await page.locator(`pre:has-text("${EAT}")`).waitFor();
    });

    test("posts to a loader with button data with click", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await page.locator("#buttonWithValue").click();
      await page.locator(`pre:has-text("${LAKSA}")`).waitFor();
    });

    test("posts to a loader with button data with keyboard", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await page.focus(`#${KEYBOARD_INPUT}`);
      await app.waitForNetworkAfter(async () => {
        await page.keyboard.press("Enter");
        // there can be a delay before the request gets kicked off (worse with JS disabled)
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      await page.waitForSelector(`pre:has-text("${LAKSA}")`);
    });

    test("posts with the correct checkbox data", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await page.locator(`#${CHECKBOX_BUTTON}`).click();
      await page.locator(`pre:has-text("${LAKSA}")`).waitFor();
      await page.locator(`pre:has-text("${CHEESESTEAK}")`).waitFor();
    });

    test("posts button data from outside the form", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/get-submission");
      await page.locator(`#${ORPHAN_BUTTON}`).click();
      await page.locator(`pre:has-text("${SQUID_INK_HOTDOG}")`).waitFor();
    });

    test(
      "when clicking on a submit button as a descendant of an element that " +
        "stops propagation on click, still passes the clicked submit button's " +
        "`name` and `value` props to the request payload",
      async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/stop-propagation");
        await app.clickSubmitButton("/stop-propagation", { wait: true });
        await page.waitForSelector("#action-data");
        expect(await app.getHtml()).toMatch('{"intent":"add"}');
      }
    );

    test.describe("<Form> action", () => {
      test.describe("in a static route", () => {
        test("no action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/inbox");
        });

        test("no action resolves to URL including search params", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/inbox?foo=bar");
        });

        test("absolute action resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_ABSOLUTE_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("'.' action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/inbox");
        });

        test("'.' excludes search params", async ({ page }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/inbox");
        });

        test("'..' action resolves relative to the parent route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_PARENT_ACTION}`);
          expect(el.attr("action")).toBe("/");
        });

        test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/inbox");
          let html = await app.getHtml();
          let el = getElement(html, `#${STATIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
          expect(el.attr("action")).toBe("/about");
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
          expect(el.attr("action")).toBe("/blog/abc");
        });

        test("no action resolves to URL including search params", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/blog/abc?foo=bar");
        });

        test("absolute action resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_ABSOLUTE_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("'.' action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog/abc");
        });

        test("'.' excludes search params", async ({ page }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog/abc");
        });

        test("'..' action resolves relative to the parent route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_PARENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog");
        });

        test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog/abc");
          let html = await app.getHtml();
          let el = getElement(html, `#${DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
          expect(el.attr("action")).toBe("/about");
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
          expect(el.attr("action")).toBe("/blog?index");
        });

        test("no action resolves to URL including search params", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/blog?index&foo=bar");
        });

        test("absolute action resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_ABSOLUTE_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("'.' action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog?index");
        });

        test("'.' excludes search params", async ({ page }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog?index");
        });

        test("'..' action resolves relative to the parent route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_PARENT_ACTION}`);
          expect(el.attr("action")).toBe("/");
        });

        test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${INDEX_ROUTE_TOO_MANY_DOTS_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("handles search params correctly on GET submissions", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);

          const timestamp = page.locator(`#timestamp`);
          const form = page.locator(`#${INDEX_ROUTE_NO_ACTION}`);
          const submit = page.locator(`#${INDEX_ROUTE_NO_ACTION} button`);

          // Start with a query param
          await app.goto("/blog?junk=1");
          const t0 = await timestamp.innerText();
          await expect(form).toHaveAttribute("action", "/blog?index&junk=1");
          expect(page.url()).toMatch(/\/blog\?junk=1$/);

          // On submission, we replace existing parameters (reflected in the
          // form action) with the values from the form data.  We also do not
          // need to preserve the index param in the URL on GET submissions
          await submit.click();
          const t1 = await timestamp.filter({ hasNotText: t0 }).innerText();
          await expect(form).toHaveAttribute("action", "/blog?index&foo=1");
          expect(page.url()).toMatch(/\/blog\?foo=1$/);

          // Does not append duplicate params on re-submissions
          await submit.click();
          await timestamp.filter({ hasNotText: t1 }).innerText();
          await expect(form).toHaveAttribute("action", "/blog?index&foo=1");
          expect(page.url()).toMatch(/\/blog\?foo=1$/);
        });

        test("handles search params correctly on POST submissions", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);

          const timestamp = page.locator(`#timestamp`);
          const form = page.locator(`#${INDEX_ROUTE_NO_ACTION_POST}`);
          const submit = page.locator(`#${INDEX_ROUTE_NO_ACTION_POST} button`);

          // Start with a query param
          await app.goto("/blog?junk=1");
          const t0 = await timestamp.innerText();
          await expect(form).toHaveAttribute("action", "/blog?index&junk=1");
          expect(page.url()).toMatch(/\/blog\?junk=1$/);

          // Form action reflects the current params and change them on submission
          await submit.click();
          await timestamp.filter({ hasNotText: t0 }).innerText();
          await expect(form).toHaveAttribute("action", "/blog?index&junk=1");

          await page.waitForURL(/\/blog\?index&junk=1$/);
          expect(page.url()).toMatch(/\/blog\?index&junk=1$/);
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
          expect(el.attr("action")).toBe("/blog");
        });

        test("no action resolves to URL including search params", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/blog?foo=bar");
        });

        test("absolute action resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_ABSOLUTE_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("'.' action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog");
        });

        test("'.' excludes search params", async ({ page }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/blog");
        });

        test("'..' action resolves relative to the parent route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_PARENT_ACTION}`);
          expect(el.attr("action")).toBe("/");
        });

        test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/blog");
          let html = await app.getHtml();
          let el = getElement(html, `#${LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION}`);
          expect(el.attr("action")).toBe("/about");
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
          expect(el.attr("action")).toBe("/projects/blarg");
        });

        test("no action resolves to URL including search params", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_NO_ACTION}`);
          expect(el.attr("action")).toBe("/projects/blarg?foo=bar");
        });

        test("absolute action resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_ABSOLUTE_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });

        test("'.' action resolves relative to the closest route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/projects/blarg");
        });

        test("'.' excludes search params", async ({ page }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg?foo=bar");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_CURRENT_ACTION}`);
          expect(el.attr("action")).toBe("/projects/blarg");
        });

        test("'..' action resolves relative to the parent route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_PARENT_ACTION}`);
          expect(el.attr("action")).toBe("/projects");
        });

        test("'..' action with more .. segments than parent routes resolves relative to the root route", async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto("/projects/blarg");
          let html = await app.getHtml();
          let el = getElement(html, `#${SPLAT_ROUTE_TOO_MANY_DOTS_ACTION}`);
          expect(el.attr("action")).toBe("/about");
        });
      });
    });

    let FORM_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    let NATIVE_FORM_METHODS = ["GET", "POST"];

    test.describe("uses the Form `method` attribute", () => {
      FORM_METHODS.forEach((method) => {
        test(`submits with ${method}`, async ({ page, javaScriptEnabled }) => {
          test.fail(
            !javaScriptEnabled && !NATIVE_FORM_METHODS.includes(method),
            `Native <form> doesn't support method ${method} #4420`
          );

          let app = new PlaywrightFixture(appFixture, page);
          await app.goto(`/form-method?method=${method}`, true);
          await page.getByText("Submit", { exact: true }).click();
          if (method !== "GET") {
            await expect(page.locator("#action-method")).toHaveText(method);
          }
          await expect(page.locator("#loader-method")).toHaveText("GET");
        });
      });
    });

    test.describe("overrides the Form `method` attribute with the submitter's `formMethod` attribute", () => {
      // NOTE: HTMLButtonElement only supports get/post as formMethod, which is why we don't test put/patch/delete
      NATIVE_FORM_METHODS.forEach((overrideMethod) => {
        // ensure the form's method is different from the submitter's
        let method = overrideMethod === "GET" ? "POST" : "GET";
        test(`submits with ${overrideMethod} instead of ${method}`, async ({
          page,
        }) => {
          let app = new PlaywrightFixture(appFixture, page);
          await app.goto(
            `/form-method?method=${method}&submitterFormMethod=${overrideMethod}`,
            true
          );
          await page.locator(`text=Submit with ${overrideMethod}`).click();
          if (overrideMethod !== "GET") {
            await expect(page.locator("pre#action-method")).toHaveText(
              overrideMethod
            );
          }
          await expect(page.locator("pre#loader-method")).toHaveText("GET");
        });
      });
    });

    test("submits the submitter's value(s) in tree order in the form data", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);

      const formData = page.locator("#formData");

      await app.goto("/submitter");
      await page.locator("text=Add Task").click();
      await expect(formData).toHaveValue(
        "tasks=first&tasks=second&tasks=&tasks=last"
      );

      await app.goto("/submitter");
      await page.locator("text=No Name").click();
      await expect(formData).toHaveValue("tasks=first&tasks=second&tasks=last");

      await app.goto("/submitter");
      await page.locator("[alt='Add Task']").click();
      await expect(formData).toHaveValue(
        /^tasks=first&tasks=second&tasks.x=\d+&tasks.y=\d+&tasks=last$/
      );

      await app.goto("/submitter");
      await page.locator("[alt='No Name']").click();
      await expect(formData).toHaveValue(
        /^tasks=first&tasks=second&x=\d+&y=\d+&tasks=last$/
      );

      await app.goto("/submitter");
      await page.locator("text=Outside").click();
      await expect(formData).toHaveValue(
        "tasks=outside&tasks=first&tasks=second&tasks=last"
      );
    });

    test("sends file names when submitting via url encoding", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      let myFile = fixture.projectDir + "/myfile.txt";

      const formData = page.locator("#formData");
      const submit = page.locator("button");

      await app.goto("/file-upload");
      await app.uploadFile(`[name=filey]`, myFile);
      await app.uploadFile(`[name=filey2]`, myFile, myFile);
      await submit.click();
      await expect(formData).toHaveValue(
        "filey=myfile.txt&filey2=myfile.txt&filey2=myfile.txt&filey3="
      );

      await app.goto("/file-upload?method=post");
      await app.uploadFile(`[name=filey]`, myFile);
      await app.uploadFile(`[name=filey2]`, myFile, myFile);
      await submit.click();

      await expect(formData).toHaveValue(
        "filey=myfile.txt&filey2=myfile.txt&filey2=myfile.txt&filey3="
      );
    });

    test("empty file inputs resolve to File objects on the server", async ({
      page,
      channel,
    }) => {
      // TODO: Look into this test failing on windows
      test.skip(channel === "msedge", "Fails on windows with undici");

      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/empty-file-upload");
      await app.clickSubmitButton("/empty-file-upload");
      await page.waitForSelector("#action-data");
      expect((await app.getElement("#action-data")).text()).toContain(
        '{"text":"","file":{"name":"","size":0},"fileMultiple":[{"name":"","size":0}]}'
      );
    });

    test("pathless layout routes are ignored in form actions", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/pathless-layout-parent/nested");

      await expect(
        page.getByText("Pathless Layout Parent", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("Pathless Layout", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("Pathless Layout Index", { exact: true })
      ).toBeVisible();

      const form = page.locator("form");
      await expect(form).toHaveAttribute("action", "/pathless-layout-parent");

      await expect(page.getByText("Submitted - No")).toBeVisible();
      // This submission should ignore the index route and the pathless layout
      // route above it and hit the action in routes/pathless-layout-parent.jsx
      await page.getByRole("button").click();
      await expect(page.getByText("Submitted - Yes")).toBeVisible();
    });
  }
});
