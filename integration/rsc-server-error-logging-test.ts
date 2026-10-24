import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

// These tests use the `rsc-vite-framework` template without custom
// `entry.rsc.tsx` / `entry.ssr.tsx` files, so they exercise the default RSC
// Framework Mode entries in `@react-router/dev/config/default-rsc-entries`.

test.describe("RSC Framework: server error logging", () => {
  let fixture: Fixture;
  let originalConsoleError: typeof console.error;
  let logged: unknown[][];

  test.beforeAll(async () => {
    fixture = await createFixture({
      templateName: "rsc-vite-framework",
      files: {
        // Give the root an ErrorBoundary so the built-in default root
        // boundary (which calls `console.error`) never renders
        "app/root.tsx": js`
          import { Links, Meta, Outlet, ScrollRestoration } from "react-router";

          export function Layout({ children }) {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  {children}
                  <ScrollRestoration />
                </body>
              </html>
            );
          }

          export default function App() {
            return <Outlet />;
          }

          export function ErrorBoundary() {
            return <h1 id="error-boundary">ROOT_ERROR_BOUNDARY</h1>;
          }
        `,
        "app/routes/loader-error.tsx": js`
          export function loader() {
            throw new Error("LOADER_ERROR_MESSAGE");
          }

          export default function LoaderError() {
            return <h1>LOADER_ERROR_ROUTE</h1>;
          }
        `,
        "app/routes/resource-error.tsx": js`
          export function loader() {
            throw new Error("RESOURCE_ERROR_MESSAGE");
          }
        `,
      },
    });
  });

  // The fixture's request helpers run the built server handler in this
  // process, so we can observe what it logs
  test.beforeEach(() => {
    logged = [];
    originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args);
    };
  });

  test.afterEach(() => {
    console.error = originalConsoleError;
  });

  function expectLogged(message: string) {
    let messages = logged
      .flat()
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)));
    expect(messages.join("\n")).toContain(message);
  }

  test("logs errors thrown from loaders", async () => {
    let response = await fixture.requestDocument("/loader-error");
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("ROOT_ERROR_BOUNDARY");
    expectLogged("LOADER_ERROR_MESSAGE");
  });

  test("logs errors thrown from resource routes", async () => {
    let response = await fixture.requestResource("/resource-error");
    expect(response.status).toBe(500);
    await response.text();
    expectLogged("RESOURCE_ERROR_MESSAGE");
  });
});
