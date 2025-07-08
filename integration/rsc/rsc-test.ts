import { test, expect } from "@playwright/test";
import { sync as spawnSync } from "cross-spawn";
import getPort from "get-port";

import {
  type TemplateName,
  createDev,
  createProject,
} from "../helpers/vite.js";

const js = String.raw;

type Implementation = {
  name: string;
  template: TemplateName;
  /** Build a production app */
  build: ({ cwd }: { cwd: string }) => ReturnType<typeof spawnSync>;
  /** Run a production app */
  run: ({ cwd, port }: { cwd: string; port: number }) => Promise<() => void>;
  /** Run the dev server */
  dev: ({ cwd, port }: { cwd: string; port: number }) => Promise<() => void>;
};

// Run tests against vite and parcel to ensure our code is bundler agnostic
const implementations: Implementation[] = [
  {
    name: "vite",
    template: "rsc-vite",
    build: ({ cwd }: { cwd: string }) => spawnSync("pnpm", ["build"], { cwd }),
    run: ({ cwd, port }) =>
      createDev(["server.js", "-p", String(port)])({
        cwd,
        port,
        env: {
          NODE_ENV: "production",
        },
      }),
    dev: ({ cwd, port }) =>
      createDev(["node_modules/vite/bin/vite.js", "--port", String(port)])({
        cwd,
        port,
      }),
  },
  {
    name: "parcel",
    template: "rsc-parcel",
    build: ({ cwd }: { cwd: string }) => spawnSync("pnpm", ["build"], { cwd }),
    run: ({ cwd, port }) =>
      // FIXME: Parcel prod builds seems to have dup copies of react in them :/
      // Not reproducible in the playground though - only in integration/helpers...
      implementations.find((i) => i.name === "parcel")!.dev({ cwd, port }),
    dev: ({ cwd, port }) =>
      createDev(["node_modules/parcel/lib/bin.js"])({
        // Since we run through parcels dev server we can't use `-p` because that
        // only changes the dev server and doesn't pass through to the internal
        // server.  So we setup the internal server to choose from `RR_PORT`
        env: { RR_PORT: String(port) },
        cwd,
        port,
      }),
  },
] as Implementation[];

async function setupRscTest({
  implementation,
  port,
  dev,
  files,
}: {
  implementation: Implementation;
  port: number;
  dev?: boolean;
  files: Record<string, string>;
}) {
  let cwd = await createProject(files, implementation.template);

  let { error, status, stderr, stdout } = implementation.build({ cwd });
  if (status !== 0) {
    console.error("Error building project", {
      status,
      error,
      stdout: stdout?.toString(),
      stderr: stderr?.toString(),
    });
    throw new Error("Error building project");
  }
  return dev
    ? implementation.dev({ cwd, port })
    : implementation.run({ cwd, port });
}

const validateRSCHtml = (html: string) =>
  expect(html).toMatch(/\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(/);

implementations.forEach((implementation) => {
  let stop: () => void;

  test.afterEach(() => {
    stop?.();
  });

  test.describe(`RSC (${implementation.name})`, () => {
    test.describe("Basic functionality", () => {
      test("Renders a page using server components", async ({ page }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.tsx": js`
              export function loader() {
                return { message: "Loader Data" };
              }
              export default function HomeRoute({ loaderData }) {
                return <h2 data-home>Home: {loaderData.message}</h2>;
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}/`);
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Loader Data"
        );

        // Ensure this is actually using RSC lol
        validateRSCHtml(await page.content());
      });

      test("Works with client components using 'use client'", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.tsx": js`
              import { ClientCounter } from "./home.client";

              export function loader() {
                return { message: "Loader Data" };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h2 data-home>Home: {loaderData.message}</h2>
                    <ClientCounter />
                  </div>
                );
              }
            `,
            "src/routes/home.client.tsx": js`
              "use client";

              import { useState } from "react";

              export function ClientCounter() {
                const [count, setCount] = useState(0);

                return (
                  <div data-testid="client-component">
                    <p data-count>{count}</p>
                    <button
                      data-increment
                      onClick={() => setCount(c => c + 1)}
                    >
                      Increment
                    </button>
                  </div>
                );
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify server component rendered
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Loader Data"
        );

        // Verify client component rendered
        await page.waitForSelector("[data-testid=client-component]");
        expect(await page.locator("[data-count]").textContent()).toBe("0");

        // Test interactivity of client component
        await page.click("[data-increment]");
        expect(await page.locator("[data-count]").textContent()).toBe("1");

        // Click again to ensure it's truly interactive
        await page.click("[data-increment]");
        expect(await page.locator("[data-count]").textContent()).toBe("2");

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports navigating between server-first/client-first routes starting on a server route", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "dashboard",
                      path: "dashboard",
                      lazy: () => import("./routes/dashboard"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export function loader() {
                return { message: "Home Page Data" };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h1 data-page="home">Home Page</h1>
                    <p data-content>{loaderData.message}</p>
                    <Link to="/dashboard">Dashboard</Link>
                  </div>
                );
              }
            `,
            "src/routes/dashboard.tsx": js`
              export function loader() {
                return { count: 1 };
              }

              export { default } from "./dashboard.client";
            `,
            "src/routes/dashboard.client.tsx": js`
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

                    <Link to="/">Home</Link>
                  </div>
                );
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Load a server route
        await page.waitForSelector("[data-page=home]");
        expect(await page.locator("[data-content]").textContent()).toBe(
          "Home Page Data"
        );

        // Navigate to a client route
        await page.click("a[href='/dashboard']");
        await page.waitForSelector("[data-page=dashboard]");

        // Verify server data
        expect(await page.locator("[data-server-count]").textContent()).toBe(
          "Server count: 1"
        );
        expect(await page.locator("[data-client-count]").textContent()).toBe(
          "Client count: 1"
        );

        // Increment via the client component
        await page.click("[data-increment]");
        expect(await page.locator("[data-server-count]").textContent()).toBe(
          "Server count: 1"
        );
        expect(await page.locator("[data-client-count]").textContent()).toBe(
          "Client count: 2"
        );

        // Navigate back to a server route
        await page.click("a[href='/']");
        await page.waitForSelector("[data-page=home]");
        expect(await page.locator("[data-content]").textContent()).toBe(
          "Home Page Data"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports navigating between server-first/client-first routes starting on a client route", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "dashboard",
                      path: "dashboard",
                      lazy: () => import("./routes/dashboard"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export function loader() {
                return { message: "Home Page Data" };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h1 data-page="home">Home Page</h1>
                    <p data-content>{loaderData.message}</p>
                    <Link to="/dashboard">Dashboard</Link>
                  </div>
                );
              }
            `,
            "src/routes/dashboard.tsx": js`
              export function loader() {
                return { count: 1 };
              }

              export { Dashboard as Component } from "./dashboard.client";
            `,
            "src/routes/dashboard.client.tsx": js`
              "use client";

              import { useState } from "react";
              import { Link } from "react-router";

              // Export the entire route as a client component
              export function Dashboard({ loaderData }) {
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

                    <Link to="/">Home</Link>
                  </div>
                );
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}/dashboard`);
        await page.waitForSelector("[data-page=dashboard]");

        // Verify server data
        expect(await page.locator("[data-server-count]").textContent()).toBe(
          "Server count: 1"
        );
        expect(await page.locator("[data-client-count]").textContent()).toBe(
          "Client count: 1"
        );

        // Increment via the client component
        await page.click("[data-increment]");
        expect(await page.locator("[data-server-count]").textContent()).toBe(
          "Server count: 1"
        );
        expect(await page.locator("[data-client-count]").textContent()).toBe(
          "Client count: 2"
        );

        // Navigate to a server route
        await page.click("a[href='/']");
        await page.waitForSelector("[data-page=home]");
        expect(await page.locator("[data-content]").textContent()).toBe(
          "Home Page Data"
        );

        // Navigate back to a client route
        await page.click("a[href='/dashboard']");
        await page.waitForSelector("[data-page=dashboard]");
        expect(await page.locator("[data-server-count]").textContent()).toBe(
          "Server count: 1"
        );
        expect(await page.locator("[data-client-count]").textContent()).toBe(
          "Client count: 1"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports resource routes as URL and fetchers", async ({
        page,
        request,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                  ],
                },
                {
                  id: "resource",
                  path: "resource",
                  lazy: () => import("./routes/resource"),
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/resource.tsx": js`
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
            "src/routes/home.client.tsx": js`
              "use client";

              import { useFetcher } from "react-router";

              export function ResourceFetcher() {
                const fetcher = useFetcher();

                const loadResource = () => {
                  fetcher.submit({ hello: "world" }, { method: "post", action: "/resource" });
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
            "src/routes/home.tsx": js`
              import { ResourceFetcher } from "./home.client";
              
              export default function HomeRoute() {
                return <ResourceFetcher />;
              }
            `,
          },
        });
        const getResponse = await request.get(
          `http://localhost:${port}/resource`
        );
        expect(getResponse?.status()).toBe(200);
        expect(await getResponse?.json()).toEqual({
          message: "Hello from resource route!",
        });

        const postResponse = await request.post(
          `http://localhost:${port}/resource`,
          {
            data: { hello: "world" },
          }
        );
        expect(postResponse?.status()).toBe(200);
        expect(await postResponse?.json()).toEqual({
          message: "Hello from resource route!",
          echo: JSON.stringify({ hello: "world" }),
        });

        await page.goto(`http://localhost:${port}/`);
        await page.click("button");

        await page.waitForSelector("[data-testid=resource-data]");
        expect(
          await page.locator("[data-testid=resource-data]").textContent()
        ).toBe(
          JSON.stringify({
            message: "Hello from resource route!",
            echo: "hello=world",
          })
        );
      });
    });

    test.describe("Server Actions", () => {
      test("Supports React Server Functions", async ({ page }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.actions.ts": js`
              "use server";

              export async function incrementCounter(count: number, formData: FormData) {
                return count + parseInt(formData.get("by") as string || "1", 10);
              }
            `,
            "src/routes/home.tsx": js`
              export { default } from "./home.client";
            `,
            "src/routes/home.client.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify initial server render
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: (0)"
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
          "Not supported in parcel yet"
        );

        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify initial server render
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Default (0)"
        );

        // Submit the form to trigger server function
        await page.click("[data-submit]");

        // Verify server function updated the UI
        await expect(page.locator("[data-home]")).toHaveText(
          "Home: Updated (1)"
        );

        // Submit again to ensure server functions work repeatedly
        await page.click("[data-submit]");
        await expect(page.locator("[data-home]")).toHaveText(
          "Home: Updated (2)"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports React Server Functions thrown redirects", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction(formData: FormData) {
                throw redirect("/?redirected=true");
              }
            `,
            "src/routes/home.client.tsx": js`
              "use client";
              import { useState } from "react";

              export function Counter() {
                const [count, setCount] = useState(0);
                return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
              }
            `,
            "src/routes/home.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify initial server render
        await page.waitForSelector("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 0"
        );
        await page.click("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 1"
        );

        // Submit the form to trigger server function redirect
        await page.click("[data-submit]");

        await expect(page).toHaveURL(
          `http://localhost:${port}/?redirected=true`
        );

        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 1"
        );
        // Validate things are still interactive after redirect
        await page.click("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 2"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports React Server Functions side-effect redirects", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction() {
                redirect("/?redirected=true");
                return "redirected";
              }
            `,
            "src/routes/home.client.tsx": js`
              "use client";
              import { useState } from "react";

              export function Counter() {
                const [count, setCount] = useState(0);
                return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
              }
            `,
            "src/routes/home.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify initial server render
        await page.waitForSelector("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 0"
        );
        await page.click("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 1"
        );

        // Submit the form to trigger server function redirect
        await page.click("[data-submit]");

        await expect(page.getByTestId("state")).toHaveText("redirected");

        await page.waitForURL(`http://localhost:${port}/?redirected=true`);

        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 1"
        );
        // Validate things are still interactive after redirect
        await page.click("[data-count]");
        expect(await page.locator("[data-count]").textContent()).toBe(
          "Count: 2"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports React Server Function References", async ({ page }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.actions.ts": js`
              "use server";

              export async function incrementCounter({count, ref}: {count: number; ref: unknown}, formData: FormData) {
                return {count: count + parseInt(formData.get("by") as string || "1", 10), ref};
              }
            `,
            "src/routes/home.tsx": js`
              export { default } from "./home.client";
            `,
            "src/routes/home.client.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify initial server render
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: (0)"
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
    });

    test.describe("Basename", () => {
      test("Renders a page with a custom basename", async ({ page }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/config/basename.ts": js`
              // THIS FILE OVERRIDES THE DEFAULT IMPLEMENTATION
              export const basename = ${JSON.stringify(basename)};
            `,
            "src/routes/home.tsx": js`
              export function loader() {
                return { message: "Loader Data" };
              }
              export default function HomeRoute({ loaderData }) {
                return <h2 data-home>Home: {loaderData.message}</h2>;
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}${basename}`);
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Loader Data"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Handles server-side redirects with basename", async ({ page }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "redirect",
                      path: "redirect",
                      lazy: () => import("./routes/redirect"),
                    },
                    {
                      id: "target",
                      path: "target",
                      lazy: () => import("./routes/target"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/redirect" data-link-to-redirect>
                      Go to redirect route
                    </Link>
                  </div>
                );
              }
            `,
            "src/routes/redirect.tsx": js`
              import { redirect } from "react-router";

              export function loader() {
                throw redirect("/target");
              }

              export default function RedirectRoute() {
                return <h2>This should not be rendered</h2>;
              }
            `,
            "src/routes/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });

        // Navigate directly to redirect route with basename
        await page.goto(`http://localhost:${port}${basename}redirect`);

        // Should be redirected to target route
        await page.waitForURL(`http://localhost:${port}${basename}target`);
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Handles server-side redirects in route actions with basename", async ({
        page,
      }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "action-redirect",
                      path: "action-redirect",
                      lazy: () => import("./routes/action-redirect"),
                    },
                    {
                      id: "target",
                      path: "target",
                      lazy: () => import("./routes/target"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/action-redirect" data-link-to-action-redirect>Go to action redirect route</Link>
                  </div>
                );
              }
            `,
            "src/routes/action-redirect.tsx": js`
              import { redirect } from "react-router";

              export async function action({ request }) {
                // Redirect to target when form is submitted
                throw redirect("/target");
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
            "src/routes/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });

        // Navigate to action redirect route with basename
        await page.goto(`http://localhost:${port}${basename}action-redirect`);
        await page.waitForSelector("[data-action-redirect]");
        expect(await page.locator("[data-action-redirect]").textContent()).toBe(
          "Action Redirect Route"
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
        await page.waitForURL(`http://localhost:${port}${basename}target`);
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route"
        );

        // Ensure a document navigation occurred
        expect(
          await page.evaluate(() => {
            // @ts-expect-error
            return window.__isWithinSameBrowserContext;
          })
        ).not.toBe(true);

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports redirects on client navigations with basename", async ({
        page,
      }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "redirect",
                      path: "redirect",
                      lazy: () => import("./routes/redirect"),
                    },
                    {
                      id: "target",
                      path: "target",
                      lazy: () => import("./routes/target"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/redirect" data-link-to-redirect>
                      Go to redirect route
                    </Link>
                  </div>
                );
              }
            `,
            "src/routes/redirect.tsx": js`
              import { redirect } from "react-router";

              export function loader() {
                throw redirect("/target");
              }

              export default function RedirectRoute() {
                return <h2>This should not be rendered</h2>;
              }
            `,
            "src/routes/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });

        // Navigate to home route with basename
        await page.goto(`http://localhost:${port}${basename}`);
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home Route"
        );

        // Click link to redirect route
        await page.click("[data-link-to-redirect]");

        // Should be redirected to target route
        await page.waitForURL(`http://localhost:${port}${basename}target`);
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports redirects in route actions on client navigations with basename", async ({
        page,
      }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "action-redirect",
                      path: "action-redirect",
                      lazy: () => import("./routes/action-redirect"),
                    },
                    {
                      id: "target",
                      path: "target",
                      lazy: () => import("./routes/target"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/action-redirect" data-link-to-action-redirect>Go to action redirect route</Link>
                  </div>
                );
              }
            `,
            "src/routes/action-redirect.tsx": js`
              import { Form, redirect } from "react-router";

              export async function action({ request }) {
                // Redirect to target when form is submitted
                throw redirect("/target");
              }

              export default function ActionRedirectRoute() {
                return (
                  <div>
                    <h2 data-action-redirect>Action Redirect Route</h2>
                    <Form method="post">
                      <button type="submit" data-submit-action>
                        Submit to trigger redirect
                      </button>
                    </Form>
                  </div>
                );
              }
            `,
            "src/routes/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });

        // Navigate to action redirect route with basename
        await page.goto(`http://localhost:${port}${basename}action-redirect`);
        await page.waitForSelector("[data-action-redirect]");
        expect(await page.locator("[data-action-redirect]").textContent()).toBe(
          "Action Redirect Route"
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
        await page.waitForURL(`http://localhost:${port}${basename}target`);
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route"
        );

        // Ensure a client-side navigation occurred
        expect(
          await page.evaluate(() => {
            // @ts-expect-error
            return window.__isWithinSameBrowserContext;
          })
        ).toBe(true);

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("Supports redirects in server actions with basename", async ({
        page,
      }) => {
        let port = await getPort();
        let basename = "/custom/basename/";
        stop = await setupRscTest({
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
                      id: "home",
                      index: true,
                      lazy: () => import("./routes/home"),
                    },
                    {
                      id: "redirect",
                      path: "redirect",
                      lazy: () => import("./routes/redirect"),
                    },
                    {
                      id: "target",
                      path: "target",
                      lazy: () => import("./routes/target"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,
            "src/routes/home.tsx": js`
              import { Link } from "react-router";

              export default function HomeRoute() {
                return (
                  <div>
                    <h2 data-home>Home Route</h2>
                    <Link to="/redirect" data-link-to-redirect>
                      Go to server action redirect route
                    </Link>
                  </div>
                );
              }
            `,
            "src/routes/redirect.actions.ts": js`
              "use server";
              import { redirect } from "react-router";

              export async function redirectAction(formData: FormData) {
                throw redirect("/target");
              }
            `,
            "src/routes/redirect.tsx": js`
              export { default } from "./redirect.client";
            `,
            "src/routes/redirect.client.tsx": js`
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
            "src/routes/target.tsx": js`
              export default function TargetRoute() {
                return <h2 data-target>Target Route</h2>;
              }
            `,
          },
        });

        // Start on home route
        await page.goto(`http://localhost:${port}${basename}`);
        await page.waitForSelector("[data-home]");
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home Route"
        );

        // Navigate to redirect route via client navigation
        await page.click("[data-link-to-redirect]");
        await page.waitForSelector("[data-redirect]");
        expect(await page.locator("[data-redirect]").textContent()).toBe(
          "Server Action Redirect Route"
        );

        // Submit the form to trigger server action redirect
        await page.click("[data-submit-action]");

        // Should be redirected to target route
        await page.waitForURL(`http://localhost:${port}${basename}target`);
        await page.waitForSelector("[data-target]");
        expect(await page.locator("[data-target]").textContent()).toBe(
          "Target Route"
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

          let port = await getPort();
          let basename = "/custom/basename/";
          stop = await setupRscTest({
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
                        id: "home",
                        index: true,
                        lazy: () => import("./routes/home"),
                      },
                      {
                        id: "redirect",
                        path: "redirect",
                        lazy: () => import("./routes/redirect"),
                      },
                      {
                        id: "target",
                        path: "target",
                        lazy: () => import("./routes/target"),
                      },
                    ],
                  },
                ] satisfies RSCRouteConfig;
              `,
              "src/routes/home.tsx": js`
                import { Link } from "react-router";

                export default function HomeRoute() {
                  return (
                    <div>
                      <h2 data-home>Home Route</h2>
                      <Link to="/redirect" data-link-to-redirect>
                        Go to server action redirect route
                      </Link>
                    </div>
                  );
                }
              `,
              "src/routes/redirect.actions.ts": js`
                "use server";
                import { redirect } from "react-router";

                export async function redirectAction(formData: FormData) {
                  throw redirect("/target");
                }
              `,
              "src/routes/redirect.tsx": js`
                export { default } from "./redirect.client";
              `,
              "src/routes/redirect.client.tsx": js`
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
              "src/routes/target.tsx": js`
                export default function TargetRoute() {
                  return <h2 data-target>Target Route</h2>;
                }
              `,
            },
          });

          // Start on home route
          await page.goto(`http://localhost:${port}${basename}`);
          await page.waitForSelector("[data-home]");
          expect(await page.locator("[data-home]").textContent()).toBe(
            "Home Route"
          );

          // Navigate to redirect route
          await page.click("[data-link-to-redirect]");
          await page.waitForSelector("[data-redirect]");
          expect(await page.locator("[data-redirect]").textContent()).toBe(
            "Server Action Redirect Route"
          );

          // Submit the form to trigger server action redirect
          await page.click("[data-submit-action]");

          // Should be redirected to target route
          await page.waitForURL(`http://localhost:${port}${basename}target`);
          await page.waitForSelector("[data-target]");
          expect(await page.locator("[data-target]").textContent()).toBe(
            "Target Route"
          );

          // Ensure this is using RSC
          validateRSCHtml(await page.content());
        });
      });
    });

    test.describe("Errors", () => {
      test("Handles errors in server components correctly", async ({
        page,
      }) => {
        let port = await getPort();
        stop = await setupRscTest({
          dev: true,
          implementation,
          port,
          files: {
            "src/routes/home.tsx": js`
              export function loader() {
                throw new Error("Intentional error from loader");
              }

              export default function HomeRoute() {
                return <h2>This should not be rendered</h2>;
              }

              export { ErrorBoundary } from "./home.client";
            `,
            "src/routes/home.client.tsx": js`
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
          },
        });

        await page.goto(`http://localhost:${port}/`);

        // Verify error boundary is shown
        await page.waitForSelector("[data-error-title]");
        await page.waitForSelector("[data-error-message]");
        expect(await page.locator("[data-error-message]").textContent()).toBe(
          "Intentional error from loader"
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });
    });
  });
});
