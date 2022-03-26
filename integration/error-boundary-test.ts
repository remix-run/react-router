import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("ErrorBoundary", () => {
  let fixture: Fixture;
  let app: AppFixture;
  let _consoleError: any;

  let ROOT_BOUNDARY_TEXT = "ROOT_BOUNDARY_TEXT";
  let OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT";

  let HAS_BOUNDARY_LOADER = "/yes/loader";
  let HAS_BOUNDARY_ACTION = "/yes/action";
  let HAS_BOUNDARY_RENDER = "/yes/render";

  let NO_BOUNDARY_ACTION = "/no/action";
  let NO_BOUNDARY_LOADER = "/no/loader";
  let NO_BOUNDARY_RENDER = "/no/render";

  let NOT_FOUND_HREF = "/not/found";

  // packages/remix-react/errorBoundaries.tsx
  let INTERNAL_ERROR_BOUNDARY_HEADING = "Application Error";

  beforeAll(async () => {
    _consoleError = console.error;
    console.error = () => {};
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Links, Meta, Outlet, Scripts } from "remix";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <main>
                    <Outlet />
                  </main>
                  <Scripts />
                </body>
              </html>
            );
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
        `,
      },
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

  describe("if no error boundary exists in the app", () => {
    let NO_ROOT_BOUNDARY_LOADER = "/loader-bad";
    let NO_ROOT_BOUNDARY_ACTION = "/action-bad";
    let NO_ROOT_BOUNDARY_ACTION_RETURN = "/action-no-return";

    beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "app/root.jsx": js`
            import { Links, Meta, Outlet, Scripts } from "remix";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
          `,

          "app/routes/index.jsx": js`
            import { Link, Form } from "remix";

            export default function () {
              return (
                <div>
                  <h1>Home</h1>
                  <Form method="post">
                    <button formAction="${NO_ROOT_BOUNDARY_ACTION}" type="submit">
                      Action go boom
                    </button>
                    <button formAction="${NO_ROOT_BOUNDARY_ACTION_RETURN}" type="submit">
                      Action no return
                    </button>
                  </Form>
                </div>
              )
            }
          `,

          [`app/routes${NO_ROOT_BOUNDARY_LOADER}.jsx`]: js`
            import { Link, Form } from "remix";

            export async function loader() {
              throw Error("BLARGH");
            }

            export default function () {
              return (
                <div>
                  <h1>Hello</h1>
                </div>
              )
            }
          `,

          [`app/routes${NO_ROOT_BOUNDARY_ACTION}.jsx`]: js`
            import { Link, Form } from "remix";

            export async function action() {
              throw Error("YOOOOOOOO WHAT ARE YOU DOING");
            }

            export default function () {
              return (
                <div>
                  <h1>Goodbye</h1>
                </div>
              )
            }
          `,

          [`app/routes${NO_ROOT_BOUNDARY_ACTION_RETURN}.jsx`]: js`
            import { Link, Form, useActionData } from "remix";

            export async function action() {}

            export default function () {
              let data = useActionData();
              return (
                <div>
                  <h1>{data}</h1>
                </div>
              )
            }
          `,
        },
      });
      app = await createAppFixture(fixture);
    });

    it("bubbles to internal boundary in loader document requests", async () => {
      await app.goto(NO_ROOT_BOUNDARY_LOADER);
      expect(await app.getHtml("h1")).toMatch(INTERNAL_ERROR_BOUNDARY_HEADING);
    });

    it("bubbles to internal boundary in action script transitions from other routes", async () => {
      await app.goto("/");
      await app.clickSubmitButton(NO_ROOT_BOUNDARY_ACTION);
      expect(await app.getHtml("h1")).toMatch(INTERNAL_ERROR_BOUNDARY_HEADING);
    });

    it("bubbles to internal boundary if action doesn't return", async () => {
      await app.goto("/");
      await app.clickSubmitButton(NO_ROOT_BOUNDARY_ACTION_RETURN);
      expect(await app.getHtml("h1")).toMatch(INTERNAL_ERROR_BOUNDARY_HEADING);
    });
  });
});
