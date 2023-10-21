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
            optimizeDeps: {
              include: ["react", "react-dom/client"],
            },
            server: {
              port: ${devPort},
              strictPort: true,
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
          import { useState, useEffect } from "react";

          export default function IndexRoute() {
            const [mounted, setMounted] = useState(false);
            useEffect(() => {
              setMounted(true);
            }, []);

            return (
              <div id="index">
                <h2 data-title>Index</h2>
                <input />
                <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
                <p data-hmr>HMR updated: no</p>
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
    await page.goto(`http://localhost:${devPort}/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("#index [data-title]")).toHaveText("Index");
    await expect(page.locator("#index [data-mounted]")).toHaveText(
      "Mounted: yes"
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
  });
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};
