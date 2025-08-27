import {
  test,
  expect,
  type Response as PlaywrightResponse,
} from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest, validateRSCHtml } from "./utils";

implementations.forEach((implementation) => {
  test.describe(`RSC (${implementation.name})`, () => {
    test.describe("Development", () => {
      let port: number;
      let stopAfterAll: () => void;

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test.beforeAll(async () => {
        port = await getPort();
        stopAfterAll = await setupRscTest({
          implementation,
          port,
          dev: true,
          files: {
            "src/routes.ts": js`
              import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

              export const routes = [
                {
                  id: "root",
                  path: "",
                  lazy: () => import("./routes/root"),
                  children: [
                    {
                      id: "loader-error-server-boundary",
                      path: "loader-error-server-boundary",
                      lazy: () => import("./routes/loader-error-server-boundary/home"),
                    },
                    {
                      id: "errors-force-revalidation",
                      path: "errors-force-revalidation",
                      lazy: () => import("./routes/errors-force-revalidation/root"),
                      children: [
                        {
                          id: "errors-force-revalidation.index",
                          index: true,
                          lazy: () => import("./routes/errors-force-revalidation/index"),
                        },
                        {
                          id: "errors-force-revalidation.other",
                          path: "other",
                          lazy: () => import("./routes/errors-force-revalidation/other"),
                        },
                      ],
                    },
                    {
                      id: "client-error-boundary-props-server-loader",
                      path: "client-error-boundary-props-server-loader",
                      lazy: () => import("./routes/client-error-boundary-props-server-loader/home"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/loader-error-server-boundary/home.tsx": js`
              export function loader() {
                throw new Error("Intentional error from loader");
              }

              export default function HomeRoute() {
                return <h2>This should not be rendered</h2>;
              }

              export { ErrorBoundary } from "./home.client";
            `,
            "src/routes/loader-error-server-boundary/home.client.tsx": js`
              "use client"
              import { useRouteError } from "react-router";

              export function ErrorBoundary() {
                let error = useRouteError();
                return (
                  <>
                    <h2 data-error-title>Error Caught!</h2>
                    <p data-error-message>{error.message}</p>
                  </>
                );
              }
            `,

            "src/routes/errors-force-revalidation/root.tsx": js`
              import { Outlet, Link } from "react-router";

              export { shouldRevalidate } from "./root.client";

              let loaderCallCount = 0;

              export function loader() {
                loaderCallCount++;
                throw new Error("Root loader error (call #" + loaderCallCount + ")");
              }

              export function Layout({ children }: { children: React.ReactNode }) {
                return (
                  <html>
                    <body>
                      <ul>
                        <li><Link to="/errors-force-revalidation" data-link-index>Index route</Link></li>
                        <li><Link to="/errors-force-revalidation/other" data-link-other>Other route</Link></li>
                      </ul>
                      {children}
                    </body>
                  </html>
                );
              }

              export function ErrorBoundary({ error }) {
                return (
                  <div>
                    <h1 data-error-boundary-loader-call-count={loaderCallCount}>
                      Root ErrorBoundary (loaderCallCount: {loaderCallCount})
                    </h1>
                  </div>
                );
              }

              export default function RootRoute() {
                return (
                  <div>
                    <h1>Root Route</h1>
                    <p>This should never be rendered since the root loader always throws</p>
                    <Outlet />
                  </div>
                );
              }
            `,
            "src/routes/errors-force-revalidation/root.client.tsx": js`
              "use client";

              export function shouldRevalidate() {
                // This should be ignored since this route always throws an error
                return false;
              }
            `,
            "src/routes/errors-force-revalidation/index.tsx": js`
              export default function IndexRoute() {
                return (
                  <div>
                    <h2>Index Route</h2>
                    <p>This should never be rendered since the root loader always throws</p>
                  </div>
                );
              }
            `,
            "src/routes/errors-force-revalidation/other.tsx": js`
              export default function OtherRoute() {
                return (
                  <div>
                    <h2>Other Route</h2>
                    <p>This should never be rendered since the root loader always throws</p>
                  </div>
                );
              }
            `,

            "src/routes/client-error-boundary-props-server-loader/home.tsx": js`
              export function loader() {
                throw new Error("Intentional error from server loader");
              }

              export default function HomeRoute() {
                return <h2>This should not be rendered</h2>;
              }

              export { ErrorBoundary } from "./home.client";
            `,
            "src/routes/client-error-boundary-props-server-loader/home.client.tsx": js`
              "use client";

              export function ErrorBoundary({ error, params }) {
                return (
                  <div>
                    <h2 data-error-title>Error Caught!</h2>
                    <p data-error-message>{error.message}</p>
                    {params && (
                      <div data-error-params>
                        <p data-error-params-type>typeof params: {typeof params}</p>
                        <p data-error-params-count>params count: {Object.keys(params).length}</p>
                      </div>
                    )}
                  </div>
                );
              }
            `,
          },
        });
      });

      test.describe("Errors", () => {
        test("Handles errors from loaders with server component boundary", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/loader-error-server-boundary`,
          );

          // Verify error boundary is shown
          await page.waitForSelector("[data-error-title]");
          await page.waitForSelector("[data-error-message]");
          expect(await page.locator("[data-error-message]").textContent()).toBe(
            "Intentional error from loader",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Forces revalidation of routes with errors", async ({ page }) => {
          test.skip(
            implementation.name === "parcel",
            "Parcel's built-in error overlay get's in the way of the test",
          );
          await page.goto(
            `http://localhost:${port}/errors-force-revalidation`,
            {
              waitUntil: "networkidle",
            },
          );

          // Verify that the root error boundary is re-rendered as we navigate around
          await page.waitForSelector(
            "[data-error-boundary-loader-call-count='1']",
          );
          await page.click("[data-link-other]");
          await page.waitForSelector(
            "[data-error-boundary-loader-call-count='2']",
          );
          await page.click("[data-link-index]");
          await page.waitForSelector(
            "[data-error-boundary-loader-call-count='3']",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Passes props to client ErrorBoundary when error is thrown in server loader", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/client-error-boundary-props-server-loader`,
          );

          // Verify error boundary is shown
          await page.waitForSelector("[data-error-title]");
          await page.waitForSelector("[data-error-message]");
          expect(await page.locator("[data-error-title]").textContent()).toBe(
            "Error Caught!",
          );
          expect(await page.locator("[data-error-message]").textContent()).toBe(
            "Intentional error from server loader",
          );

          // Verify params are passed to error boundary
          await page.waitForSelector("[data-error-params]");
          await page.waitForSelector("[data-error-params-type]");
          await page.waitForSelector("[data-error-params-count]");
          expect(
            await page.locator("[data-error-params-type]").textContent(),
          ).toBe("typeof params: object");
          expect(
            await page.locator("[data-error-params-count]").textContent(),
          ).toBe("params count: 0");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });
      });
    });

    test.describe("Production", () => {
      let port: number;
      let stopAfterAll: () => void;

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test.beforeAll(async () => {
        port = await getPort();
        stopAfterAll = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes.ts": js`
              import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

              export const routes = [
                {
                  id: "root",
                  path: "",
                  lazy: () => import("./routes/root"),
                  children: [
                    {
                      id: "soft-navigation",
                      path: "soft-navigation",
                      children: [
                        {
                          id: "soft-navigation.home",
                          index: true,
                          lazy: () => import("./routes/soft-navigation/home"),
                        },
                        {
                          id: "soft-navigation.dashboard",
                          path: "dashboard",
                          lazy: () => import("./routes/soft-navigation/dashboard"),
                        },
                      ]
                    },
                    {
                      id: "request-context",
                      path: "request-context",
                      lazy: () => import("./routes/request-context/home"),
                    },
                    {
                      id: "resource-request-context",
                      path: "resource-request-context",
                      children: [
                        {
                          id: "resource-request-context.home",
                          index: true,
                          lazy: () => import("./routes/resource-request-context/home"),
                        },
                        {
                          id: "resource-request-context.resource",
                          path: "resource",
                          lazy: () => import("./routes/resource-request-context/resource"),
                        },
                      ]
                    },
                    {
                      id: "middleware-request-context",
                      path: "middleware-request-context",
                      lazy: () => import("./routes/middleware-request-context/root"),
                      children: [
                        {
                          id: "middleware-request-context.home",
                          index: true,
                          lazy: () => import("./routes/middleware-request-context/home"),
                        },
                      ]
                    },
                    {
                      id: "get-context",
                      path: "get-context",
                      lazy: () => import("./routes/get-context/root"),
                      children: [
                        {
                          id: "get-context.home",
                          index: true,
                          lazy: () => import("./routes/get-context/home"),
                        },
                      ]
                    },
                    {
                      id: "resource-url-and-fetchers",
                      path: "resource-url-and-fetchers",
                      children: [
                        {
                          id: "resource-url-and-fetchers.home",
                          index: true,
                          lazy: () => import("./routes/resource-url-and-fetchers/home"),
                        },
                        {
                          id: "resource-url-and-fetchers.resource",
                          path: "resource",
                          lazy: () => import("./routes/resource-url-and-fetchers/resource"),
                        }
                      ]
                    },
                    {
                      id: "resource-error-handling",
                      path: "resource-error-handling",
                      children: [
                        {
                          id: "resource-error-handling.home",
                          index: true,
                          lazy: () => import("./routes/resource-error-handling/home"),
                        },
                        {
                          id: "resource-error-handling.no-loader-resource",
                          path: "no-loader-resource",
                          lazy: () => import("./routes/resource-error-handling/no-loader-resource"),
                        },
                        {
                          id: "resource-error-handling.no-action-resource",
                          path: "no-action-resource",
                          lazy: () => import("./routes/resource-error-handling/no-action-resource"),
                        }
                      ]
                    },
                    {
                      id: "server-action",
                      path: "server-action",
                      children: [
                        {
                          id: "server-action.home",
                          index: true,
                          lazy: () => import("./routes/server-action/home"),
                        },
                      ]
                    },
                    {
                      id: "inline-server-action",
                      path: "inline-server-action",
                      children: [
                        {
                          id: "inline-server-action.home",
                          index: true,
                          lazy: () => import("./routes/inline-server-action/home"),
                        }
                      ]
                    },
                    {
                      id: "throw-redirect-server-action",
                      path: "throw-redirect-server-action",
                      children: [
                        {
                          id: "throw-redirect-server-action.home",
                          index: true,
                          lazy: () => import("./routes/throw-redirect-server-action/home"),
                        }
                      ]
                    },
                    {
                      id: "side-effect-redirect-server-action",
                      path: "side-effect-redirect-server-action",
                      children: [
                        {
                          id: "side-effect-redirect-server-action.home",
                          index: true,
                          lazy: () => import("./routes/side-effect-redirect-server-action/home"),
                        }
                      ]
                    },
                    {
                      id: "server-function-reference",
                      path: "server-function-reference",
                      children: [
                        {
                          id: "server-function-reference.home",
                          index: true,
                          lazy: () => import("./routes/server-function-reference/home"),
                        }
                      ]
                    },
                    {
                      id: "sanitized-errors",
                      path: "sanitized-errors",
                      lazy: () => import("./routes/sanitized-errors/home"),
                    },
                    {
                      id: "client-route-component-props",
                      path: "client-route-component-props",
                      lazy: () => import("./routes/client-route-component-props/home"),
                    },
                    {
                      id: "client-error-boundary-props-client-loader",
                      path: "client-error-boundary-props-client-loader",
                      lazy: () => import("./routes/client-error-boundary-props-client-loader/home"),
                    },
                    {
                      id: "hydrate-fallback-props",
                      path: "hydrate-fallback-props",
                      lazy: () => import("./routes/hydrate-fallback-props/home"),
                    },
                    {
                      id: "no-revalidate-server-action",
                      path: "no-revalidate-server-action",
                      lazy: () => import("./routes/no-revalidate-server-action/home"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/root.tsx": js`
              import { Links, Outlet, ScrollRestoration } from "react-router";

              export const middleware = [
                async (_, next) => {
                  const response = await next();
                  return response.headers.set("x-test", "test");
                }
              ];

              export function Layout({ children }: { children: React.ReactNode }) {
                return (
                  <html lang="en">
                    <head>
                      <meta charSet="utf-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1" />
                      <title>Vite (RSC)</title>
                      <Links />
                    </head>
                    <body>
                      {children}
                      <ScrollRestoration />
                    </body>
                  </html>
                );
              }

              export default function RootRoute() {
                return <Outlet />;
              }
            `,

            "src/config/request-context.ts": js`
              import { createContext, RouterContextProvider } from "react-router";

              export const testContext = createContext<string>("default-value");

              export const requestContext = new RouterContextProvider(
                new Map([[testContext, "test-context-value"]])
              );
            `,
            "src/config/get-context.ts": js`
              // THIS FILE OVERRIDES THE DEFAULT IMPLEMENTATION
              import { createContext } from "react-router";

              export const testContext = createContext<string>("default-value");

              export function getContext() {
                return new Map([[testContext, "client-context-value"]]);
              }
            `,

            "src/routes/soft-navigation/home.tsx": js`
              import { Link } from "react-router";

              export function loader() {
                return { message: "Home Page Data" };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h1 data-page="home">Home Page</h1>
                    <p data-content>{loaderData.message}</p>
                    <Link to="/soft-navigation/dashboard">Dashboard</Link>
                  </div>
                );
              }
            `,
            "src/routes/soft-navigation/dashboard.tsx": js`
              export function loader() {
                return { count: 1 };
              }

              export { default } from "./dashboard.client";
            `,
            "src/routes/soft-navigation/dashboard.client.tsx": js`
              "use client";

              import { useState } from "react";
              import { Link } from "react-router";

              // Export the entire route as a client component
              export default function DashboardRoute({ loaderData }) {
                const [count, setCount] = useState(loaderData.count);

                return (
                  <div>
                    <h1 data-page="dashboard">Dashboard</h1>

                    {/* Server data rendered in client component */}
                    <p data-server-count>
                      Server count: {loaderData.count}
                    </p>

                    {/* Client interactive elements */}
                    <p data-client-count>
                      Client count: {count}
                    </p>

                    <button data-increment onClick={() => setCount(count + 1)}>
                      Increment
                    </button>

                    <Link to="/soft-navigation">Home</Link>
                  </div>
                );
              }
            `,

            "src/routes/request-context/home.tsx": js`
              import { testContext } from "../../config/request-context";

              export function loader({ context }) {
                return { contextValue: context.get(testContext) };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h2 data-home>Home: {loaderData.contextValue}</h2>
                  </div>
                );
              }
            `,

            "src/routes/resource-request-context/home.client.tsx": js`
              "use client";

              import { useFetcher } from "react-router";

              export function ResourceFetcher() {
                const fetcher = useFetcher();

                const loadResource = () => {
                  fetcher.submit({ hello: "world" }, { method: "post", action: "/resource-request-context/resource" });
                };

                return (
                  <div>
                    <button type="button" onClick={loadResource}>
                      Load Resource
                    </button>
                    {!!fetcher.data && (
                      <pre data-testid="resource-data">
                        {JSON.stringify(fetcher.data)}
                      </pre>
                    )}
                  </div>
                );
              }
            `,
            "src/routes/resource-request-context/home.tsx": js`
              import { ResourceFetcher } from "./home.client";

              export default function HomeRoute() {
                return <ResourceFetcher />;
              }
            `,
            "src/routes/resource-request-context/resource.tsx": js`
              import { testContext } from "../../config/request-context";

              export function loader({ context }) {
                return Response.json({
                  message: "Hello from resource route!",
                  contextValue: context.get(testContext)
                });
              }

              export async function action({ context }) {
                return Response.json({
                  message: "Hello from resource route!",
                  contextValue: context.get(testContext),
                });
              }
            `,

            "src/routes/middleware-request-context/root.tsx": js`
              import type { MiddlewareFunction } from "react-router";
              import { Outlet } from "react-router";
              import { testContext } from "../../config/request-context";

              export const middleware: MiddlewareFunction<Response>[] = [
                async ({ request, context }, next) => {
                  const contextValue = context.get(testContext);
                  request.headers.set("x-middleware-context", contextValue);
                  return await next();
                },
              ];

              export default function RootRoute() {
                return (
                  <div>
                    <h1>Root Route</h1>
                    <Outlet />
                  </div>
                );
              }
            `,
            "src/routes/middleware-request-context/home.tsx": js`
              export function loader({ request }) {
                const contextValue = request.headers.get("x-middleware-context");
                return { contextValue };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h2 data-context-value>Context value: {loaderData.contextValue}</h2>
                  </div>
                );
              }
            `,

            "src/routes/get-context/root.tsx": js`
              "use client";

              import { Outlet } from "react-router";
              import type { ClientMiddlewareFunction } from "react-router";
              import { testContext } from "../../config/get-context";

              export const clientMiddleware = [
                async ({ context }, next) => {
                  context.set(testContext, "client-context-value");
                  return await next();
                },
              ];

              export function HydrateFallback() {
                return <div>Loading...</div>;
              }

              export default function RootRoute() {
                return (
                  <div>
                    <h1>Root Route</h1>
                    <Outlet />
                  </div>
                );
              }
            `,
            "src/routes/get-context/home.tsx": js`
              "use client";

              import { useLoaderData } from "react-router";
              import { testContext } from "../../config/get-context";

              export function clientLoader({ context }) {
                const contextValue = context.get(testContext);
                return { contextValue };
              }

              clientLoader.hydrate = true;

              export default function HomeRoute() {
                const loaderData = useLoaderData();
                return (
                  <div>
                    <h2 data-client-context>Client context value: {loaderData.contextValue}</h2>
                  </div>
                );
              }
            `,

            "src/routes/resource-url-and-fetchers/resource.ts": js`
              export function loader() {
                return Response.json({ message: "Hello from resource route!" });
              }

              export async function action({ request }) {
                return {
                  message: "Hello from resource route!",
                  echo: await request.text(),
                };
              }
            `,
            "src/routes/resource-url-and-fetchers/home.client.tsx": js`
              "use client";

              import { useFetcher } from "react-router";

              export function ResourceFetcher() {
                const fetcher = useFetcher();

                const loadResource = () => {
                  fetcher.submit({ hello: "world" }, { method: "post", action: "/resource-url-and-fetchers/resource" });
                };

                return (
                  <div>
                    <button type="button" onClick={loadResource}>
                      Load Resource
                    </button>
                    {!!fetcher.data && (
                      <pre data-testid="resource-data">
                        {JSON.stringify(fetcher.data)}
                      </pre>
                    )}
                  </div>
                );
              }
            `,
            "src/routes/resource-url-and-fetchers/home.tsx": js`
              import { ResourceFetcher } from "./home.client";

              export default function HomeRoute() {
                return <ResourceFetcher />;
              }
            `,

            "src/routes/resource-error-handling/home.tsx": js`
              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                  </div>
                );
              }
            `,
            "src/routes/resource-error-handling/no-loader-resource.tsx": js`
              // This resource route has no loader, so GET requests should fail
              export async function action() {
                return { message: "no-loader-resource action works" };
              }
            `,
            "src/routes/resource-error-handling/no-action-resource.tsx": js`
              // This resource route has no action, so POST requests should fail
              export function loader() {
                return { message: "no-action-resource loader works" };
              }
            `,

            "src/routes/server-action/home.actions.ts": js`
              "use server";

              export async function incrementCounter(count: number, formData: FormData) {
                return count + parseInt(formData.get("by") as string || "1", 10);
              }
            `,
            "src/routes/server-action/home.tsx": js`
              export { default } from "./home.client";
            `,
            "src/routes/server-action/home.client.tsx": js`
              "use client";

              import { useActionState } from "react";

              import { incrementCounter } from "./home.actions";

              export default function HomeRoute() {
                const [count, incrementCounterAction, incrementing] = useActionState(incrementCounter, 0);

                return (
                  <div>
                    <h2 data-home>Home: ({count})</h2>
                    <form action={incrementCounterAction}>
                      <input type="hidden" name="name" value="Updated" />
                      <button type="submit" data-submit>
                        {incrementing ? "Updating via Server Function" : "Update via Server Function"}
                      </button>
                    </form>
                  </div>
                );
              }
            `,

            "src/routes/inline-server-action/home.tsx": js`
              let count = 0;
              let name = "Default";

              export function loader() {
                return { name, count };
              }

              export default function HomeRoute({ loaderData }) {
                const updateCounter = async (formData: FormData) => {
                  "use server";
                  name = formData.get("name");
                  ++count
                  return { name, count };
                }

                return (
                  <div>
                    <h2 data-home>Home: {loaderData.name} ({loaderData.count})</h2>
                    <form action={updateCounter}>
                      <input type="hidden" name="name" value="Updated" />
                      <button type="submit" data-submit>Update via Server Function</button>
                    </form>
                  </div>
                );
              }
            `,

            "src/routes/throw-redirect-server-action/home.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction(formData: FormData) {
                throw redirect("/throw-redirect-server-action?redirected=true");
              }
            `,
            "src/routes/throw-redirect-server-action/home.client.tsx": js`
              "use client";
              import { useState } from "react";

              export function Counter() {
                const [count, setCount] = useState(0);
                return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
              }
            `,
            "src/routes/throw-redirect-server-action/home.tsx": js`
              import { redirectAction } from "./home.actions";
              import { Counter } from "./home.client";

              export default function HomeRoute(props) {
                console.log({props});
                return (
                  <div>
                    <form action={redirectAction}>
                      <button type="submit" data-submit>
                        Redirect via Server Function
                      </button>
                    </form>
                    <Counter />
                  </div>
                );
              }
            `,

            "src/routes/side-effect-redirect-server-action/home.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction() {
                redirect("/side-effect-redirect-server-action?redirected=true", { headers: { "x-test": "test" } });
                return "redirected";
              }
            `,
            "src/routes/side-effect-redirect-server-action/home.client.tsx": js`
              "use client";
              import { useState } from "react";

              export function Counter() {
                const [count, setCount] = useState(0);
                return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
              }
            `,
            "src/routes/side-effect-redirect-server-action/home.tsx": js`
              "use client";
              import {useActionState} from "react";
              import { redirectAction } from "./home.actions";
              import { Counter } from "./home.client";

              export default function HomeRoute(props) {
                const [state, action] = useActionState(redirectAction, null);
                return (
                  <div>
                    <form action={action}>
                      <button type="submit" data-submit>
                        Redirect via Server Function
                      </button>
                    </form>
                    {state && <div data-testid="state">{state}</div>}
                    <Counter />
                  </div>
                );
              }
            `,

            "src/routes/server-function-reference/home.actions.ts": js`
              "use server";

              export async function incrementCounter({count, ref}: {count: number; ref: unknown}, formData: FormData) {
                return {count: count + parseInt(formData.get("by") as string || "1", 10), ref};
              }
            `,
            "src/routes/server-function-reference/home.tsx": js`
              export { default } from "./home.client";
            `,
            "src/routes/server-function-reference/home.client.tsx": js`
              "use client";

              import { useActionState } from "react";

              import { incrementCounter } from "./home.actions";

              const ogRef = {};
              export default function HomeRoute() {
                const [{count,ref}, incrementCounterAction, incrementing] = useActionState(incrementCounter, {count: 0, ref: ogRef});

                return (
                  <div>
                    <h2 data-home>Home: ({count})</h2>
                    <h2 data-home-ref>{ref === ogRef ? "good" : "bad"}</h2>
                    <form action={incrementCounterAction}>
                      <button type="submit" data-submit>
                        {incrementing ? "Updating via Server Function" : "Update via Server Function"}
                      </button>
                    </form>
                  </div>
                );
              }
            `,

            "src/routes/sanitized-errors/home.tsx": js`
              export function loader() {
                throw new Error("This error should be sanitized");
              }

              export default function HomeRoute() {
                return <h2>This should not be rendered</h2>;
              }

              export { ErrorBoundary } from "./home.client";
            `,
            "src/routes/sanitized-errors/home.client.tsx": js`
              "use client"
              import { useRouteError } from "react-router";

              export function ErrorBoundary() {
                let error = useRouteError();
                return (
                  <>
                    <h2 data-error-title>Error Caught!</h2>
                    <p data-error-message>{error.message}</p>
                  </>
                );
              }
            `,

            "src/routes/client-route-component-props/home.tsx": js`
              export { default, clientLoader, clientAction } from "./home.client";
            `,
            "src/routes/client-route-component-props/home.client.tsx": js`
              "use client";

              import { Form } from "react-router";

              export async function clientLoader() {
                return { message: "Hello from client loader!" };
              }

              export async function clientAction({ request }) {
                const formData = await request.formData();
                const name = formData.get("name") as string;
                return { actionResult: "Hello " + name + " from client action!" };
              }

              export default function HomeRoute({ loaderData, actionData, matches, params }) {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    {loaderData && (
                      <p data-loader-data>{loaderData.message}</p>
                    )}
                    {actionData && (
                      <p data-action-data>{actionData.actionResult}</p>
                    )}
                    {matches && (
                      <div data-matches>
                        <p data-matches-ids>matches ids: {matches.map(match => match.id).join(", ")}</p>
                      </div>
                    )}
                    {params && (
                      <div data-params>
                        <p data-params-type>typeof params: {typeof params}</p>
                        <p data-params-count>params count: {Object.keys(params).length}</p>
                      </div>
                    )}
                    <Form method="post">
                      <input name="name" data-name-input />
                      <button type="submit" data-submit-button>
                        Submit Action
                      </button>
                    </Form>
                  </div>
                );
              }
            `,

            "src/routes/client-error-boundary-props-client-loader/home.tsx": js`
              export { default, clientLoader, ErrorBoundary } from "./home.client";
            `,
            "src/routes/client-error-boundary-props-client-loader/home.client.tsx": js`
              "use client";

              export async function clientLoader() {
                throw new Error("Intentional error from client loader");
              }

              export function ErrorBoundary({ error, params }) {
                return (
                  <div>
                    <h2 data-error-title>Error Caught!</h2>
                    <p data-error-message>{error.message}</p>
                    {params && (
                      <div data-error-params>
                        <p data-error-params-type>typeof params: {typeof params}</p>
                        <p data-error-params-count>params count: {Object.keys(params).length}</p>
                      </div>
                    )}
                  </div>
                );
              }

              export default function HomeRoute() {
                return (
                  <div>
                    <h2>Home Route</h2>
                  </div>
                );
              }
            `,

            "src/routes/hydrate-fallback-props/home.tsx": js`
              export { default, clientLoader, HydrateFallback } from "./home.client";
            `,
            "src/routes/hydrate-fallback-props/home.client.tsx": js`
              "use client";

              export async function clientLoader() {
                const pollingPromise = (async () => {
                  while (globalThis.unblockClientLoader !== true) {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                  }
                })();
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error("Client loader wasn't unblocked after 5s")), 5000);
                });
                await Promise.race([pollingPromise, timeoutPromise]);
                return { message: "Hello from client loader!" };
              }

              export function HydrateFallback({ params }) {
                return (
                  <div>
                    <h2 data-hydrate-fallback>Hydrate Fallback</h2>
                    {params && (
                      <div data-hydrate-params>
                        <p data-hydrate-params-type>typeof params: {typeof params}</p>
                        <p data-hydrate-params-count>params count: {Object.keys(params).length}</p>
                      </div>
                    )}
                  </div>
                );
              }

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                  </div>
                );
              }
            `,

            "src/routes/no-revalidate-server-action/home.actions.ts": js`
              "use server";

              export async function noRevalidateAction() {
                return "no revalidate";
              }
            `,
            "src/routes/no-revalidate-server-action/home.tsx": js`
              import ClientHomeRoute from "./home.client";

              export function loader() {
                console.log("loader");
              }

              export default function HomeRoute() {
                return <ClientHomeRoute identity={{}} />;
              }
            `,
            "src/routes/no-revalidate-server-action/home.client.tsx": js`
              "use client";

              import { useActionState, useState } from "react";
              import { noRevalidateAction } from "./home.actions";

              export default function HomeRoute({ identity }) {
                const [initialIdentity] = useState(identity);
                const [state, action, pending] = useActionState(noRevalidateAction, null);
                return (
                  <div>
                    <form action={action}>
                      <input name="$SKIP_REVALIDATION" type="hidden" />
                      <button type="submit" data-submit>No Revalidate</button>
                    </form>
                    {state && <div data-state>{state}</div>}
                    {pending && <div data-pending>Pending</div>}
                    {initialIdentity !== identity && <div data-revalidated>Revalidated</div>}
                  </div>
                );
              }
            `,
          },
        });
      });

      test.describe("Basic functionality", () => {
        test("Supports navigating between server-first/client-first routes starting on a server route", async ({
          page,
        }) => {
          await page.goto(`http://localhost:${port}/soft-navigation`);

          // Load a server route
          await page.waitForSelector("[data-page=home]");
          expect(await page.locator("[data-content]").textContent()).toBe(
            "Home Page Data",
          );

          // Navigate to a client route
          await page.click("a[href='/soft-navigation/dashboard']");
          await page.waitForSelector("[data-page=dashboard]");

          // Verify server data
          expect(await page.locator("[data-server-count]").textContent()).toBe(
            "Server count: 1",
          );
          expect(await page.locator("[data-client-count]").textContent()).toBe(
            "Client count: 1",
          );

          // Increment via the client component
          await page.click("[data-increment]");
          expect(await page.locator("[data-server-count]").textContent()).toBe(
            "Server count: 1",
          );
          expect(await page.locator("[data-client-count]").textContent()).toBe(
            "Client count: 2",
          );

          // Navigate back to a server route
          await page.click("a[href='/soft-navigation']");
          await page.waitForSelector("[data-page=home]");
          expect(await page.locator("[data-content]").textContent()).toBe(
            "Home Page Data",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports navigating between server-first/client-first routes starting on a client route", async ({
          page,
        }) => {
          await page.goto(`http://localhost:${port}/soft-navigation/dashboard`);
          await page.waitForSelector("[data-page=dashboard]");

          // Verify server data
          expect(await page.locator("[data-server-count]").textContent()).toBe(
            "Server count: 1",
          );
          expect(await page.locator("[data-client-count]").textContent()).toBe(
            "Client count: 1",
          );

          // Increment via the client component
          await page.click("[data-increment]");
          expect(await page.locator("[data-server-count]").textContent()).toBe(
            "Server count: 1",
          );
          expect(await page.locator("[data-client-count]").textContent()).toBe(
            "Client count: 2",
          );

          // Navigate to a server route
          await page.click("a[href='/soft-navigation']");
          await page.waitForSelector("[data-page=home]");
          expect(await page.locator("[data-content]").textContent()).toBe(
            "Home Page Data",
          );

          // Navigate back to a client route
          await page.click("a[href='/soft-navigation/dashboard']");
          await page.waitForSelector("[data-page=dashboard]");
          expect(await page.locator("[data-server-count]").textContent()).toBe(
            "Server count: 1",
          );
          expect(await page.locator("[data-client-count]").textContent()).toBe(
            "Client count: 1",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports request context using the RouterContextProvider API", async ({
          page,
        }) => {
          await page.goto(`http://localhost:${port}/request-context`);
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home: test-context-value",
          );

          // Ensure this is actually using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports request context in resource routes using the RouterContextProvider API", async ({
          page,
          request,
        }) => {
          const getResponse = await request.get(
            `http://localhost:${port}/resource-request-context/resource`,
          );
          expect(getResponse?.status()).toBe(200);
          expect((await getResponse?.json()).contextValue).toBe(
            "test-context-value",
          );

          const postResponse = await request.post(
            `http://localhost:${port}/resource-request-context/resource`,
          );
          expect(postResponse?.status()).toBe(200);
          expect((await postResponse?.json()).contextValue).toBe(
            "test-context-value",
          );

          await page.goto(`http://localhost:${port}/resource-request-context`);
          await page.click("button");

          await page.waitForSelector("[data-testid=resource-data]");
          const fetcherData = JSON.parse(
            (await page.locator("[data-testid=resource-data]").textContent()) ||
              "{}",
          );
          expect(fetcherData.contextValue).toBe("test-context-value");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports request context in middleware using the RouterContextProvider API", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/middleware-request-context/`,
          );
          await page.waitForSelector("[data-context-value]");
          expect(await page.locator("[data-context-value]").textContent()).toBe(
            "Context value: test-context-value",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports client context using getContext", async ({ page }) => {
          test.skip(
            implementation.name === "parcel",
            "Parcel is having trouble resolving modules, should probably file a bug report for this.",
          );

          await page.goto(`http://localhost:${port}/get-context`);
          await page.waitForSelector("[data-client-context]");
          expect(
            await page.locator("[data-client-context]").textContent(),
          ).toBe("Client context value: client-context-value");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports resource routes as URL and fetchers", async ({
          page,
          request,
        }) => {
          const getResponse = await request.get(
            `http://localhost:${port}/resource-url-and-fetchers/resource`,
          );
          expect(getResponse?.status()).toBe(200);
          expect(await getResponse?.json()).toEqual({
            message: "Hello from resource route!",
          });

          const postResponse = await request.post(
            `http://localhost:${port}/resource-url-and-fetchers/resource`,
            {
              data: { hello: "world" },
            },
          );
          expect(postResponse?.status()).toBe(200);
          expect(await postResponse?.json()).toEqual({
            message: "Hello from resource route!",
            echo: JSON.stringify({ hello: "world" }),
          });

          await page.goto(`http://localhost:${port}/resource-url-and-fetchers`);
          await page.click("button");

          await page.waitForSelector("[data-testid=resource-data]");
          expect(
            await page.locator("[data-testid=resource-data]").textContent(),
          ).toBe(
            JSON.stringify({
              message: "Hello from resource route!",
              echo: "hello=world",
            }),
          );
        });

        test("Handles error responses from resource routes missing loaders/actions", async ({
          page,
          request,
        }) => {
          const getResponse = await request.get(
            `http://localhost:${port}/resource-error-handling/no-loader-resource`,
          );
          expect(getResponse?.status()).toBe(400);
          expect(await getResponse?.text()).toBe(
            'Error: You made a GET request to "/resource-error-handling/no-loader-resource" but did not provide a `loader` for route "resource-error-handling.no-loader-resource", so there is no way to handle the request.',
          );

          const postResponse = await request.post(
            `http://localhost:${port}/resource-error-handling/no-action-resource`,
          );
          expect(postResponse?.status()).toBe(405);
          expect(await postResponse?.text()).toBe(
            'Error: You made a POST request to "/resource-error-handling/no-action-resource" but did not provide an `action` for route "resource-error-handling.no-action-resource", so there is no way to handle the request.',
          );

          const postWithActionResponse = await request.post(
            `http://localhost:${port}/resource-error-handling/no-loader-resource`,
          );
          expect(postWithActionResponse?.status()).toBe(200);
          expect(await postWithActionResponse?.json()).toEqual({
            message: "no-loader-resource action works",
          });

          const getWithLoaderResponse = await request.get(
            `http://localhost:${port}/resource-error-handling/no-action-resource`,
          );
          expect(getWithLoaderResponse?.status()).toBe(200);
          expect(await getWithLoaderResponse?.json()).toEqual({
            message: "no-action-resource loader works",
          });

          // Ensure this is using RSC
          await page.goto(`http://localhost:${port}/resource-error-handling/`);
          validateRSCHtml(await page.content());
        });
      });

      test.describe("Server Actions", () => {
        test("Supports React Server Functions", async ({ page }) => {
          await page.goto(`http://localhost:${port}/server-action`);

          // Verify initial server render
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home: (0)",
          );

          // Submit the form to trigger server function
          await page.click("[data-submit]");

          // Verify server function updated the UI
          await expect(page.locator("[data-home]")).toHaveText("Home: (1)");

          // Submit again to ensure server functions work repeatedly
          await page.click("[data-submit]");
          await expect(page.locator("[data-home]")).toHaveText("Home: (2)");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports Inline React Server Functions", async ({ page }) => {
          // FIXME: Waiting on parcel support: https://github.com/parcel-bundler/parcel/pull/10165
          test.skip(
            implementation.name === "parcel",
            "Not supported in parcel yet",
          );

          await page.goto(`http://localhost:${port}/inline-server-action/`);

          // Verify initial server render
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home: Default (0)",
          );

          // Submit the form to trigger server function
          await page.click("[data-submit]");

          // Verify server function updated the UI
          await expect(page.locator("[data-home]")).toHaveText(
            "Home: Updated (1)",
          );

          // Submit again to ensure server functions work repeatedly
          await page.click("[data-submit]");
          await expect(page.locator("[data-home]")).toHaveText(
            "Home: Updated (2)",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports React Server Functions thrown redirects", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/throw-redirect-server-action/`,
          );

          // Verify initial server render
          await page.waitForSelector("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 0",
          );
          await page.click("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 1",
          );

          // Submit the form to trigger server function redirect
          await page.click("[data-submit]");

          await expect(page).toHaveURL(
            `http://localhost:${port}/throw-redirect-server-action?redirected=true`,
          );

          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 1",
          );
          // Validate things are still interactive after redirect
          await page.click("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 2",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports React Server Functions side-effect redirects", async ({
          browserName,
          page,
        }) => {
          test.skip(
            browserName !== "chromium",
            "Playwright doesn't like this test outside of chrome for some reason.",
          );

          await page.goto(
            `http://localhost:${port}/side-effect-redirect-server-action`,
          );

          // Verify initial server render
          await page.waitForSelector("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 0",
          );
          await page.click("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 1",
          );

          const responseHeadersPromise = new Promise<Record<string, string>>(
            (resolve) => {
              page.addListener("response", (response) => {
                if (response.request().method() === "POST") {
                  resolve(response.headers());
                }
              });
            },
          );

          // Submit the form to trigger server function redirect
          await page.click("[data-submit]");

          await expect(page.getByTestId("state")).toHaveText("redirected");

          await page.waitForURL(
            `http://localhost:${port}/side-effect-redirect-server-action?redirected=true`,
          );

          expect((await responseHeadersPromise)["x-test"]).toBe("test");

          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 1",
          );
          // Validate things are still interactive after redirect
          await page.click("[data-count]");
          expect(await page.locator("[data-count]").textContent()).toBe(
            "Count: 2",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports React Server Function References", async ({ page }) => {
          await page.goto(`http://localhost:${port}/server-function-reference`);

          // Verify initial server render
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home: (0)",
          );
          await expect(page.locator("[data-home-ref]")).toHaveText("good");

          // Submit the form to trigger server function
          await page.click("[data-submit]");

          // Verify server function updated the UI
          await expect(page.locator("[data-home]")).toHaveText("Home: (1)");
          await expect(page.locator("[data-home-ref]")).toHaveText("good");

          // Submit again to ensure server functions work repeatedly
          await page.click("[data-submit]");
          await expect(page.locator("[data-home]")).toHaveText("Home: (2)");
          await expect(page.locator("[data-home-ref]")).toHaveText("good");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Supports server actions that disable revalidation", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/no-revalidate-server-action`,
            { waitUntil: "networkidle" },
          );

          const actionResponsePromise = new Promise<PlaywrightResponse>(
            (resolve) => {
              page.on("response", async (response) => {
                if (!!(await response.request().headerValue("rsc-action-id"))) {
                  resolve(response);
                }
              });
            },
          );

          await page.click("[data-submit]");
          await page.waitForSelector("[data-state]");
          await page.waitForSelector("[data-pending]", { state: "hidden" });
          await page.waitForSelector("[data-revalidated]", { state: "hidden" });
          expect(await page.locator("[data-state]").textContent()).toBe(
            "no revalidate",
          );

          const actionResponse = await actionResponsePromise;
          expect(await actionResponse.headerValue("x-test")).toBe("test");
        });
      });

      test.describe("Errors", () => {
        test("Handles sanitized production errors in server components correctly", async ({
          page,
        }) => {
          await page.goto(`http://localhost:${port}/sanitized-errors`);

          // Verify error boundary is shown
          await page.waitForSelector("[data-error-title]");
          await page.waitForSelector("[data-error-message]");
          expect(await page.locator("[data-error-message]").textContent()).toBe(
            "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });
      });

      test.describe("Route Client Component Props", () => {
        test("Passes props to client route component", async ({ page }) => {
          await page.goto(
            `http://localhost:${port}/client-route-component-props`,
          );

          // Verify loader data is passed
          await page.waitForSelector("[data-loader-data]");
          expect(await page.locator("[data-loader-data]").textContent()).toBe(
            "Hello from client loader!",
          );

          // Verify params are passed (empty for home route)
          await page.waitForSelector("[data-params]");
          await page.waitForSelector("[data-params-type]");
          await page.waitForSelector("[data-params-count]");
          expect(await page.locator("[data-params-type]").textContent()).toBe(
            "typeof params: object",
          );
          expect(await page.locator("[data-params-count]").textContent()).toBe(
            "params count: 0",
          );

          // Verify matches are passed
          await page.waitForSelector("[data-matches]");
          await page.waitForSelector("[data-matches-ids]");
          expect(await page.locator("[data-matches-ids]").textContent()).toBe(
            "matches ids: root, client-route-component-props",
          );

          // Submit the form to trigger the client action
          await page.fill("[data-name-input]", "World");
          await page.click("[data-submit-button]");

          // Verify the action data is displayed
          await page.waitForSelector("[data-action-data]");
          expect(await page.locator("[data-action-data]").textContent()).toBe(
            "Hello World from client action!",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Passes props to client ErrorBoundary when error is thrown in client loader", async ({
          page,
        }) => {
          await page.goto(
            `http://localhost:${port}/client-error-boundary-props-client-loader`,
          );

          // Verify error boundary is shown
          await page.waitForSelector("[data-error-title]");
          await page.waitForSelector("[data-error-message]");
          expect(await page.locator("[data-error-title]").textContent()).toBe(
            "Error Caught!",
          );
          expect(await page.locator("[data-error-message]").textContent()).toBe(
            "Intentional error from client loader",
          );

          // Verify params are passed to error boundary
          await page.waitForSelector("[data-error-params]");
          await page.waitForSelector("[data-error-params-type]");
          await page.waitForSelector("[data-error-params-count]");
          expect(
            await page.locator("[data-error-params-type]").textContent(),
          ).toBe("typeof params: object");
          expect(
            await page.locator("[data-error-params-count]").textContent(),
          ).toBe("params count: 0");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });

        test("Passes props to client HydrateFallback", async ({ page }) => {
          await page.goto(`http://localhost:${port}/hydrate-fallback-props`);

          // Verify the hydrate fallback is shown initially
          await page.waitForSelector("[data-hydrate-fallback]");
          expect(
            await page.locator("[data-hydrate-fallback]").textContent(),
          ).toBe("Hydrate Fallback");

          // Verify params are passed to hydrate fallback
          await page.waitForSelector("[data-hydrate-params]");
          await page.waitForSelector("[data-hydrate-params-type]");
          await page.waitForSelector("[data-hydrate-params-count]");
          expect(
            await page.locator("[data-hydrate-params-type]").textContent(),
          ).toBe("typeof params: object");
          expect(
            await page.locator("[data-hydrate-params-count]").textContent(),
          ).toBe("params count: 0");

          // Unblock the client loader to allow it to complete
          await page.evaluate(() => {
            (globalThis as any).unblockClientLoader = true;
          });

          await page.waitForSelector("[data-home]");

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });
      });
    });

    test.describe("Basename", () => {
      let basename = "/custom/basename" as const;

      let port: number;
      let stopAfterAll: () => void;

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test.beforeAll(async () => {
        port = await getPort();
        stopAfterAll = await setupRscTest({
          implementation,
          port,
          files: {
            "src/config/basename.ts": js`
              // THIS FILE OVERRIDES THE DEFAULT IMPLEMENTATION
              export const basename = ${JSON.stringify(basename)};
            `,
            "src/routes.ts": js`
              import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

              export const routes = [
                {
                  id: "root",
                  path: "",
                  lazy: () => import("./routes/root"),
                  children: [
                    {
                      id: "basic",
                      path: "basic",
                      lazy: () => import("./routes/basic/home"),
                    },
                    {
                      id: "server-redirects",
                      path: "server-redirects",
                      children: [
                        {
                          id: "server-redirects.home",
                          path: "home",
                          lazy: () => import("./routes/server-redirects/home"),
                        },
                        {
                          id: "server-redirects.redirect",
                          path: "redirect",
                          lazy: () => import("./routes/server-redirects/redirect"),
                        },
                        {
                          id: "server-redirects.target",
                          path: "target",
                          lazy: () => import("./routes/server-redirects/target"),
                        },
                      ]
                    },
                    {
                      id: "action-redirects",
                      path: "action-redirects",
                      children: [
                        {
                          id: "action-redirects.action-redirect",
                          path: "action-redirect",
                          lazy: () => import("./routes/action-redirects/action-redirect"),
                        },
                        {
                          id: "action-redirects.target",
                          path: "target",
                          lazy: () => import("./routes/action-redirects/target"),
                        },
                      ]
                    },
                    {
                      id: "server-action-redirects",
                      path: "server-action-redirects",
                      children: [
                        {
                          id: "server-action-redirects.home",
                          index: true,
                          lazy: () => import("./routes/server-action-redirects/home"),
                        },
                        {
                          id: "server-action-redirects.redirect",
                          path: "redirect",
                          lazy: () => import("./routes/server-action-redirects/redirect"),
                        },
                        {
                          id: "server-action-redirects.target",
                          path: "target",
                          lazy: () => import("./routes/server-action-redirects/target"),
                        },
                      ]
                    }
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/basic/home.tsx": js`
              export function loader() {
                return { message: "Loader Data" };
              }
              export default function HomeRoute({ loaderData }) {
                return <h2 data-home>Home: {loaderData.message}</h2>;
              }
            `,

            "src/routes/server-redirects/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/server-redirects/redirect" data-link-to-redirect>
                      Go to redirect route
                    </Link>
                  </div>
                );
              }
            `,
            "src/routes/server-redirects/redirect.tsx": js`
              import { redirect } from "react-router";

              export function loader() {
                throw redirect("/server-redirects/target");
              }

              export default function RedirectRoute() {
                return <h2>This should not be rendered</h2>;
              }
            `,
            "src/routes/server-redirects/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,

            "src/routes/action-redirects/action-redirect.tsx": js`
              import { redirect } from "react-router";

              export async function action({ request }) {
                // Redirect to target when form is submitted
                throw redirect("/action-redirects/target");
              }

              export default function ActionRedirectRoute() {
                return (
                  <div>
                    <h2 data-action-redirect>Action Redirect Route</h2>
                    <form method="post">
                      <button type="submit" data-submit-action>
                        Submit to trigger redirect
                      </button>
                    </form>
                  </div>
                );
              }
            `,
            "src/routes/action-redirects/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,

            "src/routes/server-action-redirects/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/server-action-redirects/redirect" data-link-to-redirect>
                      Go to server action redirect route
                    </Link>
                  </div>
                );
              }
            `,
            "src/routes/server-action-redirects/redirect.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction(formData: FormData) {
                throw redirect("/server-action-redirects/target");
              }
            `,
            "src/routes/server-action-redirects/redirect.tsx": js`
              export { default } from "./redirect.client";
            `,
            "src/routes/server-action-redirects/redirect.client.tsx": js`
              "use client";

              import { useActionState } from "react";
              import { redirectAction } from "./redirect.actions";

              export default function RedirectRoute() {
                const [state, formAction, isPending] = useActionState(redirectAction, null);

                return (
                  <div>
                    <h2 data-redirect>Server Action Redirect Route</h2>
                    <form action={formAction}>
                      <button type="submit" data-submit-action disabled={isPending}>
                        {isPending ? "Redirecting..." : "Redirect to Target"}
                      </button>
                    </form>
                  </div>
                );
              }
            `,
            "src/routes/server-action-redirects/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });
      });

      test("Renders a page with a custom basename", async ({ page }) => {
        await page.goto(`http://localhost:${port}${basename}/basic`);
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Loader Data",
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Handles server-side redirects with basename", async ({ page }) => {
        // Navigate directly to redirect route with basename
        await page.goto(
          `http://localhost:${port}${basename}/server-redirects/redirect`,
        );

        // Should be redirected to target route
        await page.waitForURL(
          `http://localhost:${port}${basename}/server-redirects/target`,
        );
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route",
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Handles server-side redirects in route actions with basename", async ({
        page,
      }) => {
        // Navigate to action redirect route with basename
        await page.goto(
          `http://localhost:${port}${basename}/action-redirects/action-redirect`,
        );
        await page.waitForSelector("[data-action-redirect]");
        expect(await page.locator("[data-action-redirect]").textContent()).toBe(
          "Action Redirect Route",
        );

        // Mutate the window object so we can check if the navigation occurred
        // within the same browser context
        await page.evaluate(() => {
          // @ts-expect-error
          window.__isWithinSameBrowserContext = true;
        });

        // Submit the form to trigger the action redirect
        await page.click("[data-submit-action]");

        // Should be redirected to target route
        await page.waitForURL(
          `http://localhost:${port}${basename}/action-redirects/target`,
        );
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route",
        );

        // Ensure a document navigation occurred
        expect(
          await page.evaluate(() => {
            // @ts-expect-error
            return window.__isWithinSameBrowserContext;
          }),
        ).not.toBe(true);

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports redirects in server actions with basename", async ({
        page,
      }) => {
        // Start on home route
        await page.goto(
          `http://localhost:${port}${basename}/server-action-redirects`,
        );
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home Route",
        );

        // Navigate to redirect route via client navigation
        await page.click("[data-link-to-redirect]");
        await page.waitForSelector("[data-redirect]");
        expect(await page.locator("[data-redirect]").textContent()).toBe(
          "Server Action Redirect Route",
        );

        // Submit the form to trigger server action redirect
        await page.click("[data-submit-action]");

        // Should be redirected to target route
        await page.waitForURL(
          `http://localhost:${port}${basename}/server-action-redirects/target`,
        );
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route",
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test.describe("Without JavaScript", () => {
        test.use({ javaScriptEnabled: false });
        test("Supports redirects in server actions without JavaScript with basename", async ({
          page,
        }) => {
          test.skip(implementation.name === "parcel", "Not working in parcel?");

          // Start on home route
          await page.goto(
            `http://localhost:${port}${basename}/server-action-redirects`,
          );
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home Route",
          );

          // Navigate to redirect route via client navigation
          await page.click("[data-link-to-redirect]");
          await page.waitForSelector("[data-redirect]");
          expect(await page.locator("[data-redirect]").textContent()).toBe(
            "Server Action Redirect Route",
          );

          // Submit the form to trigger server action redirect
          await page.click("[data-submit-action]");

          // Should be redirected to target route
          await page.waitForURL(
            `http://localhost:${port}${basename}/server-action-redirects/target`,
          );
          await page.waitForSelector("[data-target]");
          expect(await page.locator("[data-target]").textContent()).toBe(
            "Target Route",
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });
      });
    });
  });
});
