import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

describe("headers export", () => {
  let ROOT_HEADER_KEY = "X-Test";
  let ROOT_HEADER_VALUE = "SUCCESS";
  let ACTION_HKEY = "X-Test-Action";
  let ACTION_HVALUE = "SUCCESS";

  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { json, Links, Meta, Outlet, Scripts } from "remix";

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

        "app/routes/index.jsx": js`
          import { json } from "remix";

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
          import { json } from "remix";

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

  it("can use `action` headers", async () => {
    let response = await fixture.postDocument("/action", new URLSearchParams());
    expect(response.headers.get(ACTION_HKEY)).toBe(ACTION_HVALUE);
  });

  it("can use the loader headers when all routes have loaders", async () => {
    let response = await fixture.requestDocument("/");
    expect(response.headers.get(ROOT_HEADER_KEY)).toBe(ROOT_HEADER_VALUE);
  });

  it("can use the loader headers when parents don't have loaders", async () => {
    let HEADER_KEY = "X-Test";
    let HEADER_VALUE = "SUCCESS";

    let fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Links, Meta, Outlet, Scripts } from "remix";

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

        "app/routes/index.jsx": js`
          import { json } from "remix";

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
