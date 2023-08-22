import { test, expect } from "@playwright/test";

import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("redirects", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/action.tsx": js`
          import { Outlet, useLoaderData } from "@remix-run/react";

          if (typeof global.actionCount === "undefined") {
            global.actionCount = 0;
            global.actionRequests = new Set();
          }

          export async function loader({ request, context }) {
            let count = global.actionCount;
            if (!global.actionRequests.has(context)) {
              global.actionRequests.add(context);
              count = ++global.actionCount;
            }
            return { count };
          };

          export default function Parent() {
            let data = useLoaderData();
            return (
              <div id="app">
                <p id="count">{data.count}</p>
                <Outlet/>
              </div>
            );
          }
        `,

        "app/routes/action.form.tsx": js`
          import { redirect } from "@remix-run/node";
          import { Form } from "@remix-run/react";

          export async function action({ request }) {
            return redirect("/action/1");
          };

          export default function Login() {
            return (
              <Form method="post">
                <button type="submit">Submit</button>
              </Form>
            );
          }
        `,

        "app/routes/action.1.tsx": js`
          import { redirect } from "@remix-run/node";

          export async function loader({ request }) {
            return redirect("/action/2");
          };
        `,

        "app/routes/action.2.tsx": js`
          export default function () {
            return <h1>Page 2</h1>
          }
        `,

        "app/routes/action.absolute.tsx": js`
          import { redirect } from "@remix-run/node";
          import { Form } from "@remix-run/react";

          export async function action({ request }) {
            return redirect(new URL(request.url).origin + "/action/1");
          };

          export default function Login() {
            return (
              <Form method="post">
                <button type="submit">Submit</button>
              </Form>
            );
          }
        `,
        "app/session.server.ts": js`
          import { createCookie } from "@remix-run/node";
          export const session = createCookie("session");
        `,

        "app/routes/loader.tsx": js`
          import { Outlet, useLoaderData } from "@remix-run/react";
          import { session } from "~/session.server";

          if (typeof global.loaderCount === "undefined") {
            global.loaderCount = 0;
            global.loaderRequests = new Set();
          }

          export async function loader({ request, context }) {
            const cookieHeader = request.headers.get("Cookie");
            const { value } = (await session.parse(cookieHeader)) || {};
            let count = global.loaderCount;
            if (!global.loaderRequests.has(context)) {
              global.loaderRequests.add(context);
              count = ++global.loaderCount;
            }
            return { count, value };
          };

          export default function Parent() {
            let data = useLoaderData();
            return (
              <div id="app">
                <p id="count">{data.count}</p>
                {data.value ? <p>{data.value}</p> : null}
                <Outlet/>
              </div>
            );
          }
        `,

        "app/routes/loader.link.tsx": js`
          import { Link } from "@remix-run/react";
          export default function Parent() {
            return <Link to="/loader/redirect">Redirect</Link>;
          }
        `,

        "app/routes/loader.redirect.tsx": js`
            import { redirect } from "@remix-run/node";
            import { Form } from "@remix-run/react";
            import { session } from "~/session.server";

            export async function loader({ request }) {
              const cookieHeader = request.headers.get("Cookie");
              const cookie = (await session.parse(cookieHeader)) || {};
              cookie.value = 'cookie-value';
              return redirect("/loader/1", {
                headers: {
                  "Set-Cookie": await session.serialize(cookie),
                },
              });
            };
        `,

        "app/routes/loader.1.tsx": js`
          import { redirect } from "@remix-run/node";

          export async function loader({ request }) {
            return redirect("/loader/2");
          };
        `,

        "app/routes/loader.2.tsx": js`
          export default function () {
            return <h1>Page 2</h1>
          }
        `,
        "app/routes/loader.external.ts": js`
          import { redirect } from "@remix-run/node";
          export const loader = () => {
            return redirect("https://remix.run/");
          }
        `,

        "app/routes/redirect-document.tsx": js`
          import * as React from "react";
          import { Outlet } from "@remix-run/react";

          export default function Component() {
            let [count, setCount] = React.useState(0);
            let countText = 'Count:' + count;
            return (
              <>
                <button onClick={() => setCount(count+1)}>{countText}</button>
                <Outlet />
              </>
            );
          }
        `,

        "app/routes/redirect-document._index.tsx": js`
          import { Link } from "@remix-run/react";

          export default function Component() {
            return <Link to="/redirect-document/a">Link</Link>
          }
        `,

        "app/routes/redirect-document.a.tsx": js`
          import { redirectDocument } from "@remix-run/node";
          export const loader = () =>  redirectDocument("/redirect-document/b");
        `,

        "app/routes/redirect-document.b.tsx": js`
          export default function Component() {
            return <h1>Hello B!</h1>
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("preserves revalidation across action multi-redirects", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/action/form`);
    expect(await app.getHtml("#count")).toMatch("1");
    // Submitting this form will trigger an action -> redirect -> redirect
    // and we need to ensure that the parent loader is called on both redirects
    await app.waitForNetworkAfter(() =>
      app.clickElement('button[type="submit"]')
    );
    await page.waitForSelector(`#app:has-text("Page 2")`);
    await page.waitForSelector(`#count:has-text("3")`);
  });

  test("preserves revalidation across loader multi-redirects with cookies set", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/loader/link`);
    expect(await app.getHtml("#count")).toMatch("1");
    // Clicking this link will trigger a normalRedirect -> normalRedirect with
    // a cookie set on the first one, and we need to ensure that the parent
    // loader is called on both redirects
    await app.waitForNetworkAfter(() =>
      app.clickElement('a[href="/loader/redirect"]')
    );
    await page.waitForSelector(`#app:has-text("Page 2")`);
    await page.waitForSelector(`#app:has-text("cookie-value")`);
    // Loader called twice
    await page.waitForSelector(`#count:has-text("3")`);
  });

  test("redirects to external URLs", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.waitForNetworkAfter(() => app.goto("/loader/external"));
    expect(app.page.url()).toBe("https://remix.run/");
  });

  test("redirects to absolute URLs in the app", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/action/absolute`);
    expect(await app.getHtml("#count")).toMatch("1");
    await app.waitForNetworkAfter(() =>
      app.clickSubmitButton("/action/absolute")
    );
    await page.waitForSelector(`#app:has-text("Page 2")`);
    await page.waitForSelector(`#count:has-text("3")`);
  });

  test("supports hard redirects within the app via reloadDocument", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/redirect-document", true);
    expect(await app.getHtml("button")).toMatch("Count:0");
    await app.clickElement("button");
    expect(await app.getHtml("button")).toMatch("Count:1");
    await app.waitForNetworkAfter(() => app.clickLink("/redirect-document/a"));
    await page.waitForSelector(`h1`);
    // Hard reload resets client side react state
    expect(await app.getHtml("button")).toMatch("Count:0");
  });
});
