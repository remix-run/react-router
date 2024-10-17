import { test, expect } from "@playwright/test";
import { UNSAFE_ErrorResponseImpl as ErrorResponseImpl } from "react-router";

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
  let errorLogs: any[];

  test.beforeAll(async () => {
    _consoleError = console.error;
    console.error = (v) => errorLogs.push(v);

    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "react-router";

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
          import { Link, Form } from "react-router";

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
          export async function loader() {
            return { ok: true };
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
          export async function action() {
            return { ok: true };
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

  test("returns a 200 empty response on a data fetch to a path with no loaders", async () => {
    let { status, headers, data } = await fixture.requestSingleFetchData(
      "/_root.data"
    );
    expect(status).toBe(200);
    expect(headers.has("X-Remix-Error")).toBe(false);
    expect(data).toEqual({
      root: {
        data: null,
      },
      "routes/_index": {
        data: null,
      },
    });
  });

  test("returns a 405 on a data fetch POST to a path with no action", async () => {
    let { status, headers, data } = await fixture.requestSingleFetchData(
      "/_root.data?index",
      {
        method: "POST",
      }
    );
    expect(status).toBe(405);
    expect(headers.has("X-Remix-Error")).toBe(false);
    expect(data).toEqual({
      error: new ErrorResponseImpl(
        405,
        "Method Not Allowed",
        'Error: You made a POST request to "/" but did not provide an `action` for route "routes/_index", so there is no way to handle the request.'
      ),
    });
    assertLoggedErrorInstance(
      'You made a POST request to "/" but did not provide an `action` for route "routes/_index", so there is no way to handle the request.'
    );
  });

  test("returns a 405 on a data fetch with a bad method", async () => {
    try {
      await fixture.requestSingleFetchData("/loader-return-json.data", {
        method: "TRACE",
      });
      expect(false).toBe(true);
    } catch (e) {
      expect((e as Error).message).toMatch(
        "'TRACE' HTTP method is unsupported."
      );
    }
  });

  test("returns a 404 on a data fetch to a path with no matches", async () => {
    let { status, headers, data } = await fixture.requestSingleFetchData(
      "/i/match/nothing.data"
    );
    expect(status).toBe(404);
    expect(headers.has("X-Remix-Error")).toBe(false);
    expect(data).toEqual({
      root: {
        error: new ErrorResponseImpl(
          404,
          "Not Found",
          'Error: No route matches URL "/i/match/nothing"'
        ),
      },
    });
    assertLoggedErrorInstance('No route matches URL "/i/match/nothing"');
  });
});
