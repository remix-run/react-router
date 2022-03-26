import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("CatchBoundary", () => {
  let fixture: Fixture;
  let app: AppFixture;

  let ROOT_BOUNDARY_TEXT = "ROOT_TEXT";
  let OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT";

  let HAS_BOUNDARY_LOADER = "/yes/loader";
  let HAS_BOUNDARY_ACTION = "/yes/action";
  let HAS_BOUNDARY_NO_LOADER_OR_ACTION = "/yes/no-loader-or-action";
  let NO_BOUNDARY_ACTION = "/no/action";
  let NO_BOUNDARY_LOADER = "/no/loader";
  let NO_BOUNDARY_NO_LOADER_OR_ACTION = "/no/no-loader-or-action";

  let NOT_FOUND_HREF = "/not/found";

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

        "app/routes/index.jsx": js`
          import { Link, Form } from "remix";
          export default function() {
            return (
              <div>
                <Link to="${NOT_FOUND_HREF}">${NOT_FOUND_HREF}</Link>

                <Form method="post">
                  <button formAction="${HAS_BOUNDARY_ACTION}" type="submit" />
                  <button formAction="${NO_BOUNDARY_ACTION}" type="submit" />
                  <button formAction="${HAS_BOUNDARY_NO_LOADER_OR_ACTION}" type="submit" />
                  <button formAction="${NO_BOUNDARY_NO_LOADER_OR_ACTION}" type="submit" />
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

        "app/routes/fetcher-boundary.jsx": js`
          import { useFetcher } from "remix";
          export function CatchBoundary() {
            return <p>${OWN_BOUNDARY_TEXT}</p>
          }
          export default function() {
            let fetcher = useFetcher();

            return (
              <div>
                <fetcher.Form method="post">
                  <button formAction="${NO_BOUNDARY_NO_LOADER_OR_ACTION}" type="submit" />
                </fetcher.Form>
              </div>
            )
          }
        `,

        "app/routes/fetcher-no-boundary.jsx": js`
          import { useFetcher } from "remix";
          export default function() {
            let fetcher = useFetcher();

            return (
              <div>
                <fetcher.Form method="post">
                  <button formAction="${NO_BOUNDARY_NO_LOADER_OR_ACTION}" type="submit" />
                </fetcher.Form>
              </div>
            )
          }
        `,

        [`app/routes${HAS_BOUNDARY_ACTION}.jsx`]: js`
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

        [`app/routes${NO_BOUNDARY_ACTION}.jsx`]: js`
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

        [`app/routes${HAS_BOUNDARY_NO_LOADER_OR_ACTION}.jsx`]: js`
          export function CatchBoundary() {
            return <div>${OWN_BOUNDARY_TEXT}</div>
          }
          export default function Index() {
            return <div/>
          }
        `,

        [`app/routes${NO_BOUNDARY_NO_LOADER_OR_ACTION}.jsx`]: js`
          export default function Index() {
            return <div/>
          }
        `,

        [`app/routes${HAS_BOUNDARY_LOADER}.jsx`]: js`
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

        [`app/routes${NO_BOUNDARY_LOADER}.jsx`]: js`
          export function loader() {
            throw new Response("", { status: 401 })
          }
          export default function Index() {
            return <div/>
          }
        `,
      },
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
      method: "OPTIONS",
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

  test("own boundary, action, client transition from other route", async () => {
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

  it("renders root boundary in document POST without action requests", async () => {
    let res = await fixture.requestDocument(NO_BOUNDARY_NO_LOADER_OR_ACTION, {
      method: "post",
    });
    expect(res.status).toBe(405);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("renders root boundary in action script transitions without action from other routes", async () => {
    await app.goto("/");
    await app.clickSubmitButton(NO_BOUNDARY_NO_LOADER_OR_ACTION);
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  it("renders own boundary in document POST without action requests", async () => {
    let res = await fixture.requestDocument(HAS_BOUNDARY_NO_LOADER_OR_ACTION, {
      method: "post",
    });
    expect(res.status).toBe(405);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("renders own boundary in action script transitions without action from other routes", async () => {
    await app.goto("/");
    await app.clickSubmitButton(HAS_BOUNDARY_NO_LOADER_OR_ACTION);
    expect(await app.getHtml()).toMatch(OWN_BOUNDARY_TEXT);
  });

  it("renders own boundary in fetcher action submission without action from other routes", async () => {
    await app.goto("/fetcher-boundary");
    await app.clickSubmitButton(NO_BOUNDARY_NO_LOADER_OR_ACTION);
    expect(await app.getHtml()).toMatch(OWN_BOUNDARY_TEXT);
  });
  it("renders root boundary in fetcher action submission without action from other routes", async () => {
    await app.goto("/fetcher-no-boundary");
    await app.clickSubmitButton(NO_BOUNDARY_NO_LOADER_OR_ACTION);
    expect(await app.getHtml()).toMatch(ROOT_BOUNDARY_TEXT);
  });
});
