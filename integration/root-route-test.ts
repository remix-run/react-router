import { test, expect } from "@playwright/test";

import { ServerMode } from "../build/node_modules/@remix-run/server-runtime/dist/mode.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("root route", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.afterAll(() => {
    appFixture.close();
  });

  test("matches the sole root route on /", async ({ page }) => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          export default function Root() {
            return (
              <html>
                <body>
                  <h1>Hello Root!</h1>
                </body>
              </html>
            );
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("h1");
    expect(await app.getHtml("h1")).toMatch("Hello Root!");
  });

  test("renders the Layout around the component", async ({ page }) => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          export function Layout({ children }) {
            return (
              <html>
                <head>
                  <title>Layout Title</title>
                </head>
                <body>
                  {children}
                </body>
              </html>
            );
          }
          export default function Root() {
            return <h1>Hello Root!</h1>;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("h1");
    expect(await app.getHtml("title")).toMatch("Layout Title");
    expect(await app.getHtml("h1")).toMatch("Hello Root!");
  });

  test("renders the Layout around the ErrorBoundary", async ({ page }) => {
    let oldConsoleError;
    oldConsoleError = console.error;
    console.error = () => {};

    fixture = await createFixture(
      {
        files: {
          "app/root.tsx": js`
          import { useRouteError } from '@remix-run/react';
          export function Layout({ children }) {
            return (
              <html>
                <head>
                  <title>Layout Title</title>
                </head>
                <body>
                  {children}
                </body>
              </html>
            );
          }
          export default function Root() {
            throw new Error('broken render')
          }
          export function ErrorBoundary() {
            return <p>{useRouteError().message}</p>;
          }
        `,
        },
      },
      ServerMode.Development
    );
    appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("p");
    expect(await app.getHtml("title")).toMatch("Layout Title");
    expect(await app.getHtml("p")).toMatch("broken render");

    console.error = oldConsoleError;
  });

  test("renders the Layout around the default ErrorBoundary", async ({
    page,
  }) => {
    let oldConsoleError;
    oldConsoleError = console.error;
    console.error = () => {};

    fixture = await createFixture(
      {
        files: {
          "app/root.tsx": js`
          export function Layout({ children }) {
            return (
              <html>
                <head>
                  <title>Layout Title</title>
                </head>
                <body>
                  {children}
                </body>
              </html>
            );
          }
          export default function Root() {
            throw new Error('broken render')
          }
        `,
        },
      },
      ServerMode.Development
    );
    appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("h1");
    expect(await app.getHtml("title")).toMatch("Layout Title");
    expect(await app.getHtml("h1")).toMatch("Application Error");

    console.error = oldConsoleError;
  });
});
