import fs from "node:fs/promises";
import path from "node:path";

import { expect } from "@playwright/test";
import dedent from "dedent";

import {
  reactRouterConfig,
  test,
  type TemplateName,
  type Files,
} from "./helpers/vite.js";

const tsx = dedent;

test.describe("Vite dev", () => {
  [false, true].forEach((viteEnvironmentApi) => {
    test.describe(`viteEnvironmentApi: ${viteEnvironmentApi}`, () => {
      const files: Files = async ({ port }) => ({
        "react-router.config.ts": reactRouterConfig({
          viteEnvironmentApi,
        }),
        "vite.config.ts": tsx`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            server: {
              port: ${port},
              strictPort: true,
            },
            plugins: [
              mdx(),
              reactRouter(),
            ],
          });
        `,
        "app/root.tsx": tsx`
          import { Links, Meta, Outlet, Scripts } from "react-router";

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
        "app/routes/_index.tsx": tsx`
          import { Suspense } from "react";
          import { Await, useLoaderData } from "react-router";

          export function loader() {
            let deferred = new Promise((resolve) => {
              setTimeout(() => resolve(true), 1000)
            });
            return { deferred };
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
        "app/routes/set-cookies.tsx": tsx`
          import type { LoaderFunction } from "react-router";

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

            headers.set("location", "http://localhost:${port}/get-cookies");

            const response = new Response(null, {
              headers,
              status: 302,
            });

            return response;
          };
        `,
        "app/routes/get-cookies.tsx": tsx`
          import { useLoaderData, type LoaderFunctionArgs } from "react-router";

          export const loader = ({ request }: LoaderFunctionArgs) => ({
            cookies: request.headers.get("Cookie")
          });

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
        "app/routes/jsx.jsx": tsx`
          export default function JsxRoute() {
            return (
              <div id="jsx">
                <p data-hmr>HMR updated: no</p>
              </div>
            );
          }
        `,
        "app/routes/mdx.mdx": tsx`
          import { useLoaderData } from "react-router";

          export const loader = () => {
            return {
              content: "MDX route content from loader",
            }
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
        "app/routes/dotenv.tsx": tsx`
          import { useState, useEffect } from "react";
          import { useLoaderData } from "react-router";

          export const loader = () => {
            return {
              loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE,
            }
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
        "app/routes/error-stacktrace.tsx": tsx`
          import { Link, useLocation, type LoaderFunction, type MetaFunction } from "react-router";

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
        "app/routes/known-route-exports.tsx": tsx`
          import { useMatches } from "react-router";

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
      });

      const templateName: TemplateName = viteEnvironmentApi
        ? "vite-6-template"
        : "vite-5-template";

      test("renders matching routes", async ({ dev, page }) => {
        const { cwd, port } = await dev(files, templateName);

        await page.goto(`http://localhost:${port}/`, {
          waitUntil: "networkidle",
        });

        // Ensure no errors on page load
        expect(page.errors).toEqual([]);

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
          path.join(cwd, "app/routes/_index.tsx"),
          "utf8"
        );
        await fs.writeFile(
          path.join(cwd, "app/routes/_index.tsx"),
          indexRouteContents.replace("HMR updated: no", "HMR updated: yes"),
          "utf8"
        );
        await page.waitForLoadState("networkidle");
        await expect(hmrStatus).toHaveText("HMR updated: yes");
        await expect(input).toHaveValue("stateful");

        // Ensure no errors after HMR
        expect(page.errors).toEqual([]);
      });

      test("handles multiple set-cookie headers", async ({ dev, page }) => {
        const { port } = await dev(files, templateName);

        await page.goto(`http://localhost:${port}/set-cookies`, {
          waitUntil: "networkidle",
        });

        expect(page.errors).toEqual([]);

        // Ensure we redirected
        expect(new URL(page.url()).pathname).toBe("/get-cookies");

        await expect(page.locator("#get-cookies [data-cookies]")).toHaveText(
          "first=one; second=two; third=three"
        );
      });

      test("handles JSX in .jsx file without React import", async ({
        dev,
        page,
      }) => {
        const { cwd, port } = await dev(files, templateName);

        await page.goto(`http://localhost:${port}/jsx`, {
          waitUntil: "networkidle",
        });
        expect(page.errors).toEqual([]);

        let hmrStatus = page.locator("#jsx [data-hmr]");
        await expect(hmrStatus).toHaveText("HMR updated: no");

        let indexRouteContents = await fs.readFile(
          path.join(cwd, "app/routes/jsx.jsx"),
          "utf8"
        );
        await fs.writeFile(
          path.join(cwd, "app/routes/jsx.jsx"),
          indexRouteContents.replace("HMR updated: no", "HMR updated: yes"),
          "utf8"
        );
        await page.waitForLoadState("networkidle");
        await expect(hmrStatus).toHaveText("HMR updated: yes");

        expect(page.errors).toEqual([]);
      });

      test("handles MDX routes", async ({ dev, page }) => {
        const { port } = await dev(files, templateName);
        await page.goto(`http://localhost:${port}/mdx`, {
          waitUntil: "networkidle",
        });
        expect(page.errors).toEqual([]);

        let mdxContent = page.locator("[data-mdx-route]");
        await expect(mdxContent).toHaveText("MDX route content from loader");

        expect(page.errors).toEqual([]);
      });

      test("loads .env file", async ({ dev, page }) => {
        const { port } = await dev(files, templateName);

        await page.goto(`http://localhost:${port}/dotenv`, {
          waitUntil: "networkidle",
        });
        expect(page.errors).toEqual([]);

        let loaderContent = page.locator("[data-dotenv-route-loader-content]");
        await expect(loaderContent).toHaveText("Content from .env file");

        let clientContent = page.locator("[data-dotenv-route-client-content]");
        await expect(clientContent).toHaveText(
          "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing"
        );

        expect(page.errors).toEqual([]);
      });

      test("request errors map to original source code", async ({
        dev,
        page,
      }) => {
        const { port } = await dev(files, templateName);

        await page.goto(
          `http://localhost:${port}/error-stacktrace?crash-server-render`
        );
        await expect(page.locator("main")).toContainText(
          "Error: crash-server-render"
        );
        await expect(page.locator("main")).toContainText(
          "error-stacktrace.tsx:14:11"
        );

        await page.goto(
          `http://localhost:${port}/error-stacktrace?crash-loader`
        );
        await expect(page.locator("main")).toContainText("Error: crash-loader");
        await expect(page.locator("main")).toContainText(
          "error-stacktrace.tsx:5:11"
        );
      });

      test("handle known route exports with HMR", async ({ dev, page }) => {
        const { cwd, port } = await dev(files, templateName);

        await page.goto(`http://localhost:${port}/known-route-exports`, {
          waitUntil: "networkidle",
        });
        expect(page.errors).toEqual([]);

        // file editing utils
        let filepath = path.join(cwd, "app/routes/known-route-exports.tsx");
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
        await editFile((data) =>
          data.replace("HMR handle: 0", "HMR handle: 1")
        );
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

        expect(page.errors).toEqual([]);
      });
    });
  });
});
