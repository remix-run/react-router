import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import {
  createAppFixture,
  createFixture,
  css,
  js,
} from "./helpers/create-fixture";

const TEST_PADDING_VALUE = "20px";

async function jsonFromBase64CssContent({
  page,
  testId,
}: {
  page: Page;
  testId: string;
}) {
  let locator = await page.locator(`[data-testid=${testId}]`);
  let content = await locator.evaluate(
    (el) => getComputedStyle(el, ":after").content
  );
  let json = Buffer.from(content.replace(/"/g, ""), "base64").toString("utf-8");
  return JSON.parse(json);
}

test.describe("PostCSS", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "remix.config.js": js`
          module.exports = {
            future: {
              // Enable all CSS future flags to
              // ensure features don't clash
              unstable_cssModules: true,
              unstable_cssSideEffectImports: true,
              unstable_postcss: true,
              unstable_tailwind: true,
              unstable_vanillaExtract: true,
            },
          };
        `,
        // We provide a test plugin that replaces the strings
        // "TEST_PADDING_VALUE" and "TEST_POSTCSS_CONTEXT".
        // This lets us assert that the plugin is being run
        // and that the correct context values are provided.
        "postcss.config.js": js`
          module.exports = (ctx) => ({
            plugins: [
              {
                postcssPlugin: 'replace',
                Declaration (decl) {
                  decl.value = decl.value
                    .replaceAll(
                      "TEST_PADDING_VALUE",
                      ${JSON.stringify(TEST_PADDING_VALUE)},
                    )
                    .replaceAll(
                      "TEST_POSTCSS_CONTEXT",
                      Buffer.from(JSON.stringify(ctx)).toString("base64"),
                    );
                },
              },
            ],
          });
        `,
        "tailwind.config.js": js`
          module.exports = {
            content: ["./app/**/*.{ts,tsx,jsx,js}"],
            theme: {
              spacing: {
                'test': ${JSON.stringify(TEST_PADDING_VALUE)}
              },
            },
          };
        `,
        "app/root.jsx": js`
          import { Links, Outlet } from "@remix-run/react";
          import { cssBundleHref } from "@remix-run/css-bundle";
          export function links() {
            return [
              { rel: "stylesheet", href: cssBundleHref }
            ];
          }
          export default function Root() {
            return (
              <html>
                <head>
                  <Links />
                </head>
                <body>
                  <Outlet />
                </body>
              </html>
            )
          }
        `,
        ...regularStylesSheetsFixture(),
        ...cssModulesFixture(),
        ...vanillaExtractFixture(),
        ...cssSideEffectImportsFixture(),
        ...automaticTailwindPluginInsertionFixture(),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  let regularStylesSheetsFixture = () => ({
    "app/routes/regular-style-sheets-test.jsx": js`
      import { Test, links as testLinks } from "~/test-components/regular-style-sheets";
    
      export function links() {
        return [...testLinks()];
      }

      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/regular-style-sheets/index.jsx": js`
      import stylesHref from "./styles.css";

      export function links() {
        return [{ rel: 'stylesheet', href: stylesHref }];
      }

      export function Test() {
        return (
          <div data-testid="regular-style-sheets" className="regular-style-sheets-test">
            <p>Regular style sheets test.</p>            
            <p>PostCSS context (base64): <span data-testid="regular-style-sheets-postcss-context" /></p>
          </div>
        );
      }
    `,
    "app/test-components/regular-style-sheets/styles.css": css`
      .regular-style-sheets-test {
        padding: TEST_PADDING_VALUE;
      }

      [data-testid="regular-style-sheets-postcss-context"]:after {
        content: "TEST_POSTCSS_CONTEXT";
      }
    `,
  });
  test("regular style sheets", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/regular-style-sheets-test");
    let locator = await page.locator("[data-testid='regular-style-sheets']");
    let padding = await locator.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
  test("regular style sheets PostCSS context", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/regular-style-sheets-test");
    let testId = "regular-style-sheets-postcss-context";
    let postcssContext = await jsonFromBase64CssContent({ page, testId });
    expect(postcssContext.remix).toEqual({
      vanillaExtract: false,
    });
  });

  let cssModulesFixture = () => ({
    "app/routes/css-modules-test.jsx": js`
      import { Test } from "~/test-components/css-modules";

      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/css-modules/index.jsx": js`
      import styles from "./styles.module.css";

      export function Test() {
        return (
          <div data-testid="css-modules" className={styles.root}>
            <p>CSS Modules test.</p>            
            <p>PostCSS context (base64): <span data-testid="css-modules-postcss-context" /></p>
          </div>
        );
      }
    `,
    "app/test-components/css-modules/styles.module.css": css`
      .root {
        padding: TEST_PADDING_VALUE;
      }

      [data-testid="css-modules-postcss-context"]:after {
        content: "TEST_POSTCSS_CONTEXT";
      }
    `,
  });
  test("CSS Modules", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/css-modules-test");
    let locator = await page.locator("[data-testid='css-modules']");
    let padding = await locator.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
  test("CSS Modules PostCSS context", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/css-modules-test");
    let testId = "css-modules-postcss-context";
    let postcssContext = await jsonFromBase64CssContent({ page, testId });
    expect(postcssContext.remix).toEqual({
      vanillaExtract: false,
    });
  });

  let vanillaExtractFixture = () => ({
    "app/routes/vanilla-extract-test.jsx": js`
      import { Test } from "~/test-components/vanilla-extract";

      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/vanilla-extract/index.jsx": js`
      import * as styles from "./styles.css";

      export function Test() {
        return (
          <div data-testid="vanilla-extract" className={styles.root}>
            <p>Vanilla Extract test.</p>            
            <p>PostCSS context (base64): <span data-testid="vanilla-extract-postcss-context" /></p>
          </div>
        );
      }
    `,
    "app/test-components/vanilla-extract/styles.css.ts": js`
      import { style, globalStyle } from "@vanilla-extract/css";
    
      export const root = style({
        padding: "TEST_PADDING_VALUE",
      });

      globalStyle('[data-testid="vanilla-extract-postcss-context"]:after', {
        content: "TEST_POSTCSS_CONTEXT",
      })
    `,
  });
  test("Vanilla Extract", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/vanilla-extract-test");
    let locator = await page.locator("[data-testid='vanilla-extract']");
    let padding = await locator.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
  test("Vanilla Extract PostCSS context", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/vanilla-extract-test");
    let testId = "vanilla-extract-postcss-context";
    let postcssContext = await jsonFromBase64CssContent({ page, testId });
    expect(postcssContext.remix).toEqual({
      vanillaExtract: true,
    });
  });

  let cssSideEffectImportsFixture = () => ({
    "app/routes/css-side-effect-imports-test.jsx": js`
      import { Test } from "~/test-components/css-side-effect-imports";

      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/css-side-effect-imports/index.jsx": js`
      import "./styles.css";

      export function Test() {
        return (
          <div data-testid="css-side-effect-imports" className="css-side-effect-imports-test">
            <p>CSS side-effect imports test.</p>            
            <p>PostCSS context (base64): <span data-testid="css-side-effect-imports-postcss-context" /></p>
          </div>
        );
      }
    `,
    "app/test-components/css-side-effect-imports/styles.css": css`
      .css-side-effect-imports-test {
        padding: TEST_PADDING_VALUE;
      }

      [data-testid="css-side-effect-imports-postcss-context"]:after {
        content: "TEST_POSTCSS_CONTEXT";
      }
    `,
  });
  test("CSS side-effect imports", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/css-side-effect-imports-test");
    let locator = await page.locator("[data-testid='css-side-effect-imports']");
    let padding = await locator.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
  test("CSS side-effect imports PostCSS context", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/css-side-effect-imports-test");
    let testId = "css-side-effect-imports-postcss-context";
    let postcssContext = await jsonFromBase64CssContent({ page, testId });
    expect(postcssContext.remix).toEqual({
      vanillaExtract: false,
    });
  });

  let automaticTailwindPluginInsertionFixture = () => ({
    "app/routes/automatic-tailwind-plugin-insertion-test.jsx": js`
      import { Test, links as testLinks } from "~/test-components/automatic-tailwind-plugin-insertion";
    
      export function links() {
        return [...testLinks()];
      }

      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/automatic-tailwind-plugin-insertion/index.jsx": js`
      import stylesHref from "./styles.css";

      export function links() {
        return [{ rel: 'stylesheet', href: stylesHref }];
      }

      export function Test() {
        return (
          <div data-testid="automatic-tailwind-plugin-insertion" className="automatic-tailwind-plugin-insertion-test">
            Automatic Tailwind plugin insertion test
          </div>
        );
      }
    `,
    "app/test-components/automatic-tailwind-plugin-insertion/styles.css": css`
      .automatic-tailwind-plugin-insertion-test {
        @apply p-test;
      }
    `,
  });
  test("automatic Tailwind plugin insertion", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/automatic-tailwind-plugin-insertion-test");
    let locator = await page.locator(
      "[data-testid='automatic-tailwind-plugin-insertion']"
    );
    let padding = await locator.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
});
