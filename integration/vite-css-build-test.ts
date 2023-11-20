import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

import {
  createAppFixture,
  createFixture,
  js,
  css,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const TEST_PADDING_VALUE = "20px";

test.describe("Vite CSS build", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    // set sideEffects for global vanilla extract css
    let packageJson = JSON.parse(
      await fs.readFile(
        path.resolve(__dirname, "helpers", "node-template", "package.json"),
        "utf-8"
      )
    );
    packageJson.sideEffects = ["*.css.ts"];

    fixture = await createFixture({
      compiler: "vite",
      files: {
        "package.json": JSON.stringify(packageJson, null, 2),
        "remix.config.js": js`
          throw new Error("Remix should not access remix.config.js when using Vite");
          export default {};
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { unstable_vitePlugin as remix } from "@remix-run/dev";
          import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

          export default defineConfig({
            plugins: [
              vanillaExtractPlugin({
                emitCssInSsr: true,
              }),
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
                    <Outlet />
                  </div>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index/styles-bundled.css": css`
          .index_bundled {
            background: papayawhip;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/routes/_index/styles-linked.css": css`
          .index_linked {
            background: mintcream;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/routes/_index/styles.module.css": css`
          .index {
            background: peachpuff;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/routes/_index/styles-vanilla-global.css.ts": js`
          import { globalStyle } from "@vanilla-extract/css";

          globalStyle(".index_vanilla_global", {
            background: "lightgreen",
            padding: "${TEST_PADDING_VALUE}",
          });
        `,
        "app/routes/_index/styles-vanilla-local.css.ts": js`
          import { style } from "@vanilla-extract/css";

          export const index = style({
            background: "lightblue",
            padding: "${TEST_PADDING_VALUE}",
          });
        `,
        "app/routes/_index/route.tsx": js`
          import "./styles-bundled.css";
          import linkedStyles from "./styles-linked.css?url";
          import cssModulesStyles from "./styles.module.css";
          import "./styles-vanilla-global.css";
          import * as stylesVanillaLocal from "./styles-vanilla-local.css";

          export function links() {
            return [{ rel: "stylesheet", href: linkedStyles }];
          }

          export default function IndexRoute() {
            return (
              <div id="index">
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

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("renders styles", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
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
