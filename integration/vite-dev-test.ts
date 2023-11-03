import { test, expect } from "@playwright/test";
import type { Readable } from "node:stream";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import resolveBin from "resolve-bin";
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
          import { unstable_vitePlugin as remix } from "@remix-run/dev";

          export default defineConfig({
            server: {
              port: ${devPort},
              strictPort: true,
            },
            optimizeDeps: {
              include: ["react", "react-dom/client", "@remix-run/react"],
            },
            plugins: [remix()],
          });
        `,
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts, LiveReload } from "@remix-run/react";

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
                  <LiveReload />
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
      },
    });

    let nodeBin = process.argv[0];
    let viteBin = resolveBin.sync("vite");
    devProc = spawn(nodeBin, [viteBin, "dev"], {
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
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};
