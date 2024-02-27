import { test, expect } from "@playwright/test";

import { ServerMode } from "../build/node_modules/@remix-run/server-runtime/dist/mode.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

test.describe("headers export", () => {
  let ROOT_HEADER_KEY = "X-Test";
  let ROOT_HEADER_VALUE = "SUCCESS";
  let ACTION_HKEY = "X-Test-Action";
  let ACTION_HVALUE = "SUCCESS";

  let appFixture: Fixture;

  test.beforeAll(async () => {
    appFixture = await createFixture(
      {
        files: {
          "app/root.tsx": js`
            import { json } from "@remix-run/node";
            import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

            export const loader = () => json({});

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
            import { json } from "@remix-run/node";

            export function loader() {
              return json(null, {
                headers: {
                  "${ROOT_HEADER_KEY}": "${ROOT_HEADER_VALUE}"
                }
              })
            }

            export function headers({ loaderHeaders }) {
              return {
                "${ROOT_HEADER_KEY}": loaderHeaders.get("${ROOT_HEADER_KEY}")
              }
            }

            export default function Index() {
              return <div>Heyo!</div>
            }
          `,

          "app/routes/action.tsx": js`
            import { json } from "@remix-run/node";

            export function action() {
              return json(null, {
                headers: {
                  "${ACTION_HKEY}": "${ACTION_HVALUE}"
                }
              })
            }

            export function headers({ actionHeaders }) {
              return {
                "${ACTION_HKEY}": actionHeaders.get("${ACTION_HKEY}")
              }
            }

            export default function Action() { return <div/> }
          `,

          "app/routes/parent.tsx": js`
            export function headers({ actionHeaders, errorHeaders, loaderHeaders, parentHeaders }) {
              return new Headers([
                ...(parentHeaders ? Array.from(parentHeaders.entries()) : []),
                ...(actionHeaders ? Array.from(actionHeaders.entries()) : []),
                ...(loaderHeaders ? Array.from(loaderHeaders.entries()) : []),
                ...(errorHeaders ? Array.from(errorHeaders.entries()) : []),
              ]);
            }

            export function loader({ request }) {
              if (new URL(request.url).searchParams.get('throw') === "parent") {
                throw new Response(null, {
                  status: 400,
                  headers: { 'X-Parent-Loader': 'error' },
                })
              }
              return new Response(null, {
                headers: { 'X-Parent-Loader': 'success' },
              })
            }

            export async function action({ request }) {
              let fd = await request.formData();
              if (fd.get('throw') === "parent") {
                throw new Response(null, {
                  status: 400,
                  headers: { 'X-Parent-Action': 'error' },
                })
              }
              return new Response(null, {
                headers: { 'X-Parent-Action': 'success' },
              })
            }

            export default function Component() { return <div/> }

            export function ErrorBoundary() {
              return <h1>Error!</h1>
            }
          `,

          "app/routes/parent.child.tsx": js`
            export function loader({ request }) {
              if (new URL(request.url).searchParams.get('throw') === "child") {
                throw new Response(null, {
                  status: 400,
                  headers: { 'X-Child-Loader': 'error' },
                })
              }
              return null
            }

            export async function action({ request }) {
              let fd = await request.formData();
              if (fd.get('throw') === "child") {
                throw new Response(null, {
                  status: 400,
                  headers: { 'X-Child-Action': 'error' },
                })
              }
              return null
            }

            export default function Component() { return <div/> }
          `,

          "app/routes/parent.child.grandchild.tsx": js`
            export function loader({ request }) {
              throw new Response(null, {
                status: 400,
                headers: { 'X-Child-Grandchild': 'error' },
              })
            }

            export default function Component() { return <div/> }
          `,

          "app/routes/cookie.tsx": js`
            import { json } from "@remix-run/server-runtime";
            import { Outlet } from "@remix-run/react";

            export function loader({ request }) {
              if (new URL(request.url).searchParams.has("parent-throw")) {
                throw json(null, { headers: { "Set-Cookie": "parent-thrown-cookie=true" } });
              }
              return null
            };

            export default function Parent() {
              return <Outlet />;
            }

            export function ErrorBoundary() {
              return <h1>Caught!</h1>;
            }
          `,

          "app/routes/cookie.child.tsx": js`
            import { json } from "@remix-run/node";

            export function loader({ request }) {
              if (new URL(request.url).searchParams.has("throw")) {
                throw json(null, { headers: { "Set-Cookie": "thrown-cookie=true" } });
              }
              return json(null, {
                headers: { "Set-Cookie": "normal-cookie=true" },
              });
            };

            export default function Child() {
              return <p>Child</p>;
            }
          `,
        },
      },
      ServerMode.Test
    );
  });

  test("can use `action` headers", async () => {
    let response = await appFixture.postDocument(
      "/action",
      new URLSearchParams()
    );
    expect(response.headers.get(ACTION_HKEY)).toBe(ACTION_HVALUE);
  });

  test("can use the loader headers when all routes have loaders", async () => {
    let response = await appFixture.requestDocument("/");
    expect(response.headers.get(ROOT_HEADER_KEY)).toBe(ROOT_HEADER_VALUE);
  });

  test("can use the loader headers when parents don't have loaders", async () => {
    let HEADER_KEY = "X-Test";
    let HEADER_VALUE = "SUCCESS";

    let fixture = await createFixture(
      {
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
            import { json } from "@remix-run/node";

            export function loader() {
              return json(null, {
                headers: {
                  "${HEADER_KEY}": "${HEADER_VALUE}"
                }
              })
            }

            export function headers({ loaderHeaders }) {
              return {
                "${HEADER_KEY}": loaderHeaders.get("${HEADER_KEY}")
              }
            }

            export default function Index() {
              return <div>Heyo!</div>
            }
          `,
        },
      },
      ServerMode.Test
    );
    let response = await fixture.requestDocument("/");
    expect(response.headers.get(HEADER_KEY)).toBe(HEADER_VALUE);
  });

  test("returns headers from successful /parent GET requests", async () => {
    let response = await appFixture.requestDocument("/parent");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("returns headers from successful /parent/child GET requests", async () => {
    let response = await appFixture.requestDocument("/parent/child");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("returns headers from successful /parent POST requests", async () => {
    let response = await appFixture.postDocument(
      "/parent",
      new URLSearchParams()
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-action", "success"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("returns headers from successful /parent/child POST requests", async () => {
    let response = await appFixture.postDocument(
      "/parent/child",
      new URLSearchParams()
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("returns headers from failed /parent GET requests", async () => {
    let response = await appFixture.requestDocument("/parent?throw=parent");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-loader", "error, error"], // Shows up in loaderHeaders and errorHeaders
      ])
    );
  });

  test("returns bubbled headers from failed /parent/child GET requests", async () => {
    let response = await appFixture.requestDocument(
      "/parent/child?throw=child"
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-child-loader", "error"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("ignores headers from successful non-rendered loaders", async () => {
    let response = await appFixture.requestDocument(
      "/parent/child?throw=parent"
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-loader", "error, error"], // Shows up in loaderHeaders and errorHeaders
      ])
    );
  });

  test("chooses higher thrown errors when multiple loaders throw", async () => {
    let response = await appFixture.requestDocument(
      "/parent/child/grandchild?throw=child"
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-child-loader", "error"],
        ["x-parent-loader", "success"],
      ])
    );
  });

  test("returns headers from failed /parent POST requests", async () => {
    let response = await appFixture.postDocument(
      "/parent?throw=parent",
      new URLSearchParams("throw=parent")
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-parent-action", "error, error"], // Shows up in actionHeaders and errorHeaders
      ])
    );
  });

  test("returns bubbled headers from failed /parent/child POST requests", async () => {
    let response = await appFixture.postDocument(
      "/parent/child",
      new URLSearchParams("throw=child")
    );
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["x-child-action", "error"],
      ])
    );
  });

  test("automatically includes cookie headers from normal responses", async () => {
    let response = await appFixture.requestDocument("/cookie/child");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["set-cookie", "normal-cookie=true"],
      ])
    );
  });

  test("automatically includes cookie headers from thrown responses", async () => {
    let response = await appFixture.requestDocument("/cookie/child?throw");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["set-cookie", "thrown-cookie=true"],
      ])
    );
  });

  test("does not duplicate thrown cookie headers from boundary route", async () => {
    let response = await appFixture.requestDocument("/cookie?parent-throw");
    expect(JSON.stringify(Array.from(response.headers.entries()))).toBe(
      JSON.stringify([
        ["content-type", "text/html"],
        ["set-cookie", "parent-thrown-cookie=true"],
      ])
    );
  });
});
