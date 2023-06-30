import { test, expect } from "@playwright/test";
import { ServerMode } from "@remix-run/server-runtime/mode";

import type { Fixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

const routeFiles = {
  "app/root.jsx": js`
    import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <main>
              <Outlet />
            </main>
            <Scripts />
          </body>
        </html>
      );
    }
  `,

  "app/routes/index.jsx": js`
    import { useLoaderData, useLocation, useRouteError } from "@remix-run/react";

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has('loader')) {
        throw new Error("Loader Error");
      }
      if (new URL(request.url).searchParams.has('subclass')) {
        // This will throw a ReferenceError
        console.log(thisisnotathing);
      }
      return "LOADER"
    }

    export default function Component() {
      let data = useLoaderData();
      let location = useLocation();

      if (location.search.includes('render')) {
        throw new Error("Render Error");
      }

      return (
        <>
          <h1>Index Route</h1>
          <p>{JSON.stringify(data)}</p>
        </>
      );
    }

    export function ErrorBoundary() {
      let error = useRouteError();
      return (
        <>
          <h1>Index Error</h1>
          <p>{"MESSAGE:" + error.message}</p>
          <p>{"NAME:" + error.name}</p>
          {error.stack ? <p>{"STACK:" + error.stack}</p> : null}
        </>
      );
    }
  `,

  "app/routes/defer.jsx": js`
    import * as React from 'react';
    import { defer } from "@remix-run/server-runtime";
    import { Await, useAsyncError, useLoaderData, useRouteError  } from "@remix-run/react";

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has('loader')) {
        return defer({
          lazy: Promise.reject(new Error("REJECTED")),
        })
      }
      return defer({
        lazy: Promise.resolve("RESOLVED"),
      })
    }

    export default function Component() {
      let data = useLoaderData();

      return (
        <>
          <h1>Defer Route</h1>
          <React.Suspense fallback={<p>Loading...</p>}>
            <Await resolve={data.lazy} errorElement={<AwaitError />}>
              {(val) => <p>{val}</p>}
            </Await>
          </React.Suspense>
        </>
      );
    }

    function AwaitError() {
      let error = useAsyncError();
      return (
        <>
          <h2>Defer Error</h2>
          <p>{error.message}</p>
        </>
      );
    }

    export function ErrorBoundary() {
      let error = useRouteError();
      return (
        <>
          <h1>Defer Error</h1>
          <p>{"MESSAGE:" + error.message}</p>
          {error.stack ? <p>{"STACK:" + error.stack}</p> : null}
        </>
      );
    }
  `,

  "app/routes/resource.jsx": js`
    export function loader({ request }) {
      if (new URL(request.url).searchParams.has('loader')) {
        throw new Error("Loader Error");
      }
      return "RESOURCE LOADER"
    }
  `,
};

test.describe("Error Sanitization", () => {
  let fixture: Fixture;
  let oldConsoleError: () => void;
  let errorLogs: any[] = [];

  test.beforeEach(() => {
    oldConsoleError = console.error;
    errorLogs = [];
    console.error = (...args) => errorLogs.push(args);
  });

  test.afterEach(() => {
    console.error = oldConsoleError;
  });

  test.describe("serverMode=production", () => {
    test.beforeAll(async () => {
      fixture = await createFixture(
        {
          config: {
            future: {
              v2_errorBoundary: true,
            },
          },
          files: routeFiles,
        },
        ServerMode.Production
      );
    });

    test("renders document without errors", async () => {
      let response = await fixture.requestDocument("/");
      let html = await response.text();
      expect(html).toMatch("Index Route");
      expect(html).toMatch("LOADER");
      expect(html).not.toMatch("MESSAGE:");
      expect(html).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in document requests", async () => {
      let response = await fixture.requestDocument("/?loader");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).not.toMatch("LOADER");
      expect(html).toMatch("MESSAGE:Unexpected Server Error");
      expect(html).toMatch(
        '{"routes/index":{"message":"Unexpected Server Error","__type":"Error"}}'
      );
      expect(html).not.toMatch(/stack/i);
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("sanitizes render errors in document requests", async () => {
      let response = await fixture.requestDocument("/?render");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).toMatch("MESSAGE:Unexpected Server Error");
      expect(html).toMatch(
        '{"routes/index":{"message":"Unexpected Server Error","__type":"Error"}}'
      );
      expect(html).not.toMatch(/stack/i);
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Render Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("renders deferred document without errors", async () => {
      let response = await fixture.requestDocument("/defer");
      let html = await response.text();
      expect(html).toMatch("Defer Route");
      expect(html).toMatch("RESOLVED");
      expect(html).not.toMatch("MESSAGE:");
      // Defer errors are not not part of the JSON blob but rather rejected
      // against a pending promise and therefore are inlined JS.
      expect(html).not.toMatch("x.stack=e.stack;");
    });

    test("sanitizes defer errors in document requests", async () => {
      let response = await fixture.requestDocument("/defer?loader");
      let html = await response.text();
      expect(html).toMatch("Defer Error");
      expect(html).not.toMatch("RESOLVED");
      expect(html).toMatch('{"message":"Unexpected Server Error"}');
      // Defer errors are not not part of the JSON blob but rather rejected
      // against a pending promise and therefore are inlined JS.
      expect(html).toMatch("x.stack=undefined;");
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("returns data without errors", async () => {
      let response = await fixture.requestData("/", "routes/index");
      let text = await response.text();
      expect(text).toMatch("LOADER");
      expect(text).not.toMatch("MESSAGE:");
      expect(text).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in data requests", async () => {
      let response = await fixture.requestData("/?loader", "routes/index");
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("returns deferred data without errors", async () => {
      let response = await fixture.requestData("/defer", "routes/defer");
      let text = await response.text();
      expect(text).toMatch("RESOLVED");
      expect(text).not.toMatch("REJECTED");
      expect(text).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in deferred data requests", async () => {
      let response = await fixture.requestData("/defer?loader", "routes/defer");
      let text = await response.text();
      expect(text).toBe(
        '{"lazy":"__deferred_promise:lazy"}\n\n' +
          'error:{"lazy":{"message":"Unexpected Server Error"}}\n\n'
      );
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("sanitizes loader errors in resource requests", async () => {
      let response = await fixture.requestData(
        "/resource?loader",
        "routes/resource"
      );
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("sanitizes mismatched route errors in data requests", async () => {
      let response = await fixture.requestData("/", "not-a-route");
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch(
        'Route "not-a-route" does not match URL "/"'
      );
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("does not support hydration of Error subclasses", async ({ page }) => {
      let response = await fixture.requestDocument("/?subclass");
      let html = await response.text();
      expect(html).toMatch("<p>MESSAGE:Unexpected Server Error");
      expect(html).toMatch("<p>NAME:Error");

      // Hydration
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/?subclass", true);
      html = await app.getHtml();
      expect(html).toMatch("<p>MESSAGE:Unexpected Server Error");
      expect(html).toMatch("<p>NAME:Error");
    });
  });

  test.describe("serverMode=development", () => {
    test.beforeAll(async () => {
      fixture = await createFixture(
        {
          config: {
            future: {
              v2_errorBoundary: true,
            },
          },
          files: routeFiles,
        },
        ServerMode.Development
      );
    });
    let ogEnv = process.env.NODE_ENV;
    test.beforeEach(() => {
      ogEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
    });
    test.afterEach(() => {
      process.env.NODE_ENV = ogEnv;
    });

    test("renders document without errors", async () => {
      let response = await fixture.requestDocument("/");
      let html = await response.text();
      expect(html).toMatch("Index Route");
      expect(html).toMatch("LOADER");
      expect(html).not.toMatch("MESSAGE:");
      expect(html).not.toMatch(/stack/i);
    });

    test("does not sanitize loader errors in document requests", async () => {
      let response = await fixture.requestDocument("/?loader");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).not.toMatch("LOADER");
      expect(html).toMatch("<p>MESSAGE:Loader Error");
      expect(html).toMatch("<p>STACK:Error: Loader Error");
      expect(html).toMatch(
        'errors":{"routes/index":{"message":"Loader Error","stack":"Error: Loader Error\\n'
      );
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("does not sanitize render errors in document requests", async () => {
      let response = await fixture.requestDocument("/?render");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).toMatch("<p>MESSAGE:Render Error");
      expect(html).toMatch("<p>STACK:Error: Render Error");
      expect(html).toMatch(
        'errors":{"routes/index":{"message":"Render Error","stack":"Error: Render Error\\n'
      );
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Render Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("renders deferred document without errors", async () => {
      let response = await fixture.requestDocument("/defer");
      let html = await response.text();
      expect(html).toMatch("Defer Route");
      expect(html).toMatch("RESOLVED");
      expect(html).not.toMatch("MESSAGE:");
      expect(html).not.toMatch(/"stack":/i);
    });

    test("does not sanitize defer errors in document requests", async () => {
      let response = await fixture.requestDocument("/defer?loader");
      let html = await response.text();
      expect(html).toMatch("Defer Error");
      expect(html).not.toMatch("RESOLVED");
      // Defer errors are not not part of the JSON blob but rather rejected
      // against a pending promise and therefore are inlined JS.
      expect(html).toMatch("x.stack=e.stack;");
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("returns data without errors", async () => {
      let response = await fixture.requestData("/", "routes/index");
      let text = await response.text();
      expect(text).toMatch("LOADER");
      expect(text).not.toMatch("MESSAGE:");
      expect(text).not.toMatch(/stack/i);
    });

    test("does not sanitize loader errors in data requests", async () => {
      let response = await fixture.requestData("/?loader", "routes/index");
      let text = await response.text();
      expect(text).toMatch(
        '{"message":"Loader Error","stack":"Error: Loader Error'
      );
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("returns deferred data without errors", async () => {
      let response = await fixture.requestData("/defer", "routes/defer");
      let text = await response.text();
      expect(text).toMatch("RESOLVED");
      expect(text).not.toMatch("REJECTED");
      expect(text).not.toMatch(/stack/i);
    });

    test("does not sanitize loader errors in deferred data requests", async () => {
      let response = await fixture.requestData("/defer?loader", "routes/defer");
      let text = await response.text();
      expect(text).toMatch(
        'error:{"lazy":{"message":"REJECTED","stack":"Error: REJECTED'
      );
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("does not sanitize loader errors in resource requests", async () => {
      let response = await fixture.requestData(
        "/resource?loader",
        "routes/resource"
      );
      let text = await response.text();
      expect(text).toMatch(
        '{"message":"Loader Error","stack":"Error: Loader Error'
      );
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch("Loader Error");
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("sanitizes mismatched route errors in data requests", async () => {
      let response = await fixture.requestData("/", "not-a-route");
      let text = await response.text();
      expect(text).toMatch(
        '{"message":"Route \\"not-a-route\\" does not match URL \\"/\\"","stack":"Error: Route \\"not-a-route\\" does not match URL \\"/\\"'
      );
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0][0].message).toMatch(
        'Route "not-a-route" does not match URL "/"'
      );
      expect(errorLogs[0][0].stack).toMatch(" at ");
    });

    test("supports hydration of Error subclasses", async ({ page }) => {
      let response = await fixture.requestDocument("/?subclass");
      let html = await response.text();
      expect(html).toMatch("<p>MESSAGE:thisisnotathing is not defined");
      expect(html).toMatch("<p>NAME:ReferenceError");
      expect(html).toMatch(
        "<p>STACK:ReferenceError: thisisnotathing is not defined"
      );

      // Hydration
      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/?subclass", true);
      html = await app.getHtml();
      expect(html).toMatch("<p>MESSAGE:thisisnotathing is not defined");
      expect(html).toMatch("<p>NAME:ReferenceError");
      expect(html).toMatch(
        "STACK:ReferenceError: thisisnotathing is not defined"
      );
    });
  });

  test.describe("serverMode=production (user-provided handleError)", () => {
    test.beforeAll(async () => {
      fixture = await createFixture(
        {
          config: {
            future: {
              v2_errorBoundary: true,
            },
          },
          files: {
            "app/entry.server.tsx": js`
              import type { EntryContext } from "@remix-run/node";
              import { RemixServer, isRouteErrorResponse } from "@remix-run/react";
              import { renderToString } from "react-dom/server";

              export default function handleRequest(
                request: Request,
                responseStatusCode: number,
                responseHeaders: Headers,
                remixContext: EntryContext
              ) {
                let markup = renderToString(
                  <RemixServer context={remixContext} url={request.url} />
                );

                responseHeaders.set("Content-Type", "text/html");

                return new Response("<!DOCTYPE html>" + markup, {
                  status: responseStatusCode,
                  headers: responseHeaders,
                });
              }

              export function handleError(
                error: unknown,
                { request }: { request: Request },
              ) {
                console.error("App Specific Error Logging:");
                console.error("  Request: " + request.method + " " + request.url);
                if (error instanceof Error) {
                  console.error("  Error: " + error.message);
                  console.error("  Stack: " + error.stack);
                } else {
                  console.error("Dunno what this is");
                }
              }
            `,
            ...routeFiles,
          },
        },
        ServerMode.Production
      );
    });

    test("renders document without errors", async () => {
      let response = await fixture.requestDocument("/");
      let html = await response.text();
      expect(html).toMatch("Index Route");
      expect(html).toMatch("LOADER");
      expect(html).not.toMatch("MESSAGE:");
      expect(html).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in document requests", async () => {
      let response = await fixture.requestDocument("/?loader");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).not.toMatch("LOADER");
      expect(html).toMatch("MESSAGE:Unexpected Server Error");
      expect(html).toMatch(
        '{"routes/index":{"message":"Unexpected Server Error","__type":"Error"}}'
      );
      expect(html).not.toMatch(/stack/i);
      expect(errorLogs[0][0]).toEqual("App Specific Error Logging:");
      expect(errorLogs[1][0]).toEqual("  Request: GET test://test/?loader");
      expect(errorLogs[2][0]).toEqual("  Error: Loader Error");
      expect(errorLogs[3][0]).toMatch(" at ");
      expect(errorLogs.length).toBe(4);
    });

    test("sanitizes render errors in document requests", async () => {
      let response = await fixture.requestDocument("/?render");
      let html = await response.text();
      expect(html).toMatch("Index Error");
      expect(html).toMatch("MESSAGE:Unexpected Server Error");
      expect(html).toMatch(
        '{"routes/index":{"message":"Unexpected Server Error","__type":"Error"}}'
      );
      expect(html).not.toMatch(/stack/i);
      expect(errorLogs[0][0]).toEqual("App Specific Error Logging:");
      expect(errorLogs[1][0]).toEqual("  Request: GET test://test/?render");
      expect(errorLogs[2][0]).toEqual("  Error: Render Error");
      expect(errorLogs[3][0]).toMatch(" at ");
      expect(errorLogs.length).toBe(4);
    });

    test("renders deferred document without errors", async () => {
      let response = await fixture.requestDocument("/defer");
      let html = await response.text();
      expect(html).toMatch("Defer Route");
      expect(html).toMatch("RESOLVED");
      expect(html).not.toMatch("MESSAGE:");
      // Defer errors are not not part of the JSON blob but rather rejected
      // against a pending promise and therefore are inlined JS.
      expect(html).not.toMatch("x.stack=e.stack;");
    });

    test("sanitizes defer errors in document requests", async () => {
      let response = await fixture.requestDocument("/defer?loader");
      let html = await response.text();
      expect(html).toMatch("Defer Error");
      expect(html).not.toMatch("RESOLVED");
      expect(html).toMatch('{"message":"Unexpected Server Error"}');
      // Defer errors are not not part of the JSON blob but rather rejected
      // against a pending promise and therefore are inlined JS.
      expect(html).toMatch("x.stack=undefined;");
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("returns data without errors", async () => {
      let response = await fixture.requestData("/", "routes/index");
      let text = await response.text();
      expect(text).toMatch("LOADER");
      expect(text).not.toMatch("MESSAGE:");
      expect(text).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in data requests", async () => {
      let response = await fixture.requestData("/?loader", "routes/index");
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs[0][0]).toEqual("App Specific Error Logging:");
      expect(errorLogs[1][0]).toEqual(
        "  Request: GET test://test/?loader=&_data=routes%2Findex"
      );
      expect(errorLogs[2][0]).toEqual("  Error: Loader Error");
      expect(errorLogs[3][0]).toMatch(" at ");
      expect(errorLogs.length).toBe(4);
    });

    test("returns deferred data without errors", async () => {
      let response = await fixture.requestData("/defer", "routes/defer");
      let text = await response.text();
      expect(text).toMatch("RESOLVED");
      expect(text).not.toMatch("REJECTED");
      expect(text).not.toMatch(/stack/i);
    });

    test("sanitizes loader errors in deferred data requests", async () => {
      let response = await fixture.requestData("/defer?loader", "routes/defer");
      let text = await response.text();
      expect(text).toBe(
        '{"lazy":"__deferred_promise:lazy"}\n\n' +
          'error:{"lazy":{"message":"Unexpected Server Error"}}\n\n'
      );
      // defer errors are not logged to the server console since the request
      // has "succeeded"
      expect(errorLogs.length).toBe(0);
    });

    test("sanitizes loader errors in resource requests", async () => {
      let response = await fixture.requestData(
        "/resource?loader",
        "routes/resource"
      );
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs[0][0]).toEqual("App Specific Error Logging:");
      expect(errorLogs[1][0]).toEqual(
        "  Request: GET test://test/resource?loader=&_data=routes%2Fresource"
      );
      expect(errorLogs[2][0]).toEqual("  Error: Loader Error");
      expect(errorLogs[3][0]).toMatch(" at ");
      expect(errorLogs.length).toBe(4);
    });

    test("sanitizes mismatched route errors in data requests", async () => {
      let response = await fixture.requestData("/", "not-a-route");
      let text = await response.text();
      expect(text).toBe('{"message":"Unexpected Server Error"}');
      expect(errorLogs[0][0]).toEqual("App Specific Error Logging:");
      expect(errorLogs[1][0]).toEqual(
        "  Request: GET test://test/?_data=not-a-route"
      );
      expect(errorLogs[2][0]).toEqual(
        '  Error: Route "not-a-route" does not match URL "/"'
      );
      expect(errorLogs[3][0]).toMatch(" at ");
      expect(errorLogs.length).toBe(4);
    });
  });
});
