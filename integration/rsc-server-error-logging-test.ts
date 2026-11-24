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
        `,
        "app/routes/loader-error.tsx": js`
          export function loader() {
            throw new Error("LOADER_ERROR_MESSAGE");
          }

          export default function LoaderError() {
            return <h1>LOADER_ERROR_ROUTE</h1>;
          }

          export function ErrorBoundary() {
            return <h1>CUSTOM_ERROR_BOUNDARY</h1>;
          }
        `,
        "app/routes/default-boundary.tsx": js`
          export function loader() {
            throw new Error("DEFAULT_BOUNDARY_ERROR_MESSAGE");
          }

          export default function DefaultBoundaryRoute() {
            return null;
          }
        `,
        "app/routes/render-error.tsx": js`
          export default function RenderErrorRoute() {
            throw new Error("SSR_RENDER_ERROR_MESSAGE");
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

  function expectLoggedOnce(message: string) {
    let messages = logged
      .flat()
      .map((arg) => (arg instanceof Error ? arg.message : String(arg)));
    expect(messages.filter((entry) => entry.includes(message))).toHaveLength(1);
  }

  test("logs errors thrown from loaders", async () => {
    let response = await fixture.requestDocument("/loader-error");
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("CUSTOM_ERROR_BOUNDARY");
    expectLoggedOnce("LOADER_ERROR_MESSAGE");
  });

  test("logs a loader error once when rendering the default root boundary", async () => {
    let response = await fixture.requestDocument("/default-boundary");
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("Application Error");
    expectLoggedOnce("DEFAULT_BOUNDARY_ERROR_MESSAGE");
  });

  test("logs an SSR render error from the default root boundary", async () => {
    let response = await fixture.requestDocument("/render-error");
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("Application Error");
    expectLoggedOnce("SSR_RENDER_ERROR_MESSAGE");
  });

  test("logs errors thrown from resource routes", async () => {
    let response = await fixture.requestResource("/resource-error");
    expect(response.status).toBe(500);
    await response.text();
    expectLoggedOnce("RESOURCE_ERROR_MESSAGE");
  });
});
