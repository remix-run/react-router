import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

let BANNER_MESSAGE = "you do not have permission to view /protected";

test.beforeAll(async () => {
  fixture = await createFixture({
    config: {
      future: { v2_routeConvention: true },
    },
    files: {
      "app/session.server.js": js`
        import { createCookieSessionStorage } from "@remix-run/node";

        export let MESSAGE_KEY = "message";

        export let sessionStorage = createCookieSessionStorage({
          cookie: {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secrets: ["cookie-secret"],
          }
        })
      `,

      "app/root.jsx": js`
        import { json } from "@remix-run/node";
        import {
          Links,
          Meta,
          Outlet,
          Scripts,
          useLoaderData,
        } from "@remix-run/react";

        import { sessionStorage, MESSAGE_KEY } from "~/session.server";

        export const loader = async ({ request }) => {
          let session = await sessionStorage.getSession(request.headers.get("Cookie"));
          let message = session.get(MESSAGE_KEY) || null;

          return json(message, {
            headers: {
              "Set-Cookie": await sessionStorage.commitSession(session),
            },
          });
        };

        export default function Root() {
          const message = useLoaderData();

          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                {!!message && <p id="message">{message}</p>}
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }
      `,

      "app/routes/_index.jsx": js`
        import { Link } from "@remix-run/react";

        export default function Index() {
          return (
            <p>
              <Link to="/protected">protected</Link>
            </p>
          );
        }
      `,

      "app/routes/login.jsx": js`
        export default function Login() {
          return <p>login</p>;
        }
      `,

      "app/routes/protected.jsx": js`
        import { redirect } from "@remix-run/node";

        import { sessionStorage, MESSAGE_KEY } from "~/session.server";

        export let loader = async ({ request }) => {
          let session = await sessionStorage.getSession(request.headers.get("Cookie"));

          session.flash(MESSAGE_KEY, "${BANNER_MESSAGE}");

          return redirect("/login", {
            headers: {
              "Set-Cookie": await sessionStorage.commitSession(session),
            },
          });
        };

        export default function Protected() {
          return <p>protected</p>;
        }
      `,
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("should revalidate when cookie is set on redirect from loader", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickLink("/protected");
  await page.waitForSelector(`#message:has-text("${BANNER_MESSAGE}")`);
  expect(await app.getHtml()).toMatch(BANNER_MESSAGE);
});
