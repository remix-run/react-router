import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";

import { UNSAFE_ServerMode as ServerMode } from "react-router";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import {
  createFixture,
  js,
  createAppFixture,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("<HydratedRouter>", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";

          export default function Index() {
            return (
              <div>
                <div id="pizza">pizza</div>
                <Link to="/burgers">burger link</Link>
              </div>
            )
          }
        `,

        "app/routes/burgers.tsx": js`
          export default function Index() {
            return <div id="cheeseburger">cheeseburger</div>;
          }
        `,
      },
    });

    // This creates an interactive app using puppeteer.
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  test(
    "expect to be able to browse backward out of a remix app, then forward " +
      "twice in history and have pages render correctly",
    async ({ page, browserName }) => {
      test.skip(
        browserName === "firefox",
        "FireFox doesn't support browsing to an empty page (aka about:blank)"
      );

      let app = new PlaywrightFixture(appFixture, page);

      // Slow down the entry chunk on the second load so the bug surfaces
      let isSecondLoad = false;
      await page.route(/entry/, async (route) => {
        if (isSecondLoad) {
          await new Promise((r) => setTimeout(r, 1000));
        }
        route.continue();
      });

      // This sets up the Remix modules cache in memory, priming the error case.
      await app.goto("/");
      await app.clickLink("/burgers");
      expect(await page.content()).toContain("cheeseburger");
      await page.goBack();
      await page.waitForSelector("#pizza");
      expect(await app.getHtml()).toContain("pizza");

      // Takes the browser out of the Remix app
      await page.goBack();
      expect(page.url()).toContain("about:blank");

      // Forward to / and immediately again to /burgers.  This will trigger the
      // error since we'll load __routeModules for / but then try to hydrate /burgers
      isSecondLoad = true;
      await page.goForward();
      await page.goForward();
      await page.waitForSelector("#cheeseburger");

      // If we resolve the error, we should hard reload and eventually
      // successfully render /burgers
      await page.waitForSelector("#cheeseburger");
      expect(await app.getHtml()).toContain("cheeseburger");
    }
  );

  test.describe("routes prop", () => {
    test.describe("SPA  Mode", () => {
      async function setupSpaTest({
        page,
        files,
      }: {
        page: Page;
        files?: Record<string, string>;
      }) {
        fixture = await createFixture({
          spaMode: true,
          files: {
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { vitePlugin as reactRouter } from "@react-router/dev";
              export default defineConfig({
                plugins: [
                  reactRouter({
                    // We don't want to pick up the app/routes/_index.tsx file from
                    // the template and instead want to use only the src/root.tsx
                    // file below
                    appDirectory: "src",
                    ssr: false,
                  })
                ],
              });
            `,
            "src/root.tsx": js`
              import {
                Meta,
                Links,
                Outlet,
                Routes,
                Route,
                Scripts,
                ScrollRestoration,
              } from "react-router";
              export function Layout({ children }: { children: React.ReactNode }) {
                return (
                  <html>
                    <head>
                      <Meta />
                      <Links />
                    </head>
                    <body>
                      {children}
                      <ScrollRestoration />
                      <Scripts />
                    </body>
                  </html>
                );
              }
              export default function Root() {
                return <Outlet />;
              }
              export function HydrateFallback() {
                return <p>Loading...</p>;
              }
            `,
            "src/entry.client.tsx": js`
              import { Link, HydratedRouter, Outlet, useLoaderData } from "react-router";
              import { startTransition, StrictMode } from "react";
              import { hydrateRoot } from "react-dom/client";
              const routes = [{
                index: true,
                loader() {
                  return "Index Loader";
                },
                Component() {
                  let data = useLoaderData();
                  return (
                    <>
                      <Link to="/parent/child">Go to /parent/child</Link>
                      <p id="index-data">{data}</p>
                    </>
                  );
                },
              }, {
                path: '/parent',
                loader() {
                  return "Parent Loader";
                },
                Component() {
                  let data = useLoaderData();
                  return (
                    <>
                      <p id="parent-data">{data}</p>
                      <Outlet />
                    </>
                  );
                },
                children: [{
                  path: 'child',
                  loader() {
                    return "Child Loader";
                  },
                  Component() {
                    let data = useLoaderData();
                    return <p id="child-data">{data}</p>;
                  },
                }]
              }];
              startTransition(() => {
                hydrateRoot(
                  document,
                  <StrictMode>
                    <HydratedRouter routes={routes} />
                  </StrictMode>
                );
              });
            `,
            ...files,
          },
        });
        appFixture = await createAppFixture(fixture);
        return new PlaywrightFixture(appFixture, page);
      }

      test("Allows users to provide client-side-only routes via HydratedRouter", async ({
        page,
      }) => {
        let app = await setupSpaTest({
          page,
        });
        await app.goto("/");
        await page.waitForSelector("#index-data");
        expect(await app.getHtml("#index-data")).toContain("Index Loader");

        await app.clickLink("/parent/child");
        await page.waitForSelector("#child-data");
        expect(await app.getHtml("#parent-data")).toContain("Parent Loader");
        expect(await app.getHtml("#child-data")).toContain("Child Loader");

        let app2 = new PlaywrightFixture(appFixture, page);
        await app2.goto("/parent/child");
        await page.waitForSelector("#child-data");
        expect(await app2.getHtml("#parent-data")).toContain("Parent Loader");
        expect(await app2.getHtml("#child-data")).toContain("Child Loader");
      });

      test("Allows users to combine file routes with HydratedRouter routes", async ({
        page,
      }) => {
        let app = await setupSpaTest({
          page,
          files: {
            "src/routes/page.tsx": js`
              import { Link, useLoaderData } from "react-router";
              export function clientLoader() {
                return "Page Loader";
              }
              export default function Component() {
                let data = useLoaderData();
                return (
                  <>
                    <Link to="/">Home</Link>
                    <p id="page-data">{data}</p>
                  </>
                );
              }
            `,
          },
        });
        await app.goto("/page", true);
        await page.waitForSelector("#page-data");
        expect(await app.getHtml("#page-data")).toContain("Page Loader");

        await app.clickLink("/");
        await page.waitForSelector("#index-data");
        expect(await app.getHtml("#index-data")).toContain("Index Loader");

        await app.clickLink("/parent/child");
        await page.waitForSelector("#child-data");
        expect(await app.getHtml("#parent-data")).toContain("Parent Loader");
        expect(await app.getHtml("#child-data")).toContain("Child Loader");
      });

      test("Throws an error if users provide duplicate index routes", async ({
        page,
      }) => {
        let app = await setupSpaTest({
          page,
          files: {
            "src/entry.client.tsx": js`
              import { Link, HydratedRouter, Outlet, useLoaderData } from "react-router";
              import { startTransition, StrictMode } from "react";
              import { hydrateRoot } from "react-dom/client";
              const routes = [{
                index: true,
                Component() {
                  return <h1>Index from prop</h1>;
                },
              }];
              startTransition(() => {
                hydrateRoot(
                  document,
                  <StrictMode>
                    <HydratedRouter routes={routes} />
                  </StrictMode>
                );
              });
            `,
            "src/routes/_index.tsx": js`
              import { Link, useLoaderData } from "react-router";
              export default function Component() {
                return <h1>Index from file</h1>
              }
            `,
          },
        });

        let logs: string[] = [];
        page.on("console", (msg) => logs.push(msg.text()));

        await app.goto("/", true);
        expect(logs).toEqual([
          expect.stringContaining(
            "Error: Cannot add a duplicate child index route to the root route " +
              "via the `HydratedRouter` `routes` prop.  The `routes` prop will be ignored."
          ),
        ]);
      });

      test("Throws an error if users provide duplicate path routes", async ({
        page,
      }) => {
        let app = await setupSpaTest({
          page,
          files: {
            "src/entry.client.tsx": js`
              import { HydratedRouter } from "react-router";
              import { startTransition, StrictMode } from "react";
              import { hydrateRoot } from "react-dom/client";
              const routes = [{
                path: '/path',
                Component() {
                  return <h1>Path from prop</h1>;
                },
              }];
              startTransition(() => {
                hydrateRoot(
                  document,
                  <StrictMode>
                    <HydratedRouter routes={routes} />
                  </StrictMode>
                );
              });
            `,
            "src/routes/path.tsx": js`
              export default function Component() {
                return <h1>Path from file</h1>
              }
            `,
          },
        });

        let logs: string[] = [];
        page.on("console", (msg) => logs.push(msg.text()));

        await app.goto("/", true);
        expect(logs).toEqual([
          expect.stringContaining(
            "Error: Cannot add a duplicate child route with path `/path` to " +
              "the root route via the `HydratedRouter` `routes` prop.  The " +
              "`routes` prop will be ignored."
          ),
        ]);
      });
    });

    test.describe("SSR", () => {
      async function setupSsrTest({
        development,
        page,
        files,
      }: {
        development?: boolean;
        page: Page;
        files?: Record<string, string>;
      }) {
        let mode = development ? ServerMode.Development : undefined;
        fixture = await createFixture(
          {
            files: {
              "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { vitePlugin as reactRouter } from "@react-router/dev";
              export default defineConfig({
                plugins: [
                  reactRouter()
                ],
              });
            `,
              "app/root.tsx": js`
              import {
                Meta,
                Links,
                Outlet,
                Routes,
                Route,
                Scripts,
                ScrollRestoration,
              } from "react-router";
              export function Layout({ children }: { children: React.ReactNode }) {
                return (
                  <html>
                    <head>
                      <Meta />
                      <Links />
                    </head>
                    <body>
                      {children}
                      <ScrollRestoration />
                      <Scripts />
                    </body>
                  </html>
                );
              }
              export default function Root() {
                return <Outlet />;
              }
            `,
              "app/entry.client.tsx": js`
              import { Link, HydratedRouter, Outlet, useLoaderData } from "react-router";
              import { startTransition, StrictMode } from "react";
              import { hydrateRoot } from "react-dom/client";
              const routes = [{
                path: '/parent',
                loader() {
                  return "Parent Loader";
                },
                Component() {
                  let data = useLoaderData();
                  return (
                    <>
                      <p id="parent-data">{data}</p>
                      <Outlet />
                    </>
                  );
                },
                children: [{
                  path: 'child',
                  loader() {
                    return "Child Loader";
                  },
                  Component() {
                    let data = useLoaderData();
                    return <p id="child-data">{data}</p>;
                  },
                }]
              }];
              startTransition(() => {
                hydrateRoot(
                  document,
                  <StrictMode>
                    <HydratedRouter routes={routes} />
                  </StrictMode>
                );
              });
            `,
              "app/routes/_index.tsx": js`
              import { Link, useLoaderData } from "react-router";
              export function loader() {
                return "Index Server Loader";
              }
              export default function Component() {
                let data = useLoaderData();
                return (
                  <>
                    <Link to="/parent/child">Go to /parent/child</Link>
                    <p id="index-data">{data}</p>
                  </>
                );
              }
            `,
              ...files,
            },
          },
          mode
        );
        appFixture = await createAppFixture(fixture, mode);
        return new PlaywrightFixture(appFixture, page);
      }

      test("Allows users to combine file-based SSR routes with HydratedRouter routes", async ({
        page,
      }) => {
        let app = await setupSsrTest({ page });
        await app.goto("/");
        await page.waitForSelector("#index-data");
        expect(await app.getHtml("#index-data")).toContain(
          "Index Server Loader"
        );

        await app.clickLink("/parent/child");
        await page.waitForSelector("#child-data");
        expect(await app.getHtml("#parent-data")).toContain("Parent Loader");
        expect(await app.getHtml("#child-data")).toContain("Child Loader");
      });

      test("Can hydrate into a client-side route after amn SSR 404", async ({
        page,
      }) => {
        let oldConsoleError = console.error;
        console.error = () => {};

        let app = await setupSsrTest({
          development: true,
          page,
          files: {
            "app/entry.client.tsx": js`
              import { Link, HydratedRouter, Outlet, useLoaderData } from "react-router";
              import { startTransition, StrictMode, useState,  } from "react";
              import { hydrateRoot } from "react-dom/client";
              const routes = [{
                path: '/parent',
                loader() {
                  return "Parent Loader";
                },
                Component() {
                  let data = useLoaderData();
                  return (
                    <>
                      <p id="parent-data">{data}</p>
                      <Outlet/>
                    </>
                  );
                },
                children: [{
                  path: 'child',
                  loader() {
                    return "Child Loader";
                  },
                  Component() {
                    let [count, setCount] = useState(0);
                    let data = useLoaderData();
                    return (
                      <>
                        <p id="child-data">{data}</p>
                        <button onClick={() => setCount((c) => c + 1)}>
                          Increment ({count})
                        </button>
                      </>
                    );
                  },
                }]
              }];
              startTransition(() => {
                hydrateRoot(
                  document,
                  <StrictMode>
                    <HydratedRouter routes={routes} />
                  </StrictMode>
                );
              });
            `,
          },
        });
        let logs: string[] = [];
        page.on("console", (msg) => logs.push(msg.text()));

        // Validate document request is a 404
        let res = await fixture.requestDocument("/parent/child");
        let html = await res.text();
        expect(res.status).toBe(404);
        expect(html).toContain("404<!-- --> <!-- -->Not Found");

        // Load it up as a SPA and let it hydrate
        await app.goto("/parent/child");
        await page.waitForSelector("#child-data");
        expect(await app.getHtml("#parent-data")).toContain("Parent Loader");
        expect(await app.getHtml("#child-data")).toContain("Child Loader");

        // Confirm that hydration failed
        [
          "Warning: Expected server HTML to contain a matching",
          "Error: Hydration failed because the initial UI does not match what was rendered on the server",
          "Warning: An error occurred during hydration. The server HTML was replaced with client content",
        ].forEach((msg) =>
          expect(logs.some((m) => m.includes(msg))).toBe(true)
        );

        // But we recovered to an interactive state
        expect(await app.getHtml("button")).toContain("Increment (0)");
        await app.clickElement("button");
        expect(await app.getHtml("button")).toContain("Increment (1)");

        console.error = oldConsoleError;
      });
    });
  });
});
