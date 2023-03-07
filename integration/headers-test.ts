import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

test.describe("headers export", () => {
  let ROOT_HEADER_KEY = "X-Test";
  let ROOT_HEADER_VALUE = "SUCCESS";
  let ACTION_HKEY = "X-Test-Action";
  let ACTION_HVALUE = "SUCCESS";

  let appFixture: Fixture;

  test.beforeAll(async () => {
    appFixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
        "app/root.jsx": js`
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

        "app/routes/_index.jsx": js`
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

        "app/routes/action.jsx": js`
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
      },
    });
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

    let fixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
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
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.jsx": js`
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
    });
    let response = await fixture.requestDocument("/");
    expect(response.headers.get(HEADER_KEY)).toBe(HEADER_VALUE);
  });
});
