import { test, expect } from "@playwright/test";

import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { TemplateName } from "./helpers/vite.js";

const templateNames = [
  "vite-5-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

test.describe("redirects", () => {
  for (const templateName of templateNames) {
    test.describe(`template: ${templateName}`, () => {
      let fixture: Fixture;
      let appFixture: AppFixture;

      test.beforeAll(async () => {
        fixture = await createFixture({
          templateName,
          files: {
            "app/routes/absolute.tsx": js`
              import * as React from 'react';
              import { Outlet } from "react-router";

              export default function Component() {
                let [count, setCount] = React.useState(0);
                return (
                  <>
                    <button
                      id="increment"
                      onClick={() => setCount(count + 1)}>
                      {"Count:" + count}
                    </button>
                    <Outlet/>
                  </>
                );
              }
            `,

            "app/routes/absolute._index.tsx": js`
              import { redirect, Form } from "react-router";

              export async function action({ request }) {
                return redirect(new URL(request.url).origin + "/absolute/landing");
              };

              export default function Component() {
                return (
                  <Form method="post">
                    <button type="submit">Submit</button>
                  </Form>
                );
              }
            `,

            "app/routes/absolute.landing.tsx": js`
              export default function Component() {
                return <h1>Landing</h1>
              }
            `,

            "app/routes/absolute.content-length.tsx": js`
              import { redirect, Form } from "react-router";
              export async function action({ request }) {
                return redirect(new URL(request.url).origin + "/absolute/landing", {
                  headers: { 'Content-Length': '0' }
                });
              };
              export default function Component() {
                return (
                  <Form method="post">
                    <button type="submit">Submit</button>
                  </Form>
                );
              }
            `,

            "app/routes/loader.external.ts": js`
              import { redirect } from "react-router";
              export const loader = () => {
                return redirect("https://reactrouter.com/");
              }
            `,

            "app/routes/redirect-document.tsx": js`
              import * as React from "react";
              import { Outlet } from "react-router";

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
              import { Link } from "react-router";

              export default function Component() {
                return <Link to="/redirect-document/a">Link</Link>
              }
            `,

            "app/routes/redirect-document.a.tsx": js`
              import { redirectDocument } from "react-router";
              export const loader = () =>  redirectDocument("/redirect-document/b");
            `,

            "app/routes/redirect-document.b.tsx": js`
              export default function Component() {
                return <h1>Hello B!</h1>
              }
            `,

            "app/routes/replace.a.tsx": js`
              import { Link } from "react-router";
              export default function () {
                return <><h1 id="a">A</h1><Link to="/replace/b">Go to B</Link></>;
              }
            `,

            "app/routes/replace.b.tsx": js`
              import { Link } from "react-router";
              export default function () {
                return <><h1 id="b">B</h1><Link to="/replace/c">Go to C</Link></>
              }
            `,

            "app/routes/replace.c.tsx": js`
              import { replace } from "react-router";
              export const loader = () => replace("/replace/d");
              export default function () {
                return <h1 id="c">C</h1>
              }
            `,

            "app/routes/replace.d.tsx": js`
              export default function () {
                return <h1 id="d">D</h1>
              }
            `,

            "app/routes/headers.tsx": js`
              import * as React from 'react';
              import { Link, Form, redirect, useLocation } from 'react-router';

              export function action() {
                return redirect('/headers?action-redirect', {
                  headers: { 'X-Test': 'Foo' }
                })
              }

              export function loader({ request }) {
                let url = new URL(request.url);
                if (url.searchParams.has('redirect')) {
                  return redirect('/headers?loader-redirect', {
                    headers: { 'X-Test': 'Foo' }
                  })
                }
                return null
              }

              export default function Component() {
                let location = useLocation()
                return (
                  <>
                    <Link id="loader-redirect" to="/headers?redirect">Redirect</Link>
                    <Form method="post">
                      <button id="action-redirect" type="submit">Action Redirect</button>
                    </Form>
                    <p id="search-params">
                      Search Params: {location.search}
                    </p>
                  </>
                );
              }
            `,
          },
        });

        appFixture = await createAppFixture(fixture);
      });

      test.afterAll(() => {
        appFixture.close();
      });

      test("redirects to external URLs", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);

        await app.waitForNetworkAfter(() => app.goto("/loader/external"));
        expect(app.page.url()).toBe("https://reactrouter.com/");
      });

      test("redirects to absolute URLs in the app with a SPA navigation", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto(`/absolute`, true);
        await app.clickElement("#increment");
        expect(await app.getHtml("#increment")).toMatch("Count:1");
        await app.waitForNetworkAfter(() =>
          app.clickSubmitButton("/absolute?index"),
        );
        await page.waitForSelector(`h1:has-text("Landing")`);
        // No hard reload
        expect(await app.getHtml("#increment")).toMatch("Count:1");
      });

      test("redirects to absolute URLs in the app with a SPA navigation and Content-Length header", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto(`/absolute/content-length`, true);
        await app.clickElement("#increment");
        expect(await app.getHtml("#increment")).toMatch("Count:1");
        await app.waitForNetworkAfter(() =>
          app.clickSubmitButton("/absolute/content-length"),
        );
        await page.waitForSelector(`h1:has-text("Landing")`);
        // No hard reload
        expect(await app.getHtml("#increment")).toMatch("Count:1");
      });

      test("supports hard redirects within the app via reloadDocument", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/redirect-document", true);
        expect(await app.getHtml("button")).toMatch("Count:0");
        await app.clickElement("button");
        expect(await app.getHtml("button")).toMatch("Count:1");
        await app.waitForNetworkAfter(() =>
          app.clickLink("/redirect-document/a"),
        );
        await page.waitForSelector('h1:has-text("Hello B!")');
        // Hard reload resets client side react state
        expect(await app.getHtml("button")).toMatch("Count:0");
      });

      test("supports replace redirects within the app", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/replace/a", true);
        await page.waitForSelector("#a"); // [/a]
        await app.clickLink("/replace/b");
        await page.waitForSelector("#b"); // [/a, /b]
        await app.clickLink("/replace/c");
        await page.waitForSelector("#d"); // [/a, /d]
        await page.goBack();
        await page.waitForSelector("#a"); // [/a]
      });

      test("maintains custom headers on redirects", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);

        let hasGetHeader = false;
        let hasPostHeader = false;
        page.on("request", async (request) => {
          let extension = /^rsc/.test(templateName) ? "rsc" : "data";
          if (
            request.method() === "GET" &&
            request.url().endsWith(`headers.${extension}?redirect=`)
          ) {
            const headers = (await request.response())?.headers() || {};
            hasGetHeader = headers["x-test"] === "Foo";
          }
          if (
            request.method() === "POST" &&
            request.url().endsWith(`headers.${extension}`)
          ) {
            const headers = (await request.response())?.headers() || {};
            hasPostHeader = headers["x-test"] === "Foo";
          }
        });

        await app.goto("/headers", true);
        await app.clickElement("#loader-redirect");
        await expect(page.locator("#search-params")).toHaveText(
          "Search Params: ?loader-redirect",
        );
        expect(hasGetHeader).toBe(true);
        expect(hasPostHeader).toBe(false);

        hasGetHeader = false;
        hasPostHeader = false;

        await app.goto("/headers", true);
        await app.clickElement("#action-redirect");
        await expect(page.locator("#search-params")).toHaveText(
          "Search Params: ?action-redirect",
        );
        expect(hasGetHeader).toBe(false);
        expect(hasPostHeader).toBe(true);
      });
    });
  }
});
