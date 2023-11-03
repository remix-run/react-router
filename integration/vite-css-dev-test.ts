import { test, expect } from "@playwright/test";
import type { Readable } from "node:stream";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import resolveBin from "resolve-bin";
import getPort from "get-port";
import waitOn from "wait-on";

import { createFixtureProject, js, css } from "./helpers/create-fixture.js";
import { killtree } from "./helpers/killtree.js";

const TEST_PADDING_VALUE = "20px";
const UPDATED_TEST_PADDING_VALUE = "30px";

test.describe("Vite CSS dev", () => {
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
                    <Outlet />
                  </div>
                  <LiveReload />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/styles-bundled.css": css`
          .index_bundled {
            background: papayawhip;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/styles-linked.css": css`
          .index_linked {
            background: salmon;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/styles.module.css": css`
          .index {
            background: peachpuff;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/routes/_index.tsx": js`
          import "../styles-bundled.css";
          import linkedStyles from "../styles-linked.css?url";
          import cssModulesStyles from "../styles.module.css";

          export function links() {
            return [{ rel: "stylesheet", href: linkedStyles }];
          }

          export default function IndexRoute() {
            return (
              <div id="index">
                <div data-css-modules className={cssModulesStyles.index}>
                  <div data-css-linked className="index_linked">
                    <div data-css-bundled className="index_bundled">
                      <h2>CSS test</h2>
                    </div>
                  </div>
                </div>
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

  test.describe("without JS", () => {
    test.use({ javaScriptEnabled: false });
    test("renders CSS", async ({ page }) => {
      await page.goto(`http://localhost:${devPort}/`, {
        waitUntil: "networkidle",
      });
      await expect(page.locator("#index [data-css-modules]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-linked]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-bundled]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
    });
  });

  test.describe("with JS", () => {
    test.use({ javaScriptEnabled: true });
    test("updates CSS", async ({ page }) => {
      let pageErrors: unknown[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${devPort}/`, {
        waitUntil: "networkidle",
      });

      // Ensure no errors on page load
      expect(pageErrors).toEqual([]);

      await expect(page.locator("#index [data-css-modules]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-linked]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-bundled]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );

      let bundledCssContents = await fs.readFile(
        path.join(projectDir, "app/styles-bundled.css"),
        "utf8"
      );
      await fs.writeFile(
        path.join(projectDir, "app/styles-bundled.css"),
        bundledCssContents.replace(
          TEST_PADDING_VALUE,
          UPDATED_TEST_PADDING_VALUE
        ),
        "utf8"
      );

      let linkedCssContents = await fs.readFile(
        path.join(projectDir, "app/styles-linked.css"),
        "utf8"
      );
      await fs.writeFile(
        path.join(projectDir, "app/styles-linked.css"),
        linkedCssContents.replace(
          TEST_PADDING_VALUE,
          UPDATED_TEST_PADDING_VALUE
        ),
        "utf8"
      );

      let cssModuleContents = await fs.readFile(
        path.join(projectDir, "app/styles.module.css"),
        "utf8"
      );
      await fs.writeFile(
        path.join(projectDir, "app/styles.module.css"),
        cssModuleContents.replace(
          TEST_PADDING_VALUE,
          UPDATED_TEST_PADDING_VALUE
        ),
        "utf8"
      );

      await expect(page.locator("#index [data-css-modules]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-linked]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-bundled]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );
    });
  });
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};
