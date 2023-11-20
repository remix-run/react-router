import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import getPort from "get-port";

import { createFixtureProject, js, css } from "./helpers/create-fixture.js";
import { kill, node } from "./helpers/dev.js";

const TEST_PADDING_VALUE = "20px";
const UPDATED_TEST_PADDING_VALUE = "30px";

test.describe("Vite CSS dev (Express server)", () => {
  let projectDir: string;
  let dev: { pid: number; port: number };

  test.beforeAll(async () => {
    let port = await getPort();
    let hmrPort = await getPort();
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
              hmr: {
                port: ${hmrPort}
              }
            },
            plugins: [
              vanillaExtractPlugin({
                emitCssInSsr: true,
              }),
              remix(),
            ],
          });
        `,
        "server.mjs": js`
          import {
            unstable_createViteServer,
            unstable_loadViteServerBuild,
          } from "@remix-run/dev";
          import { createRequestHandler } from "@remix-run/express";
          import { installGlobals } from "@remix-run/node";
          import express from "express";

          installGlobals();

          let vite =
            process.env.NODE_ENV === "production"
              ? undefined
              : await unstable_createViteServer();

          const app = express();

          if (vite) {
            app.use(vite.middlewares);
          } else {
            app.use(
              "/build",
              express.static("public/build", { immutable: true, maxAge: "1y" })
            );
          }
          app.use(express.static("public", { maxAge: "1h" }));

          app.all(
            "*",
            createRequestHandler({
              build: vite
                ? () => unstable_loadViteServerBuild(vite)
                : await import("./build/index.js"),
            })
          );

          const port = ${port};
          app.listen(port, () => console.log('http://localhost:' + port));
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
            );
          }
        `,
      },
    });

    dev = await node(projectDir, ["./server.mjs"], { port });
  });

  test.afterAll(async () => {
    await kill(dev.pid);
  });

  test.describe("without JS", () => {
    test.use({ javaScriptEnabled: false });
    test("renders CSS", async ({ page }) => {
      await page.goto(`http://localhost:${dev.port}/`, {
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

      await page.goto(`http://localhost:${dev.port}/`, {
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

      await expect(input).toHaveValue("stateful");

      expect(pageErrors).toEqual([]);
    });
  });
});

async function editFile(filepath: string, edit: (content: string) => string) {
  let content = await fs.readFile(filepath, "utf-8");
  await fs.writeFile(filepath, edit(content));
}
