import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("ErrorBoundary (thrown responses)", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let ROOT_BOUNDARY_TEXT = "ROOT_TEXT" as const;
  let OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT" as const;

  let HAS_BOUNDARY_LOADER = "/yes/loader" as const;
  let HAS_BOUNDARY_LOADER_FILE = "/yes.loader" as const;
  let HAS_BOUNDARY_ACTION = "/yes/action" as const;
  let HAS_BOUNDARY_ACTION_FILE = "/yes.action" as const;
  let NO_BOUNDARY_ACTION = "/no/action" as const;
  let NO_BOUNDARY_ACTION_FILE = "/no.action" as const;
  let NO_BOUNDARY_LOADER = "/no/loader" as const;
  let NO_BOUNDARY_LOADER_FILE = "/no.loader" as const;

  let NOT_FOUND_HREF = "/not/found";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
            import { json } from "@remix-run/node";
            import { Links, Meta, Outlet, Scripts, useMatches } from "@remix-run/react";

            export function loader() {
              return json({ data: "ROOT LOADER" });
            }

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

            export function ErrorBoundary() {
              let matches = useMatches()
              return (
                <html>
                  <head />
                  <body>
                    <div id="root-boundary">${ROOT_BOUNDARY_TEXT}</div>
                    <pre id="matches">{JSON.stringify(matches)}</pre>
                    <Scripts />
                  </body>
                </html>
              )
            }
          `,

        "app/routes/_index.tsx": js`
            import { Link, Form } from "@remix-run/react";
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
                  <Link to="${HAS_BOUNDARY_LOADER}/child">
                    ${HAS_BOUNDARY_LOADER}/child
                  </Link>
                  <Link to="${NO_BOUNDARY_LOADER}">
                    ${NO_BOUNDARY_LOADER}
                  </Link>
                </div>
              )
            }
          `,

        [`app/routes${HAS_BOUNDARY_ACTION_FILE}.jsx`]: js`
            import { Form } from "@remix-run/react";
            export async function action() {
              throw new Response("", { status: 401 })
            }
            export function ErrorBoundary() {
              return <p id="action-boundary">${OWN_BOUNDARY_TEXT}</p>
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

        [`app/routes${NO_BOUNDARY_ACTION_FILE}.jsx`]: js`
            import { Form } from "@remix-run/react";
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

        [`app/routes${HAS_BOUNDARY_LOADER_FILE}.jsx`]: js`
            import { useRouteError } from '@remix-run/react';
            export function loader() {
              throw new Response("", { status: 401 })
            }
            export function ErrorBoundary() {
              let error = useRouteError();
              return (
                <>
                  <div id="boundary-loader">${OWN_BOUNDARY_TEXT}</div>
                  <pre id="status">{error.status}</pre>
                </>
              );
            }
            export default function Index() {
              return <div/>
            }
          `,

        [`app/routes${HAS_BOUNDARY_LOADER_FILE}.child.jsx`]: js`
            export function loader() {
              throw new Response("", { status: 404 })
            }
            export default function Index() {
              return <div/>
            }
          `,

        [`app/routes${NO_BOUNDARY_LOADER_FILE}.jsx`]: js`
            export function loader() {
              throw new Response("", { status: 401 })
            }
            export default function Index() {
              return <div/>
            }
          `,

        "app/routes/action.tsx": js`
            import { Outlet, useLoaderData } from "@remix-run/react";

            export function loader() {
              return "PARENT";
            }

            export default function () {
              return (
                <div>
                  <p id="parent-data">{useLoaderData()}</p>
                  <Outlet />
                </div>
              )
            }
          `,

        "app/routes/action.child-catch.tsx": js`
            import { Form, useLoaderData, useRouteError } from "@remix-run/react";

            export function loader() {
              return "CHILD";
            }

            export function action() {
              throw new Response("Caught!", { status: 400 });
            }

            export default function () {
              return (
                <>
                  <p id="child-data">{useLoaderData()}</p>
                  <Form method="post" reloadDocument={true}>
                    <button type="submit" name="key" value="value">
                      Submit
                    </button>
                  </Form>
                </>
              )
            }

            export function ErrorBoundary() {
              let error = useRouteError()
              return <p id="child-catch">{error.status} {error.data}</p>;
            }
          `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("non-matching urls on document requests", async () => {
    let oldConsoleError;
    oldConsoleError = console.error;
    console.error = () => {};

    let res = await fixture.requestDocument(NOT_FOUND_HREF);
    expect(res.status).toBe(404);
    let html = await res.text();
    expect(html).toMatch(ROOT_BOUNDARY_TEXT);

    // There should be no loader data on the root route
    let expected = JSON.stringify([
      { id: "root", pathname: "", params: {} },
    ]).replace(/"/g, "&quot;");
    expect(html).toContain(`<pre id="matches">${expected}</pre>`);

    console.error = oldConsoleError;
  });

  test("non-matching urls on client transitions", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink(NOT_FOUND_HREF, { wait: false });
    await page.waitForSelector("#root-boundary");

    // Root loader data sticks around from previous load
    let expected = JSON.stringify([
      { id: "root", pathname: "", params: {}, data: { data: "ROOT LOADER" } },
    ]);
    expect(await app.getHtml("#matches")).toContain(expected);
  });

  test("own boundary, action, document request", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(HAS_BOUNDARY_ACTION, params);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, action, client transition from other route", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    await page.waitForSelector("#action-boundary");
  });

  test("own boundary, action, client transition from itself", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(HAS_BOUNDARY_ACTION);
    await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
    await page.waitForSelector("#action-boundary");
  });

  test("bubbles to parent in action document requests", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(NO_BOUNDARY_ACTION, params);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("bubbles to parent in action script transitions from other routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    await page.waitForSelector("#root-boundary");
  });

  test("bubbles to parent in action script transitions from self", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(NO_BOUNDARY_ACTION);
    await app.clickSubmitButton(NO_BOUNDARY_ACTION);
    await page.waitForSelector("#root-boundary");
  });

  test("own boundary, loader, document request", async () => {
    let res = await fixture.requestDocument(HAS_BOUNDARY_LOADER);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
  });

  test("own boundary, loader, client transition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink(HAS_BOUNDARY_LOADER);
    await page.waitForSelector("#boundary-loader");
  });

  test("bubbles to parent in loader document requests", async () => {
    let res = await fixture.requestDocument(NO_BOUNDARY_LOADER);
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
  });

  test("bubbles to parent in loader transitions from other routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink(NO_BOUNDARY_LOADER);
    await page.waitForSelector("#root-boundary");
  });

  test("uses correct catch boundary on server action errors", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/action/child-catch`);
    expect(await app.getHtml("#parent-data")).toMatch("PARENT");
    expect(await app.getHtml("#child-data")).toMatch("CHILD");
    await page.click("button[type=submit]");
    await page.waitForSelector("#child-catch");
    // Preserves parent loader data
    expect(await app.getHtml("#parent-data")).toMatch("PARENT");
    expect(await app.getHtml("#child-catch")).toMatch("400");
    expect(await app.getHtml("#child-catch")).toMatch("Caught!");
  });

  test("prefers parent catch when child loader also bubbles, document request", async () => {
    let res = await fixture.requestDocument(`${HAS_BOUNDARY_LOADER}/child`);
    expect(res.status).toBe(401);
    let text = await res.text();
    expect(text).toMatch(OWN_BOUNDARY_TEXT);
    expect(text).toMatch('<pre id="status">401</pre>');
  });

  test("prefers parent catch when child loader also bubbles, client transition", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink(`${HAS_BOUNDARY_LOADER}/child`);
    await page.waitForSelector("#boundary-loader");
    expect(await app.getHtml("#boundary-loader")).toMatch(OWN_BOUNDARY_TEXT);
    expect(await app.getHtml("#status")).toMatch("401");
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.describe("ErrorBoundary (thrown responses)", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    let ROOT_BOUNDARY_TEXT = "ROOT_TEXT" as const;
    let OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT" as const;

    let HAS_BOUNDARY_LOADER = "/yes/loader" as const;
    let HAS_BOUNDARY_LOADER_FILE = "/yes.loader" as const;
    let HAS_BOUNDARY_ACTION = "/yes/action" as const;
    let HAS_BOUNDARY_ACTION_FILE = "/yes.action" as const;
    let NO_BOUNDARY_ACTION = "/no/action" as const;
    let NO_BOUNDARY_ACTION_FILE = "/no.action" as const;
    let NO_BOUNDARY_LOADER = "/no/loader" as const;
    let NO_BOUNDARY_LOADER_FILE = "/no.loader" as const;

    let NOT_FOUND_HREF = "/not/found";

    test.beforeAll(async () => {
      fixture = await createFixture({
        singleFetch: true,
        files: {
          "app/root.tsx": js`
              import { json } from "@remix-run/node";
              import { Links, Meta, Outlet, Scripts, useMatches } from "@remix-run/react";

              export function loader() {
                return json({ data: "ROOT LOADER" });
              }

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

              export function ErrorBoundary() {
                let matches = useMatches()
                return (
                  <html>
                    <head />
                    <body>
                      <div id="root-boundary">${ROOT_BOUNDARY_TEXT}</div>
                      <pre id="matches">{JSON.stringify(matches)}</pre>
                      <Scripts />
                    </body>
                  </html>
                )
              }
            `,

          "app/routes/_index.tsx": js`
              import { Link, Form } from "@remix-run/react";
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
                    <Link to="${HAS_BOUNDARY_LOADER}/child">
                      ${HAS_BOUNDARY_LOADER}/child
                    </Link>
                    <Link to="${NO_BOUNDARY_LOADER}">
                      ${NO_BOUNDARY_LOADER}
                    </Link>
                  </div>
                )
              }
            `,

          [`app/routes${HAS_BOUNDARY_ACTION_FILE}.jsx`]: js`
              import { Form } from "@remix-run/react";
              export async function action() {
                throw new Response("", { status: 401 })
              }
              export function ErrorBoundary() {
                return <p id="action-boundary">${OWN_BOUNDARY_TEXT}</p>
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

          [`app/routes${NO_BOUNDARY_ACTION_FILE}.jsx`]: js`
              import { Form } from "@remix-run/react";
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

          [`app/routes${HAS_BOUNDARY_LOADER_FILE}.jsx`]: js`
              import { useRouteError } from '@remix-run/react';
              export function loader() {
                throw new Response("", { status: 401 })
              }
              export function ErrorBoundary() {
                let error = useRouteError();
                return (
                  <>
                    <div id="boundary-loader">${OWN_BOUNDARY_TEXT}</div>
                    <pre id="status">{error.status}</pre>
                  </>
                );
              }
              export default function Index() {
                return <div/>
              }
            `,

          [`app/routes${HAS_BOUNDARY_LOADER_FILE}.child.jsx`]: js`
              export function loader() {
                throw new Response("", { status: 404 })
              }
              export default function Index() {
                return <div/>
              }
            `,

          [`app/routes${NO_BOUNDARY_LOADER_FILE}.jsx`]: js`
              export function loader() {
                throw new Response("", { status: 401 })
              }
              export default function Index() {
                return <div/>
              }
            `,

          "app/routes/action.tsx": js`
              import { Outlet, useLoaderData } from "@remix-run/react";

              export function loader() {
                return "PARENT";
              }

              export default function () {
                return (
                  <div>
                    <p id="parent-data">{useLoaderData()}</p>
                    <Outlet />
                  </div>
                )
              }
            `,

          "app/routes/action.child-catch.tsx": js`
              import { Form, useLoaderData, useRouteError } from "@remix-run/react";

              export function loader() {
                return "CHILD";
              }

              export function action() {
                throw new Response("Caught!", { status: 400 });
              }

              export default function () {
                return (
                  <>
                    <p id="child-data">{useLoaderData()}</p>
                    <Form method="post" reloadDocument={true}>
                      <button type="submit" name="key" value="value">
                        Submit
                      </button>
                    </Form>
                  </>
                )
              }

              export function ErrorBoundary() {
                let error = useRouteError()
                return <p id="child-catch">{error.status} {error.data}</p>;
              }
            `,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
    });

    test("non-matching urls on document requests", async () => {
      let oldConsoleError;
      oldConsoleError = console.error;
      console.error = () => {};

      let res = await fixture.requestDocument(NOT_FOUND_HREF);
      expect(res.status).toBe(404);
      let html = await res.text();
      expect(html).toMatch(ROOT_BOUNDARY_TEXT);

      // There should be no loader data on the root route
      let expected = JSON.stringify([
        { id: "root", pathname: "", params: {} },
      ]).replace(/"/g, "&quot;");
      expect(html).toContain(`<pre id="matches">${expected}</pre>`);

      console.error = oldConsoleError;
    });

    test("non-matching urls on client transitions", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink(NOT_FOUND_HREF, { wait: false });
      await page.waitForSelector("#root-boundary");

      // Root loader data sticks around from previous load
      let expected = JSON.stringify([
        { id: "root", pathname: "", params: {}, data: { data: "ROOT LOADER" } },
      ]);
      expect(await app.getHtml("#matches")).toContain(expected);
    });

    test("own boundary, action, document request", async () => {
      let params = new URLSearchParams();
      let res = await fixture.postDocument(HAS_BOUNDARY_ACTION, params);
      expect(res.status).toBe(401);
      expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
    });

    test("own boundary, action, client transition from other route", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
      await page.waitForSelector("#action-boundary");
    });

    test("own boundary, action, client transition from itself", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto(HAS_BOUNDARY_ACTION);
      await app.clickSubmitButton(HAS_BOUNDARY_ACTION);
      await page.waitForSelector("#action-boundary");
    });

    test("bubbles to parent in action document requests", async () => {
      let params = new URLSearchParams();
      let res = await fixture.postDocument(NO_BOUNDARY_ACTION, params);
      expect(res.status).toBe(401);
      expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
    });

    test("bubbles to parent in action script transitions from other routes", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickSubmitButton(NO_BOUNDARY_ACTION);
      await page.waitForSelector("#root-boundary");
    });

    test("bubbles to parent in action script transitions from self", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto(NO_BOUNDARY_ACTION);
      await app.clickSubmitButton(NO_BOUNDARY_ACTION);
      await page.waitForSelector("#root-boundary");
    });

    test("own boundary, loader, document request", async () => {
      let res = await fixture.requestDocument(HAS_BOUNDARY_LOADER);
      expect(res.status).toBe(401);
      expect(await res.text()).toMatch(OWN_BOUNDARY_TEXT);
    });

    test("own boundary, loader, client transition", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink(HAS_BOUNDARY_LOADER);
      await page.waitForSelector("#boundary-loader");
    });

    test("bubbles to parent in loader document requests", async () => {
      let res = await fixture.requestDocument(NO_BOUNDARY_LOADER);
      expect(res.status).toBe(401);
      expect(await res.text()).toMatch(ROOT_BOUNDARY_TEXT);
    });

    test("bubbles to parent in loader transitions from other routes", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink(NO_BOUNDARY_LOADER);
      await page.waitForSelector("#root-boundary");
    });

    test("uses correct catch boundary on server action errors", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto(`/action/child-catch`);
      expect(await app.getHtml("#parent-data")).toMatch("PARENT");
      expect(await app.getHtml("#child-data")).toMatch("CHILD");
      await page.click("button[type=submit]");
      await page.waitForSelector("#child-catch");
      // Preserves parent loader data
      expect(await app.getHtml("#parent-data")).toMatch("PARENT");
      expect(await app.getHtml("#child-catch")).toMatch("400");
      expect(await app.getHtml("#child-catch")).toMatch("Caught!");
    });

    test("prefers parent catch when child loader also bubbles, document request", async () => {
      let res = await fixture.requestDocument(`${HAS_BOUNDARY_LOADER}/child`);
      expect(res.status).toBe(401);
      let text = await res.text();
      expect(text).toMatch(OWN_BOUNDARY_TEXT);
      expect(text).toMatch('<pre id="status">401</pre>');
    });

    test("prefers parent catch when child loader also bubbles, client transition", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink(`${HAS_BOUNDARY_LOADER}/child`);
      await page.waitForSelector("#boundary-loader");
      expect(await app.getHtml("#boundary-loader")).toMatch(OWN_BOUNDARY_TEXT);
      expect(await app.getHtml("#status")).toMatch("401");
    });
  });
});
