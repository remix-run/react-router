import { test, expect } from "@playwright/test";
import {
  createAppFixture,
  createFixture,
  js,
  type AppFixture,
  type Fixture,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("sessionStorage denied", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import * as React from "react";
          import { Link, Links, Meta, Outlet, Scripts, useRouteError } from "react-router";
          
          export function ErrorBoundary() {
            const error = useRouteError();
            console.error("ErrorBoundary caught:", error);
            return (
              <html>
                <head>
                  <title>Error</title>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <h1>Application Error</h1>
                  <pre>{error?.message || "Unknown error"}</pre>
                  <Scripts />
                </body>
              </html>
            );
          }
          
          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <nav>
                    <Link to="/">Home</Link>{" | "}
                    <Link to="/docs">Docs</Link>
                  </nav>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          export default function Index() {
            return <h1>Home</h1>;
          }
        `,
        "app/routes/docs.tsx": js`
          export default function Docs() {
            return <h1>Documentation</h1>;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test("should handle navigation gracefully when storage is blocked", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      const storageError = new DOMException(
        "Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.",
        "SecurityError",
      );

      ["sessionStorage", "localStorage"].forEach((storage) => {
        Object.defineProperty(window, storage, {
          get() {
            throw storageError;
          },
          set() {
            throw storageError;
          },
          configurable: false,
        });
      });
    });

    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/");
    await expect(page.locator("h1")).toContainText("Home");

    await app.clickLink("/docs");
    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.locator("h1")).toContainText("Documentation");

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("h1")).toContainText("Home");

    await page.goForward();
    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.locator("h1")).toContainText("Documentation");
  });
});
