import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  css,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

const TEST_PADDING_VALUE = "20px";

test.describe("Vite CSS legacy imports build", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      compiler: "vite",
      files: {
        "remix.config.js": js`
          throw new Error("Remix should not access remix.config.js when using Vite");
          export default {};
        `,
        "vite.config.mjs": js`
          import { defineConfig } from "vite";
          import { unstable_vitePlugin as remix } from "@remix-run/dev";

          export default defineConfig({
            plugins: [
              remix({
                legacyCssImports: true
              })
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
        "app/routes/_index/styles-linked.css": css`
          .index_linked {
            background: peachpuff;
            padding: ${TEST_PADDING_VALUE};
          }
        `,
        "app/routes/_index/route.tsx": js`
          import linkedStyles from "./styles-linked.css";

          export function links() {
            return [{ rel: "stylesheet", href: linkedStyles }];
          }

          export default function IndexRoute() {
            return (
              <div id="index">
                <div data-css-linked className="index_linked">
                  <h2>CSS test</h2>
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
    await expect(page.locator("#index [data-css-linked]")).toHaveCSS(
      "padding",
      TEST_PADDING_VALUE
    );
  });
});
