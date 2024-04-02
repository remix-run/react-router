import { test, expect } from "@playwright/test";

import { ServerMode } from "../build/node_modules/@remix-run/server-runtime/dist/mode.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("loader in an app", async () => {
  let appFixture: AppFixture;
  let fixture: Fixture;
  let _consoleError: typeof console.error;

  let SVG_CONTENTS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#000" stroke-width="4" aria-label="Chicken"><path d="M48.1 34C22.1 32 1.4 51 2.5 67.2c1.2 16.1 19.8 17 29 17.8H89c15.7-6.6 6.3-18.9.3-20.5A28 28 0 0073 41.7c-.5-7.2 3.4-11.6 6.9-15.3 8.5 2.6 8-8 .8-7.2.6-6.5-12.3-5.9-6.7 2.7l-3.7 5c-6.9 5.4-10.9 5.1-22.2 7zM48.1 34c-38 31.9 29.8 58.4 25 7.7M70.3 26.9l5.4 4.2"/></svg>`;

  test.beforeAll(async () => {
    _consoleError = console.error;
    console.error = () => {};
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { Form, Link } from "@remix-run/react";

          export default () => (
            <>
              <Link to="/redirect">Redirect</Link>
              <Link to="/some-404-path">404 route</Link>
              <Form action="/redirect-to" method="post">
                <input name="destination" defaultValue="/redirect-destination" />
                <button type="submit">Redirect</button>
              </Form>
              <Form action="/no-action" method="post">
                <button type="submit">Submit to no action route</button>
              </Form>
            </>
          )
        `,
        "app/routes/redirected.tsx": js`
          export default () => <div data-testid="redirected">You were redirected</div>;
        `,
        "app/routes/redirect.tsx": js`
          import { redirect } from "@remix-run/node";

          export let loader = () => redirect("/redirected");
        `,
        "app/routes/redirect-to.tsx": js`
          import { redirect } from "@remix-run/node";

          export let action = async ({ request }) => {
            let formData = await request.formData();
            return redirect(formData.get('destination'));
          }
        `,
        "app/routes/redirect-destination.tsx": js`
          export default () => <div data-testid="redirect-destination">You made it!</div>
        `,
        "app/routes/defer.tsx": js`
          import { defer } from "@remix-run/node";

          export let loader = () => defer({ data: 'whatever' });
        `,
        "app/routes/data[.]json.tsx": js`
          import { json } from "@remix-run/node";
          export let loader = () => json({hello: "world"});
        `,
        "app/assets/icon.svg": SVG_CONTENTS,
        "app/routes/[manifest.webmanifest].tsx": js`
          import { json } from "@remix-run/node";
          import iconUrl from "~/assets/icon.svg";
          export  function loader() {
            return json(
              {
                icons: [
                  {
                    src: iconUrl,
                    sizes: '48x48 72x72 96x96 128x128 192x192 256x256 512x512',
                    type: 'image/svg+xml',
                  },
                ],
              },
            );
          }
        `,
        "app/routes/throw-error.tsx": js`
          export let loader = () => {
            throw new Error('Oh noes!')
          }
        `,
        "app/routes/return-response.tsx": js`
          export let loader = () => {
            return new Response('Partial', { status: 207 });
          }
        `,
        "app/routes/throw-response.tsx": js`
          export let loader = () => {
            throw new Response('Partial', { status: 207 });
          }
        `,
        "app/routes/return-object.tsx": js`
          export let loader = () => {
            return { hello: 'world' };
          }
        `,
        "app/routes/throw-object.tsx": js`
          export let loader = () => {
            throw { but: 'why' };
          }
        `,
        "app/routes/no-action.tsx": js`
          import { json } from "@remix-run/node";
          export let loader = () => {
            return json({ ok: true });
          }
        `,
        "app/routes/$.tsx": js`
          import { json } from "@remix-run/node";
          import { useRouteError } from "@remix-run/react";
          export function loader({ request }) {
            throw json({ message: new URL(request.url).pathname + ' not found' }, {
              status: 404
            });
          }
          export function ErrorBoundary() {
            let error = useRouteError();
            return <pre>{error.status + ' ' + error.data.message}</pre>;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture, ServerMode.Test);
  });

  test.afterAll(() => {
    appFixture.close();
    console.error = _consoleError;
  });

  test.describe("with JavaScript", () => {
    runTests();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests();
  });

  function runTests() {
    test("should redirect to redirected", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("a[href='/redirect']");
      await page.waitForSelector("[data-testid='redirected']");
    });

    test("should handle post to destination", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("button[type='submit']");
      await page.waitForSelector("[data-testid='redirect-destination']");
    });

    test("should handle reloadDocument to resource route", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/data.json");
      expect(await page.content()).toContain('{"hello":"world"}');
    });

    test("should handle errors thrown from resource routes", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      let res = await app.goto("/throw-error");
      expect(res.status()).toBe(500);
      expect(await res.text()).toEqual(
        "Unexpected Server Error\n\nError: Oh noes!"
      );
    });

    test("should let loader throw to it's own boundary without a default export", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await app.clickLink("/some-404-path");
      let html = await app.getHtml();
      expect(html).toMatch("404 /some-404-path not found");
    });
  }

  test("should handle responses returned from resource routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/return-response");
    expect(res.status()).toBe(207);
    expect(await res.text()).toEqual("Partial");
  });

  test("should handle responses thrown from resource routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/throw-response");
    expect(res.status()).toBe(207);
    expect(await res.text()).toEqual("Partial");
  });

  test("should handle objects returned from resource routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/return-object");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ hello: "world" });
  });

  test("should handle objects thrown from resource routes", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/throw-object");
    expect(res.status()).toBe(500);
    expect(await res.text()).toEqual(
      "Unexpected Server Error\n\n[object Object]"
    );
  });

  test("should handle ErrorResponses thrown from resource routes on document requests", async () => {
    let res = await fixture.postDocument("/no-action", new FormData());
    expect(res.status).toBe(405);
    expect(res.statusText).toBe("Method Not Allowed");
    expect(await res.text()).toBe('{"message":"Unexpected Server Error"}');
  });

  test("should handle ErrorResponses thrown from resource routes on client submissions", async ({
    page,
  }) => {
    let logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/no-action");
    let html = await app.getHtml();
    expect(html).toMatch("405 Method Not Allowed");
    expect(logs[0]).toContain(
      'Route "routes/no-action" does not have an action'
    );
  });

  test("should error if a defer is returned from a resource route", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/defer");
    expect(res.status()).toBe(500);
    expect(await res.text()).toMatch(
      "You cannot return a `defer()` response from a Resource Route.  " +
        'Did you forget to export a default UI component from the "routes/defer" route?'
    );
  });
});

test.describe("Development server", async () => {
  let appFixture: AppFixture;
  let fixture: Fixture;
  let _consoleError: typeof console.error;

  test.beforeAll(async () => {
    _consoleError = console.error;
    console.error = () => {};

    fixture = await createFixture(
      {
        files: {
          "app/routes/_index.tsx": js`
            import { Link } from "@remix-run/react";
            export default () => <Link to="/child">Child</Link>;
          `,
          "app/routes/_main.tsx": js`
            import { useRouteError } from "@remix-run/react";
            export function ErrorBoundary() {
              return <pre>{useRouteError().message}</pre>;
            }
          `,
          "app/routes/_main.child.tsx": js`
            export default function Component() {
              throw new Error('Error from render')
            }
          `,
        },
      },
      ServerMode.Development
    );
    appFixture = await createAppFixture(fixture, ServerMode.Development);
  });

  test.afterAll(() => {
    appFixture.close();
    console.error = _consoleError;
  });

  test.describe("with JavaScript", () => {
    runTests();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests();
  });

  function runTests() {
    test("should not treat an ErrorBoundary-only route as a resource route", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/child");
      let html = await app.getHtml();
      expect(html).not.toMatch("has no component");
      expect(html).toMatch("Error from render");
    });
  }
});
