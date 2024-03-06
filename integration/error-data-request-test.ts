import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";

test.describe("ErrorBoundary", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;
  let _consoleError: any;
  let errorLogs: any[] = [];

  test.beforeAll(async () => {
    _consoleError = console.error;
    console.error = (v) => errorLogs.push(v);

    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

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

        "app/routes/_index.tsx": js`
          import { Link, Form } from "@remix-run/react";

          export default function () {
            return <h1>Index</h1>
          }
        `,

        [`app/routes/loader-throw-error.jsx`]: js`
          export async function loader() {
            throw Error("BLARGH");
          }

          export default function () {
              return <h1>Hello</h1>
          }
        `,

        [`app/routes/loader-return-json.jsx`]: js`
          import { json } from "@remix-run/server-runtime";

          export async function loader() {
            return json({ ok: true });
          }

          export default function () {
              return <h1>Hello</h1>
          }
        `,

        [`app/routes/action-throw-error.jsx`]: js`
          export async function action() {
            throw Error("YOOOOOOOO WHAT ARE YOU DOING");
          }

          export default function () {
            return <h1>Goodbye</h1>;
          }
        `,

        [`app/routes/action-return-json.jsx`]: js`
          import { json } from "@remix-run/server-runtime";

          export async function action() {
            return json({ ok: true });
          }

          export default function () {
            return <h1>Hi!</h1>
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.beforeEach(async () => {
    errorLogs = [];
  });

  test.afterAll(() => {
    console.error = _consoleError;
    appFixture.close();
  });

  function assertLoggedErrorInstance(message: string) {
    let error = errorLogs[0] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual(message);
  }

  test("returns a 400 x-remix-error on a data fetch to a path with no loader", async () => {
    let response = await fixture.requestData("/", "routes/_index");
    expect(response.status).toBe(400);
    expect(response.headers.get("X-Remix-Error")).toBe("yes");
    expect(await response.text()).toMatch("Unexpected Server Error");
    expect(errorLogs[0]).toBeInstanceOf(Error);
    assertLoggedErrorInstance(
      'You made a GET request to "/" but did not provide a `loader` for route "routes/_index", so there is no way to handle the request.'
    );
  });

  test("returns a 405 x-remix-error on a data fetch POST to a path with no action", async () => {
    let response = await fixture.requestData("/?index", "routes/_index", {
      method: "POST",
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("X-Remix-Error")).toBe("yes");
    expect(await response.text()).toMatch("Unexpected Server Error");
    assertLoggedErrorInstance(
      'You made a POST request to "/" but did not provide an `action` for route "routes/_index", so there is no way to handle the request.'
    );
  });

  test("returns a 405 x-remix-error on a data fetch with a bad method", async () => {
    expect(() =>
      fixture.requestData("/loader-return-json", "routes/loader-return-json", {
        method: "TRACE",
      })
    ).rejects.toThrowError(
      `Failed to construct 'Request': 'TRACE' HTTP method is unsupported.`
    );
  });

  test("returns a 403 x-remix-error on a data fetch GET to a bad path", async () => {
    // just headers content-type mismatch but differs from POST below
    let response = await fixture.requestData("/", "routes/loader-return-json");
    expect(response.status).toBe(403);
    expect(response.headers.get("X-Remix-Error")).toBe("yes");
    expect(await response.text()).toMatch("Unexpected Server Error");
    assertLoggedErrorInstance(
      'Route "routes/loader-return-json" does not match URL "/"'
    );
  });

  test("returns a 403 x-remix-error on a data fetch POST to a bad path", async () => {
    let response = await fixture.requestData("/", "routes/loader-return-json", {
      method: "POST",
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("X-Remix-Error")).toBe("yes");
    expect(await response.text()).toMatch("Unexpected Server Error");
    assertLoggedErrorInstance(
      'Route "routes/loader-return-json" does not match URL "/"'
    );
  });

  test("returns a 404 x-remix-error on a data fetch to a path with no matches", async () => {
    let response = await fixture.requestData("/i/match/nothing", "routes/junk");
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Remix-Error")).toBe("yes");
    expect(await response.text()).toMatch("Unexpected Server Error");
    assertLoggedErrorInstance('No route matches URL "/i/match/nothing"');
  });
});
