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
          import { redirect } from "react-router";
          import { Form } from "react-router";

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

        "app/routes/loader.external.ts": js`
          import { redirect } from "react-router";
          export const loader = () => {
            return redirect("https://remix.run/");
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
    expect(app.page.url()).toBe("https://remix.run/");
  });

  test("redirects to absolute URLs in the app with a SPA navigation", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/absolute`, true);
    await app.clickElement("#increment");
    expect(await app.getHtml("#increment")).toMatch("Count:1");
    await app.waitForNetworkAfter(() =>
      app.clickSubmitButton("/absolute?index")
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
    await app.waitForNetworkAfter(() => app.clickLink("/redirect-document/a"));
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
});
