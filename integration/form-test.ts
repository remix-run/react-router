import {
  createAppFixture,
  createFixture,
  getElement,
  js
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("Forms", () => {
  let fixture: Fixture;
  let app: AppFixture;

  const KEYBOARD_INPUT = "KEYBOARD_INPUT";
  const CHECKBOX_BUTTON = "CHECKBOX_BUTTON";
  const ORPHAN_BUTTON = "ORPHAN_BUTTON";
  const FORM_WITH_ACTION_INPUT = "FORM_WITH_ACTION_INPUT";
  const FORM_WITH_ORPHAN = "FORM_WITH_ORPHAN";
  const LUNCH = "LUNCH";
  const CHEESESTEAK = "CHEESESTEAK";
  const LAKSA = "LAKSA";
  const SQUID_INK_HOTDOG = "SQUID_INK_HOTDOG";
  const ACTION = "action";
  const EAT = "EAT";

  const STATIC_ROUTE_ABSOLUTE_ACTION = "static-route-abs";
  const STATIC_ROUTE_CURRENT_ACTION = "static-route-cur";
  const STATIC_ROUTE_PARENT_ACTION = "static-route-parent";
  const STATIC_ROUTE_TOO_MANY_DOTS_ACTION = "static-route-too-many-dots";
  const INDEX_ROUTE_ABSOLUTE_ACTION = "index-route-abs";
  const INDEX_ROUTE_CURRENT_ACTION = "index-route-cur";
  const INDEX_ROUTE_PARENT_ACTION = "index-route-parent";
  const INDEX_ROUTE_TOO_MANY_DOTS_ACTION = "index-route-too-many-dots";
  const DYNAMIC_ROUTE_ABSOLUTE_ACTION = "dynamic-route-abs";
  const DYNAMIC_ROUTE_CURRENT_ACTION = "dynamic-route-cur";
  const DYNAMIC_ROUTE_PARENT_ACTION = "dynamic-route-parent";
  const DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION = "dynamic-route-too-many-dots";
  const LAYOUT_ROUTE_ABSOLUTE_ACTION = "layout-route-abs";
  const LAYOUT_ROUTE_CURRENT_ACTION = "layout-route-cur";
  const LAYOUT_ROUTE_PARENT_ACTION = "layout-route-parent";
  const LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION = "layout-route-too-many-dots";
  const SPLAT_ROUTE_ABSOLUTE_ACTION = "splat-route-abs";
  const SPLAT_ROUTE_CURRENT_ACTION = "splat-route-cur";
  const SPLAT_ROUTE_PARENT_ACTION = "splat-route-parent";
  const SPLAT_ROUTE_TOO_MANY_DOTS_ACTION = "splat-route-too-many-dots";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/get-submission.jsx": js`
          import { useLoaderData, Form } from "remix";

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
          import { Form } from "remix";
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
          import { Form, Outlet } from "remix";
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
          import { Form } from "remix";
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
          import { Form } from "remix";
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
          import { Form, Outlet } from "remix";
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
          import { Form } from "remix";
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
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("posts to a loader without JavaScript", async () => {
    let enableJavaScript = await app.disableJavaScript();
    await app.goto("/get-submission");
    await app.clickSubmitButton("/get-submission", { wait: false });
    await app.page.waitForNavigation();
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    await enableJavaScript();
  });

  it("posts to a loader", async () => {
    // this indirectly tests that clicking SVG children in buttons works
    await app.goto("/get-submission");
    await app.clickSubmitButton("/get-submission");
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
  });

  it("posts to a loader with an <input name='action' />", async () => {
    await app.goto("/get-submission");
    await app.clickElement(`#${FORM_WITH_ACTION_INPUT} button`);
    expect(await app.getHtml("pre")).toMatch(EAT);
  });

  it("posts to a loader with button data with click", async () => {
    await app.goto("/get-submission");
    await app.clickElement("#buttonWithValue");
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  it("posts to a loader with button data with keyboard", async () => {
    await app.goto("/get-submission");
    await app.waitForNetworkAfter(async () => {
      await app.page.focus(`#${KEYBOARD_INPUT}`);
      await app.page.keyboard.press("Enter");
    });
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  it("posts with the correct checkbox data", async () => {
    await app.goto("/get-submission");
    await app.clickElement(`#${CHECKBOX_BUTTON}`);
    expect(await app.getHtml("pre")).toMatchInlineSnapshot(
      `"<pre>LUNCH=CHEESESTEAK&amp;LUNCH=LAKSA</pre>"`
    );
  });

  it("posts button data from outside the form", async () => {
    await app.goto("/get-submission");
    await app.clickElement(`#${ORPHAN_BUTTON}`);
    expect(await app.getHtml("pre")).toMatch(SQUID_INK_HOTDOG);
  });

  describe("<Form> action", () => {
    describe("in a static route", () => {
      test("absolute action resolves relative to the root route", async () => {
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async () => {
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/inbox");
      });

      test("'..' action resolves relative to the parent route", async () => {
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async () => {
        await app.goto("/inbox");
        let html = await app.getHtml();
        let el = getElement(html, `#${STATIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    describe("in a dynamic route", () => {
      test("absolute action resolves relative to the root route", async () => {
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async () => {
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog/abc");
      });

      test("'..' action resolves relative to the parent route", async () => {
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async () => {
        await app.goto("/blog/abc");
        let html = await app.getHtml();
        let el = getElement(html, `#${DYNAMIC_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    describe("in an index route", () => {
      test("absolute action resolves relative to the root route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action resolves relative to the parent route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${INDEX_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    describe("in a layout route", () => {
      test("absolute action resolves relative to the root route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/blog");
      });

      test("'..' action resolves relative to the parent route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async () => {
        await app.goto("/blog");
        let html = await app.getHtml();
        let el = getElement(html, `#${LAYOUT_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });

    describe("in a splat route", () => {
      test("absolute action resolves relative to the root route", async () => {
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_ABSOLUTE_ACTION}`);
        expect(el.attr("action")).toMatch("/about");
      });

      test("'.' action resolves relative to the current route", async () => {
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_CURRENT_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("'..' action resolves relative to the parent route", async () => {
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_PARENT_ACTION}`);
        expect(el.attr("action")).toMatch("/projects");
      });

      test("'..' action with more .. segments than parent routes resolves relative to the root route", async () => {
        await app.goto("/projects/blarg");
        let html = await app.getHtml();
        let el = getElement(html, `#${SPLAT_ROUTE_TOO_MANY_DOTS_ACTION}`);
        expect(el.attr("action")).toMatch("/");
      });
    });
  });
});
