import { createAppFixture, createFixture } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("CatchBoundary", () => {
  let fixture: Fixture;
  let app: AppFixture;

  const ROOT_BOUNDARY_TEXT = "ROOT_TEXT";
  const OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT";

  const HAS_BOUNDARY_LOADER = "/yes/loader";
  const HAS_BOUNDARY_ACTION = "/yes/action";
  const NO_BOUNDARY_ACTION = "/no/action";
  const NO_BOUNDARY_LOADER = "/no/loader";

  const NOT_FOUND_HREF = "/not/found";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": `
          import { Outlet, Scripts } from "remix";
          export default function Root() {
            return (
              <html>
                <head />
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            )
          }
          export function CatchBoundary() {
            return (
              <html>
                <head />
                <body>
                  <div>${ROOT_BOUNDARY_TEXT}</div>
                  <Scripts />
                </body>
              </html>
            )
          }
        `,

        "app/routes/index.jsx": `
          import { Link, Form } from "remix";
          export default function() {
            return (
              <div>
                <Link to="${NOT_FOUND_HREF}">${NOT_FOUND_HREF}</Link>

                <Form method="post">
                  <button formAction="${HAS_BOUNDARY_ACTION}" type="submit" />
                  <button formAction="${NO_BOUNDARY_ACTION}" type="submit" />
                </Form>

                <Link to="${HAS_BOUNDARY_LOADER}">
                  ${HAS_BOUNDARY_LOADER}
                </Link>
                <Link to="${NO_BOUNDARY_LOADER}">
                  ${NO_BOUNDARY_LOADER}
                </Link>
              </div>
            )
          }
        `,

        [`app/routes${HAS_BOUNDARY_ACTION}.jsx`]: `
          import { Form } from "remix";
          export async function action() {
            throw new Response("", { status: 401 })
          }
          export function CatchBoundary() {
            return <p>${OWN_BOUNDARY_TEXT}</p>
          }
          export default function Index() {
            return (
              <Form method="post">
                <button type="submit" formAction="${HAS_BOUNDARY_ACTION}">
                  Go
                </button>
              </Form>
            );
          }
        `,

        [`app/routes${NO_BOUNDARY_ACTION}.jsx`]: `
          import { Form } from "remix";
          export function action() {
            throw new Response("", { status: 401 })
          }
          export default function Index() {
            return (
              <Form method="post">
                <button type="submit" formAction="${NO_BOUNDARY_ACTION}">
                  Go
                </button>
              </Form>
            )
          }
        `,

        [`app/routes${HAS_BOUNDARY_LOADER}.jsx`]: `
          export function loader() {
            throw new Response("", { status: 401 })
          }
          export function CatchBoundary() {
            return <div>${OWN_BOUNDARY_TEXT}</div>
          }
          export default function Index() {
            return <div/>
          }
        `,

        [`app/routes${NO_BOUNDARY_LOADER}.jsx`]: `
          export function loader() {
            throw new Response("", { status: 401 })
          }
          export default function Index() {
            return <div/>
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  test("non-matching urls on document requests", async () => {
    let res = await fixture.requestDocument(NOT_FOUND_HREF);
    expect(res.status).toBe(404);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("non-matching urls on client transitions", async () => {
    await app.goto("/");
    await app.clickLink(NOT_FOUND_HREF, { wait: false });
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("invalid request methods", async () => {
    let res = await fixture.requestDocument("/", {
      method: "OPTIONS"
    });
    expect(res.status).toBe(405);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("own boundary, action, document request", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(HAS_BOUNDARY_ACTION, params);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  // FIXME: this is broken, the request returns but the page doesn't update
  test.skip("own boundary, action, client transition from other route", async () => {
    await app.goto("/");
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    expect(await app.getHtml()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, action, client transition from itself", async () => {
    await app.goto(HAS_BOUNDARY_ACTION);
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    expect(await app.getHtml()).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action document requests", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(NO_BOUNDARY_ACTION, params);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from other routes", async () => {
    await app.goto("/");
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from self", async () => {
    await app.goto(NO_BOUNDARY_ACTION);
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("own boundary, loader, document request", async () => {
    let res = await fixture.requestDocument(HAS_BOUNDARY_LOADER);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, loader, client transition", async () => {
    await app.goto("/");
    await app.clickLink(HAS_BOUNDARY_LOADER);
    expect(await app.getHtml()).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("bubbles to parent in loader document requests", async () => {
    let res = await fixture.requestDocument(NO_BOUNDARY_LOADER);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("bubbles to parent in action script transitions from other routes", async () => {
    await app.goto("/");
    await app.clickLink(NO_BOUNDARY_LOADER);
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });
});
