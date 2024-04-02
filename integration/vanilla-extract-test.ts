import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
  json,
} from "./helpers/create-fixture.js";

const TEST_PADDING_VALUE = "20px";

test.describe("Vanilla Extract", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      compiler: "remix",
      files: {
        "package.json": json({
          name: "remix-template-remix",
          private: true,
          sideEffects: false,
          type: "module",
          dependencies: {
            "@remix-run/css-bundle": "0.0.0-local-version",
            "@remix-run/node": "0.0.0-local-version",
            "@remix-run/react": "0.0.0-local-version",
            "@remix-run/serve": "0.0.0-local-version",
            isbot: "0.0.0-local-version",
            react: "0.0.0-local-version",
            "react-dom": "0.0.0-local-version",
          },
          devDependencies: {
            "@remix-run/dev": "0.0.0-local-version",
            "@types/react": "0.0.0-local-version",
            "@types/react-dom": "0.0.0-local-version",
            typescript: "0.0.0-local-version",

            "@vanilla-extract/css": "0.0.0-local-version",
          },
          engines: {
            node: ">=18.0.0",
          },
        }),

        "app/root.tsx": js`
          import { Links, Outlet } from "@remix-run/react";
          import { cssBundleHref } from "@remix-run/css-bundle";
          export function links() {
            return [{ rel: "stylesheet", href: cssBundleHref }];
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
        ...typeScriptFixture(),
        ...javaScriptFixture(),
        ...classCompositionFixture(),
        ...rootRelativeClassCompositionFixture(),
        ...sideEffectImportsFixture(),
        ...sideEffectImportsWithinChildCompilationFixture(),
        ...stableIdentifiersFixture(),
        ...imageUrlsViaCssUrlFixture(),
        ...imageUrlsViaRootRelativeCssUrlFixture(),
        ...imageUrlsViaAbsoluteCssUrlFixture(),
        ...imageUrlsViaJsImportFixture(),
        ...imageUrlsViaRootRelativeJsImportFixture(),
        ...imageUrlsViaClassCompositionFixture(),
        ...imageUrlsViaJsImportClassCompositionFixture(),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  let typeScriptFixture = () => ({
    "app/fixtures/typescript/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const root = style({
        background: 'peachpuff',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/typescript-test.tsx": js`
      import * as styles from "../fixtures/typescript/styles.css";

      export default function() {
        return (
          <div data-testid="typescript" className={styles.root}>
            TypeScript test
          </div>
        )
      }
    `,
  });
  test("TypeScript", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/typescript-test");
    let locator = await page.locator("[data-testid='typescript']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let javaScriptFixture = () => ({
    "app/fixtures/javascript/styles.css.js": js`
      import { style } from "@vanilla-extract/css";

      export const root = style({
        background: 'peachpuff',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/javascript-test.tsx": js`
      import * as styles from "../fixtures/javascript/styles.css";

      export default function() {
        return (
          <div data-testid="javascript" className={styles.root}>
            javaScript test
          </div>
        )
      }
    `,
  });
  test("JavaScript", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/javascript-test");
    let locator = await page.locator("[data-testid='javascript']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let classCompositionFixture = () => ({
    "app/fixtures/class-composition/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { padding } from "./padding.css";

      export const root = style([
        padding,
        { background: 'peachpuff' },
      ]);
    `,
    "app/fixtures/class-composition/padding.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const padding = style({
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/class-composition-test.tsx": js`
      import * as styles from "../fixtures/class-composition/styles.css";

      export default function() {
        return (
          <div data-testid="class-composition" className={styles.root}>
            Class composition test
          </div>
        )
      }
    `,
  });
  test("class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/class-composition-test");
    let locator = await page.locator("[data-testid='class-composition']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let rootRelativeClassCompositionFixture = () => ({
    "app/fixtures/root-relative-class-composition/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { padding } from "~/fixtures/root-relative-class-composition/padding.css";

      export const root = style([
        padding,
        { background: 'peachpuff' },
      ]);
    `,
    "app/fixtures/root-relative-class-composition/padding.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const padding = style({
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/root-relative-class-composition-test.tsx": js`
      import * as styles from "../fixtures/root-relative-class-composition/styles.css";

      export default function() {
        return (
          <div data-testid="root-relative-class-composition" className={styles.root}>
            Root-relative class composition test
          </div>
        )
      }
    `,
  });
  test("root-relative class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/root-relative-class-composition-test");
    let locator = await page.locator(
      "[data-testid='root-relative-class-composition']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let sideEffectImportsFixture = () => ({
    "app/fixtures/side-effect-imports/styles.css.ts": js`
      import { globalStyle } from "@vanilla-extract/css";

      globalStyle(".side-effect-imports", {
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/side-effect-imports-test.tsx": js`
      import "../fixtures/side-effect-imports/styles.css";

      export default function() {
        return (
          <div data-testid="side-effect-imports" className="side-effect-imports">
            Side-effect imports test
          </div>
        )
      }
    `,
  });
  test("side-effect imports", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/side-effect-imports-test");
    let locator = await page.locator("[data-testid='side-effect-imports']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let sideEffectImportsWithinChildCompilationFixture = () => ({
    "app/fixtures/side-effect-imports-within-child-compilation/styles.css.ts": js`
      import "./nested-side-effect.css";
    `,
    "app/fixtures/side-effect-imports-within-child-compilation/nested-side-effect.css.ts": js`
      import { globalStyle } from "@vanilla-extract/css";

      globalStyle(".side-effect-imports-within-child-compilation", {
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/routes/side-effect-imports-within-child-compilation-test.tsx": js`
      import "../fixtures/side-effect-imports-within-child-compilation/styles.css";

      export default function() {
        return (
          <div data-testid="side-effect-imports-within-child-compilation" className="side-effect-imports-within-child-compilation">
            Side-effect imports within child compilation test
          </div>
        )
      }
    `,
  });
  test("side-effect imports within child compilation", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/side-effect-imports-within-child-compilation-test");
    let locator = await page.locator(
      "[data-testid='side-effect-imports-within-child-compilation']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let stableIdentifiersFixture = () => ({
    "app/fixtures/stable-identifiers/styles_a.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { shared } from "./shared.css";

      export const root = shared;
    `,
    "app/fixtures/stable-identifiers/styles_b.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { shared } from "./shared.css";

      export const root = shared;
    `,
    "app/fixtures/stable-identifiers/shared.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const shared = style({
        padding: ${JSON.stringify(TEST_PADDING_VALUE)},
        background: 'peachpuff',
      });
    `,
    "app/routes/stable-identifiers-test.tsx": js`
      import * as styles_a from "../fixtures/stable-identifiers/styles_a.css";
      import * as styles_b from "../fixtures/stable-identifiers/styles_b.css";

      const styles = new Set([styles_a.root, styles_b.root]);

      export default function() {
        return (
          <div data-testid="stable-identifiers" className={Array.from(styles).join(' ')}>
            Stable identifiers test
          </div>
        )
      }
    `,
  });
  test("stable identifiers", async ({ page }) => {
    // This test ensures that file scoping is working as expected and
    // identifiers are stable across different .css.ts contexts. We test this by
    // using the same shared style in two different .css.ts files and then
    // asserting that it's the same class name.
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/stable-identifiers-test");
    let locator = await page.locator("[data-testid='stable-identifiers']");
    let { padding, classList } = await locator.evaluate((element) => ({
      padding: window.getComputedStyle(element).padding,
      classList: Array.from(element.classList),
    }));
    expect(padding).toBe(TEST_PADDING_VALUE);
    expect(classList.length).toBe(1);
  });

  let imageUrlsViaCssUrlFixture = () => ({
    "app/fixtures/imageUrlsViaCssUrl/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const root = style({
        backgroundColor: 'peachpuff',
        backgroundImage: 'url("./image.svg")',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/fixtures/imageUrlsViaCssUrl/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-css-url-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaCssUrl/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-css-url" className={styles.root}>
            Image URLs via CSS URL test
          </div>
        )
      }
    `,
  });
  test("image URLs via CSS URL", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-css-url-test");
    let locator = await page.locator("[data-testid='image-urls-via-css-url']");
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaRootRelativeCssUrlFixture = () => ({
    "app/fixtures/imageUrlsViaRootRelativeCssUrl/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const root = style({
        backgroundColor: 'peachpuff',
        backgroundImage: 'url("~/fixtures/imageUrlsViaRootRelativeCssUrl/image.svg")',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/fixtures/imageUrlsViaRootRelativeCssUrl/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-root-relative-css-url-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaRootRelativeCssUrl/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-root-relative-css-url" className={styles.root}>
            Image URLs via CSS URL test
          </div>
        )
      }
    `,
  });
  test("image URLs via root-relative CSS URL", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-root-relative-css-url-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-root-relative-css-url']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaAbsoluteCssUrlFixture = () => ({
    "app/fixtures/imageUrlsViaAbsoluteCssUrl/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const root = style({
        backgroundColor: 'peachpuff',
        backgroundImage: 'url("/imageUrlsViaAbsoluteCssUrl/image.svg")',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "public/imageUrlsViaAbsoluteCssUrl/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-absolute-css-url-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaAbsoluteCssUrl/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-absolute-css-url" className={styles.root}>
            Image URLs via absolute CSS URL test
          </div>
        )
      }
    `,
  });
  test("image URLs via absolute CSS URL", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-absolute-css-url-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-absolute-css-url']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaJsImportFixture = () => ({
    "app/fixtures/imageUrlsViaJsImport/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import href from "./image.svg";

      export const root = style({
        backgroundColor: 'peachpuff',
        backgroundImage: 'url(' + href + ')',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/fixtures/imageUrlsViaJsImport/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-js-import-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaJsImport/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-js-import" className={styles.root}>
            Image URLs via JS import test
          </div>
        )
      }
    `,
  });
  test("image URLs via JS import", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-js-import-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-js-import']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaRootRelativeJsImportFixture = () => ({
    "app/fixtures/imageUrlsViaRootRelativeJsImport/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import href from "~/fixtures/imageUrlsViaRootRelativeJsImport/image.svg";

      export const root = style({
        backgroundColor: 'peachpuff',
        backgroundImage: 'url(' + href + ')',
        padding: ${JSON.stringify(TEST_PADDING_VALUE)}
      });
    `,
    "app/fixtures/imageUrlsViaRootRelativeJsImport/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-root-relative-js-import-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaRootRelativeJsImport/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-root-relative-js-import" className={styles.root}>
            Image URLs via root-relative JS import test
          </div>
        )
      }
    `,
  });
  test("image URLs via root-relative JS import", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-root-relative-js-import-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-root-relative-js-import']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaClassCompositionFixture = () => ({
    "app/fixtures/imageUrlsViaClassComposition/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { backgroundImage } from "./nested/backgroundImage.css";

      export const root = style([
        backgroundImage,
        {
          backgroundColor: 'peachpuff',
          padding: ${JSON.stringify(TEST_PADDING_VALUE)}
        }
      ]);
    `,
    "app/fixtures/imageUrlsViaClassComposition/nested/backgroundImage.css.ts": js`
      import { style } from "@vanilla-extract/css";

      export const backgroundImage = style({
        backgroundImage: 'url(../image.svg)',
      });
    `,
    "app/fixtures/imageUrlsViaClassComposition/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-class-composition-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaClassComposition/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-class-composition" className={styles.root}>
            Image URLs via class composition test
          </div>
        )
      }
    `,
  });
  test("image URLs via class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-class-composition-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-class-composition']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let imageUrlsViaJsImportClassCompositionFixture = () => ({
    "app/fixtures/imageUrlsViaJsImportClassComposition/styles.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import { backgroundImage } from "./nested/backgroundImage.css";

      export const root = style([
        backgroundImage,
        {
          backgroundColor: 'peachpuff',
          padding: ${JSON.stringify(TEST_PADDING_VALUE)}
        }
      ]);
    `,
    "app/fixtures/imageUrlsViaJsImportClassComposition/nested/backgroundImage.css.ts": js`
      import { style } from "@vanilla-extract/css";
      import href from "../image.svg";

      export const backgroundImage = style({
        backgroundImage: 'url(' + href + ')',
      });
    `,
    "app/fixtures/imageUrlsViaJsImportClassComposition/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-via-js-import-class-composition-test.tsx": js`
      import * as styles from "../fixtures/imageUrlsViaJsImportClassComposition/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls-via-js-import-class-composition" className={styles.root}>
            Image URLs via class composition test
          </div>
        )
      }
    `,
  });
  test("image URLs via JS import class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-via-js-import-class-composition-test");
    let locator = await page.locator(
      "[data-testid='image-urls-via-js-import-class-composition']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });
});
