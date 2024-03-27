import { test, expect } from "@playwright/test";
import type { Readable } from "node:stream";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import getPort from "get-port";
import waitOn from "wait-on";

import { createFixtureProject, js } from "./helpers/create-fixture.js";
import { killtree } from "./helpers/killtree.js";

test.describe("Vite dev", () => {
  let projectDir: string;
  let devProc: ChildProcessWithoutNullStreams;
  let devPort: number;

  test.beforeAll(async () => {
    devPort = await getPort();
    projectDir = await createFixtureProject({
      compiler: "vite",
      files: {
        "remix.config.js": js`
          throw new Error("Remix should not access remix.config.js when using Vite");
          export default {};
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { vitePlugin as remix } from "@remix-run/dev";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            server: {
              port: ${devPort},
              strictPort: true,
            },
            plugins: [
              mdx(),
              remix(),
            ],
          });
        `,
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <div id="content">
                    <h1>Root</h1>
                    <Outlet />
                  </div>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          import { Suspense } from "react";
          import { defer } from "@remix-run/node";
          import { Await, useLoaderData } from "@remix-run/react";

          export function loader() {
            let deferred = new Promise((resolve) => {
              setTimeout(() => resolve(true), 1000)
            });
            return defer({ deferred });
          }

          export default function IndexRoute() {
            const { deferred } = useLoaderData<typeof loader>();

            return (
              <div id="index">
                <h2 data-title>Index</h2>
                <input />
                <p data-hmr>HMR updated: no</p>
                <Suspense fallback={<p data-defer>Defer finished: no</p>}>
                  <Await resolve={deferred}>{() => <p data-defer>Defer finished: yes</p>}</Await>
                </Suspense>
              </div>
            );
          }
        `,
        "app/routes/set-cookies.tsx": js`
          import { LoaderFunction } from "@remix-run/node";

          export const loader: LoaderFunction = () => {
            const headers = new Headers();

            headers.append(
              "Set-Cookie",
              "first=one; Domain=localhost; Path=/; SameSite=Lax"
            );

            headers.append(
              "Set-Cookie",
              "second=two; Domain=localhost; Path=/; SameSite=Lax"
            );

            headers.append(
              "Set-Cookie",
              "third=three; Domain=localhost; Path=/; SameSite=Lax"
            );

            headers.set("location", "http://localhost:${devPort}/get-cookies");

            const response = new Response(null, {
              headers,
              status: 302,
            });

            return response;
          };
        `,
        "app/routes/get-cookies.tsx": js`
          import { json, LoaderFunctionArgs } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react"

          export const loader = ({ request }: LoaderFunctionArgs) => json({cookies: request.headers.get("Cookie")});

          export default function IndexRoute() {
            const { cookies } = useLoaderData<typeof loader>();

            return (
              <div id="get-cookies">
                <h2 data-title>Get Cookies</h2>
                <p data-cookies>{cookies}</p>
              </div>
            );
          }
        `,
        "app/routes/jsx.jsx": js`
          export default function JsxRoute() {
            return (
              <div id="jsx">
                <p data-hmr>HMR updated: no</p>
              </div>
            );
          }
        `,
        "app/routes/mdx.mdx": js`
          import { json } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react";

          export const loader = () => {
            return json({
              content: "MDX route content from loader",
            })
          }

          export function MdxComponent() {
            const { content } = useLoaderData();
            return <div data-mdx-route>{content}</div>
          }

          ## MDX Route

          <MdxComponent />
        `,
        ".env": `
          ENV_VAR_FROM_DOTENV_FILE=Content from .env file
        `,
        "app/routes/dotenv.tsx": js`
          import { useState, useEffect } from "react";
          import { json } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react";

          export const loader = () => {
            return json({
              loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE,
            })
          }

          export default function DotenvRoute() {
            const { loaderContent } = useLoaderData();

            const [clientContent, setClientContent] = useState('');
            useEffect(() => {
              try {
                setClientContent("process.env.ENV_VAR_FROM_DOTENV_FILE shouldn't be available on the client, found: " + process.env.ENV_VAR_FROM_DOTENV_FILE);
              } catch (err) {
                setClientContent("process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing");
              }
            }, []);

            return <>
              <div data-dotenv-route-loader-content>{loaderContent}</div>
              <div data-dotenv-route-client-content>{clientContent}</div>
            </>
          }
        `,
        "app/routes/error-stacktrace.tsx": js`
          import type { LoaderFunction, MetaFunction } from "@remix-run/node";
          import { Link, useLocation } from "@remix-run/react";

          export const loader: LoaderFunction = ({ request }) => {
            if (request.url.includes("crash-loader")) {
              throw new Error("crash-loader");
            }
            return null;
          };

          export default function TestRoute() {
            const location = useLocation();

            if (import.meta.env.SSR && location.search.includes("crash-server-render")) {
              throw new Error("crash-server-render");
            }

            return (
              <div>
                <ul>
                  {["crash-loader", "crash-server-render"].map(
                    (v) => (
                      <li key={v}>
                        <Link to={"/?" + v}>{v}</Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            );
          }
        `,
        "app/routes/known-route-exports.tsx": js`
          import { useMatches } from "@remix-run/react";

          export const meta = () => [{
            title: "HMR meta: 0"
          }]

          export const links = () => [{
            rel: "icon",
            href: "/favicon.ico",
            type: "image/png",
            "data-link": "HMR links: 0",
          }]

          export const handle = {
            data: "HMR handle: 0"
          };

          export default function TestRoute() {
            const matches = useMatches();

            return (
              <div id="known-route-export-hmr">
                <input />
                <p data-hmr>HMR component: 0</p>
                <p data-handle>{matches[1].handle.data}</p>
              </div>
            );
          }
        `,
      },
    });

    let nodeBin = process.argv[0];
    let remixBin = "node_modules/@remix-run/dev/dist/cli.js";
    devProc = spawn(nodeBin, [remixBin, "vite:dev"], {
      cwd: projectDir,
      env: process.env,
      stdio: "pipe",
    });
    let devStdout = bufferize(devProc.stdout);
    let devStderr = bufferize(devProc.stderr);

    await waitOn({
      resources: [`http://localhost:${devPort}/`],
      timeout: 10000,
    }).catch((err) => {
      let stdout = devStdout();
      let stderr = devStderr();
      throw new Error(
        [
          err.message,
          "",
          "exit code: " + devProc.exitCode,
          "stdout: " + stdout ? `\n${stdout}\n` : "<empty>",
          "stderr: " + stderr ? `\n${stderr}\n` : "<empty>",
        ].join("\n")
      );
    });
  });

  test.afterAll(async () => {
    devProc.pid && (await killtree(devProc.pid));
  });

  test("renders matching routes", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/`, {
      waitUntil: "networkidle",
    });

    // Ensure no errors on page load
    expect(pageErrors).toEqual([]);

    await expect(page.locator("#index [data-title]")).toHaveText("Index");
    await expect(page.locator("#index [data-defer]")).toHaveText(
      "Defer finished: yes"
    );

    let hmrStatus = page.locator("#index [data-hmr]");
    await expect(hmrStatus).toHaveText("HMR updated: no");

    let input = page.locator("#index input");
    await expect(input).toBeVisible();
    await input.type("stateful");

    let indexRouteContents = await fs.readFile(
      path.join(projectDir, "app/routes/_index.tsx"),
      "utf8"
    );
    await fs.writeFile(
      path.join(projectDir, "app/routes/_index.tsx"),
      indexRouteContents.replace("HMR updated: no", "HMR updated: yes"),
      "utf8"
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("HMR updated: yes");
    await expect(input).toHaveValue("stateful");

    // Ensure no errors after HMR
    expect(pageErrors).toEqual([]);
  });

  test("handles multiple set-cookie headers", async ({ page }) => {
    let pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/set-cookies`, {
      waitUntil: "networkidle",
    });

    expect(pageErrors).toEqual([]);

    // Ensure we redirected
    expect(new URL(page.url()).pathname).toBe("/get-cookies");

    await expect(page.locator("#get-cookies [data-cookies]")).toHaveText(
      "first=one; second=two; third=three"
    );
  });

  test("handles JSX in .jsx file without React import", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/jsx`, {
      waitUntil: "networkidle",
    });
    expect(pageErrors).toEqual([]);

    let hmrStatus = page.locator("#jsx [data-hmr]");
    await expect(hmrStatus).toHaveText("HMR updated: no");

    let indexRouteContents = await fs.readFile(
      path.join(projectDir, "app/routes/jsx.jsx"),
      "utf8"
    );
    await fs.writeFile(
      path.join(projectDir, "app/routes/jsx.jsx"),
      indexRouteContents.replace("HMR updated: no", "HMR updated: yes"),
      "utf8"
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("HMR updated: yes");

    expect(pageErrors).toEqual([]);
  });

  test("handles MDX routes", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/mdx`, {
      waitUntil: "networkidle",
    });
    expect(pageErrors).toEqual([]);

    let mdxContent = page.locator("[data-mdx-route]");
    await expect(mdxContent).toHaveText("MDX route content from loader");

    expect(pageErrors).toEqual([]);
  });

  test("loads .env file", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/dotenv`, {
      waitUntil: "networkidle",
    });
    expect(pageErrors).toEqual([]);

    let loaderContent = page.locator("[data-dotenv-route-loader-content]");
    await expect(loaderContent).toHaveText("Content from .env file");

    let clientContent = page.locator("[data-dotenv-route-client-content]");
    await expect(clientContent).toHaveText(
      "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing"
    );

    expect(pageErrors).toEqual([]);
  });

  test("request errors map to original source code", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(
      `http://localhost:${devPort}/error-stacktrace?crash-server-render`
    );
    await expect(page.locator("main")).toContainText(
      "Error: crash-server-render"
    );
    await expect(page.locator("main")).toContainText(
      "error-stacktrace.tsx:16:11"
    );

    await page.goto(
      `http://localhost:${devPort}/error-stacktrace?crash-loader`
    );
    await expect(page.locator("main")).toContainText("Error: crash-loader");
    await expect(page.locator("main")).toContainText(
      "error-stacktrace.tsx:7:11"
    );
  });

  test("handle known route exports with HMR", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${devPort}/known-route-exports`, {
      waitUntil: "networkidle",
    });
    expect(pageErrors).toEqual([]);

    // file editing utils
    let filepath = path.join(projectDir, "app/routes/known-route-exports.tsx");
    let filedata = await fs.readFile(filepath, "utf8");
    async function editFile(edit: (data: string) => string) {
      filedata = edit(filedata);
      await fs.writeFile(filepath, filedata, "utf8");
    }

    // verify input state is preserved after each update
    let input = page.locator("input");
    await input.type("stateful");
    await expect(input).toHaveValue("stateful");

    // component
    await editFile((data) =>
      data.replace("HMR component: 0", "HMR component: 1")
    );
    await expect(page.locator("[data-hmr]")).toHaveText("HMR component: 1");
    await expect(input).toHaveValue("stateful");

    // handle
    await editFile((data) => data.replace("HMR handle: 0", "HMR handle: 1"));
    await expect(page.locator("[data-handle]")).toHaveText("HMR handle: 1");
    await expect(input).toHaveValue("stateful");

    // meta
    await editFile((data) => data.replace("HMR meta: 0", "HMR meta: 1"));
    await expect(page).toHaveTitle("HMR meta: 1");
    await expect(input).toHaveValue("stateful");

    // links
    await editFile((data) => data.replace("HMR links: 0", "HMR links: 1"));
    await expect(page.locator("[data-link]")).toHaveAttribute(
      "data-link",
      "HMR links: 1"
    );

    expect(pageErrors).toEqual([]);
  });
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};
