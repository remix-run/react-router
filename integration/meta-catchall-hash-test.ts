import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes.ts": js`
        import { type RouteConfig, index, route } from "@react-router/dev/routes";
        export default [
          index("routes/_index.tsx"),
          route("*", "routes/catchall.tsx"),
        ] satisfies RouteConfig;
      `,
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
        import { Link } from "react-router";
        export function meta() {
          return [{ title: "Home" }];
        }
        export default function Index() {
          return (
            <div>
              <h1>Home</h1>
              <Link to="/catchall" data-testid="go-catchall">
                Go to catchall
              </Link>
            </div>
          );
        }
      `,
      "app/routes/catchall.tsx": js`
        import { Link } from "react-router";
        export function meta() {
          return [{ title: "Catchall" }];
        }
        export default function Catchall() {
          return (
            <div>
              <h1 data-testid="catchall-heading">Catchall route</h1>
              <Link to="#hash" data-testid="hash-link">Hash link</Link>
            </div>
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

test("meta tags remain after hash navigation from catchall route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/");
  await page.waitForSelector("[data-testid='go-catchall']");
  await page.click("[data-testid='go-catchall']");
  await page.waitForSelector("[data-testid='catchall-heading']");
  expect(await page.title()).toBe("Catchall");

  await page.click("[data-testid='hash-link']");
  // Hash navigation doesn't trigger a load event; waitForFunction polls the DOM directly
  await page.waitForFunction(() => window.location.hash === "#hash");
  expect(await page.title()).toBe("Catchall");
});

test("meta tags present when loading catchall route directly with hash", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/catchall#hash");
  await page.waitForSelector("[data-testid='catchall-heading']");

  expect(await page.title()).toBe("Catchall");
});
