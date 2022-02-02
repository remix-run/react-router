import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("ErrorBoundary", () => {
  let fixture: Fixture;
  let app: AppFixture;
  let _consoleError: any;

  const ROOT_BOUNDARY_TEXT = "ROOT_BOUNDARY_TEXT";
  const OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT";

  const HAS_BOUNDARY_LOADER = "/yes/loader";
  const HAS_BOUNDARY_ACTION = "/yes/action";
  const HAS_BOUNDARY_RENDER = "/yes/render";

  const NO_BOUNDARY_ACTION = "/no/action";
  const NO_BOUNDARY_LOADER = "/no/loader";
  const NO_BOUNDARY_RENDER = "/no/render";

  const NOT_FOUND_HREF = "/not/found";

  beforeAll(async () => {
    _consoleError = console.error;
    console.error = () => {};
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet, Scripts } from "remix";

          export default function () {
            return (
              <html>
                <head />
                <body>
                  <main>
                    <Outlet />
                  </main>
                  <Scripts />
                </body>
              </html>
            )
          }

          export function ErrorBoundary() {
            return (
              <html>
                <head />
                <body>
                  <main>
                    <div>${ROOT_BOUNDARY_TEXT}</div>
                  </main>
                  <Scripts />
                </body>
              </html>
            )
          }
        `,

        "app/routes/index.jsx": js`
          import { Link, Form } from "remix";
          export default function () {
            return (
              <div>
                <Link to="${NOT_FOUND_HREF}">${NOT_FOUND_HREF}</Link>

                <Form method="post">
                  <button formAction="${HAS_BOUNDARY_ACTION}" type="submit">
                    Own Boundary
                  </button>
                  <button formAction="${NO_BOUNDARY_ACTION}" type="submit">
                    No Boundary
                  </button>
                </Form>

                <Link to="${HAS_BOUNDARY_LOADER}">
                  ${HAS_BOUNDARY_LOADER}
                </Link>
                <Link to="${NO_BOUNDARY_LOADER}">
                  ${NO_BOUNDARY_LOADER}
                </Link>
                <Link to="${HAS_BOUNDARY_RENDER}">
                  ${HAS_BOUNDARY_RENDER}
                </Link>
                <Link to="${NO_BOUNDARY_RENDER}">
                  ${NO_BOUNDARY_RENDER}
                </Link>
              </div>
            )
          }
        `,

        [`app/routes${HAS_BOUNDARY_ACTION}.jsx`]: js`
          import { Form } from "remix";
          export async function action() {
            throw new Error("Kaboom!")
          }
          export function ErrorBoundary() {
            return <p>${OWN_BOUNDARY_TEXT}</p>
          }
          export default function () {
            return (
              <Form method="post">
                <button type="submit" formAction="${HAS_BOUNDARY_ACTION}">
                  Go
                </button>
              </Form>
            );
          }
        `,

        [`app/routes${NO_BOUNDARY_ACTION}.jsx`]: js`
          import { Form } from "remix";
          export function action() {
            throw new Error("Kaboom!")
          }
          export default function () {
            return (
              <Form method="post">
                <button type="submit" formAction="${NO_BOUNDARY_ACTION}">
                  Go
                </button>
              </Form>
            )
          }
        `,

        [`app/routes${HAS_BOUNDARY_LOADER}.jsx`]: js`
          export function loader() {
            throw new Error("Kaboom!")
          }
          export function ErrorBoundary() {
            return <div>${OWN_BOUNDARY_TEXT}</div>
          }
          export default function () {
            return <div/>
          }
        `,

        [`app/routes${NO_BOUNDARY_LOADER}.jsx`]: js`
          export function loader() {
            throw new Error("Kaboom!")
          }
          export default function () {
            return <div/>
          }
        `,

        [`app/routes${NO_BOUNDARY_RENDER}.jsx`]: js`
          export default function () {
            throw new Error("Kaboom!")
            return <div/>
          }
        `,

        [`app/routes${HAS_BOUNDARY_RENDER}.jsx`]: js`
          export default function () {
            throw new Error("Kaboom!")
            return <div/>
          }

          export function ErrorBoundary() {
            return <div>${OWN_BOUNDARY_TEXT}</div>
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    console.error = _consoleError;
    await app.close();
  });

  test("own boundary, action, document request", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(HAS_BOUNDARY_ACTION, params);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  // FIXME: this is broken, it renders the root boundary logging in `RemixRoute`
  // it's because the route module hasn't been loaded, my gut tells me that we
  // didn't load the route module but tried to render it's boundary, we need the
  // module for that!  this will probably fix the twin test over in
  // catch-boundary-test
  test.skip("own boundary, action, client transition from other route", async () => {
    await app.goto("/");
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    expect(await app.getHtml("main")).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, action, client transition from itself", async () => {
    await app.goto(HAS_BOUNDARY_ACTION);
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    expect(await app.getHtml("main")).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action document requests", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(NO_BOUNDARY_ACTION, params);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from other routes", async () => {
    await app.goto("/");
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    expect(await app.getHtml("main")).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from self", async () => {
    await app.goto(NO_BOUNDARY_ACTION);
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    expect(await app.getHtml("main")).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("own boundary, loader, document request", async () => {
    let res = await fixture.requestDocument(HAS_BOUNDARY_LOADER);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, loader, client transition", async () => {
    await app.goto("/");
    await app.clickLink(HAS_BOUNDARY_LOADER);
    expect(await app.getHtml("main")).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("bubbles to parent in loader document requests", async () => {
    let res = await fixture.requestDocument(NO_BOUNDARY_LOADER);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from other routes", async () => {
    await app.goto("/");
    await app.clickLink(NO_BOUNDARY_LOADER);
    expect(await app.getHtml("main")).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("ssr rendering errors with no boundary", async () => {
    let res = await fixture.requestDocument(NO_BOUNDARY_RENDER);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("script transition rendering errors with no boundary", async () => {
    await app.goto("/");
    await app.clickLink(NO_BOUNDARY_RENDER);
    expect(await app.getHtml("main")).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("ssr rendering errors with boundary", async () => {
    let res = await fixture.requestDocument(HAS_BOUNDARY_RENDER);
    expect(res.status).toBe(500);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("script transition rendering errors with boundary", async () => {
    await app.goto("/");
    await app.clickLink(HAS_BOUNDARY_RENDER);
    expect(await app.getHtml("main")).toMatch(OWN_BOUNDARY_TEXT);
  });
});
