import { test, expect } from "@playwright/test";

import { createFixture, createAppFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("redirects", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      config: {
        future: { v2_routeConvention: true },
      },
      files: {
        "app/routes/action.jsx": js`
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

        "app/routes/action.form.jsx": js`
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

        "app/routes/action.1.jsx": js`
          import { redirect } from "@remix-run/node";

          export async function loader({ request }) {
            return redirect("/action/2");
          };
        `,

        "app/routes/action.2.jsx": js`
          export default function () {
            return <h1>Page 2</h1>
          }
        `,

        "app/routes/action.absolute.jsx": js`
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
        "app/session.server.js": js`
          import { createCookie } from "@remix-run/node";
          export const session = createCookie("session");
        `,

        "app/routes/loader.jsx": js`
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

        "app/routes/loader.link.jsx": js`
          import { Link } from "@remix-run/react";
          export default function Parent() {
            return <Link to="/loader/redirect">Redirect</Link>;
          }
        `,

        "app/routes/loader.redirect.jsx": js`
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

        "app/routes/loader.1.jsx": js`
          import { redirect } from "@remix-run/node";

          export async function loader({ request }) {
            return redirect("/loader/2");
          };
        `,

        "app/routes/loader.2.jsx": js`
          export default function () {
            return <h1>Page 2</h1>
          }
        `,
        "app/routes/loader.external.js": js`
          import { redirect } from "@remix-run/node";
          export const loader = () => {
            return redirect("https://remix.run/");
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
});
