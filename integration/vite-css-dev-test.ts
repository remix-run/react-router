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
          import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

          export default defineConfig({
            server: {
              port: ${devPort},
              strictPort: true,
            },
            plugins: [
              vanillaExtractPlugin(),
              remix(),
            ],
          });
        `,
        "app/entry.client.tsx": js`
          import "./entry.client.css";
        
          import { RemixBrowser } from "@remix-run/react";
          import { startTransition, StrictMode } from "react";
          import { hydrateRoot } from "react-dom/client";

          startTransition(() => {
            hydrateRoot(
              document,
              <StrictMode>
                <RemixBrowser />
              </StrictMode>
            );
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
                  <Scripts />
                  <LiveReload />
                </body>
              </html>
            );
          }
        `,
        "app/entry.client.css": css`
          .client-entry {
            background: pink;
            padding: ${TEST_PADDING_VALUE};
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
        "app/styles-vanilla-global.css.ts": js`
          import { createVar, globalStyle } from "@vanilla-extract/css";

          globalStyle(".index_vanilla_global", {
            background: "lightgreen",
            padding: "${TEST_PADDING_VALUE}",
          });
        `,
        "app/styles-vanilla-local.css.ts": js`
          import { style } from "@vanilla-extract/css";

          export const index = style({
            background: "lightblue",
            padding: "${TEST_PADDING_VALUE}",
          });
        `,
        "app/routes/_index.tsx": js`
          import "../styles-bundled.css";
          import linkedStyles from "../styles-linked.css?url";
          import cssModulesStyles from "../styles.module.css";
          import "../styles-vanilla-global.css";
          import * as stylesVanillaLocal from "../styles-vanilla-local.css";

          export function links() {
            return [{ rel: "stylesheet", href: linkedStyles }];
          }

          export default function IndexRoute() {
            return (
              <div id="index">
                <input />
                <div data-client-entry className="client-entry">
                  <div data-css-modules className={cssModulesStyles.index}>
                    <div data-css-linked className="index_linked">
                      <div data-css-bundled className="index_bundled">
                        <div data-css-vanilla-global className="index_vanilla_global">
                          <div data-css-vanilla-local className={stylesVanillaLocal.index}>
                            <h2>CSS test</h2>
                          </div>
                        </div>
                      </div>
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
      await expect(page.locator("#index [data-client-entry]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
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
      await expect(page.locator("#index [data-css-vanilla-global]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-vanilla-local]")).toHaveCSS(
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

      await expect(page.locator("#index [data-client-entry]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
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
      await expect(page.locator("#index [data-css-vanilla-global]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-vanilla-local]")).toHaveCSS(
        "padding",
        TEST_PADDING_VALUE
      );

      let input = page.locator("#index input");
      await expect(input).toBeVisible();
      await input.type("stateful");
      await expect(input).toHaveValue("stateful");

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

      await editFile(
        path.join(projectDir, "app/styles-vanilla-global.css.ts"),
        (data) => data.replace(TEST_PADDING_VALUE, UPDATED_TEST_PADDING_VALUE)
      );
      await editFile(
        path.join(projectDir, "app/styles-vanilla-local.css.ts"),
        (data) => data.replace(TEST_PADDING_VALUE, UPDATED_TEST_PADDING_VALUE)
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
      await expect(page.locator("#index [data-css-vanilla-global]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );
      await expect(page.locator("#index [data-css-vanilla-local]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );

      // Ensure CSS updates were handled by HMR
      await expect(input).toHaveValue("stateful");

      // The following change triggers a full page reload, so we check it after all the checks for HMR state preservation
      let clientEntryCssContents = await fs.readFile(
        path.join(projectDir, "app/entry.client.css"),
        "utf8"
      );
      await fs.writeFile(
        path.join(projectDir, "app/entry.client.css"),
        clientEntryCssContents.replace(
          TEST_PADDING_VALUE,
          UPDATED_TEST_PADDING_VALUE
        ),
        "utf8"
      );

      await expect(page.locator("#index [data-client-entry]")).toHaveCSS(
        "padding",
        UPDATED_TEST_PADDING_VALUE
      );

      expect(pageErrors).toEqual([]);
    });
  });
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};

async function editFile(filepath: string, edit: (content: string) => string) {
  let content = await fs.readFile(filepath, "utf-8");
  await fs.writeFile(filepath, edit(content));
}
