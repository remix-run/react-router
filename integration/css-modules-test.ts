import { test, expect } from "@playwright/test";
import globby from "globby";
import fse from "fs-extra";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  css,
  js,
} from "./helpers/create-fixture.js";

const TEST_PADDING_VALUE = "20px";

test.describe("CSS Modules", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
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
        ...basicStylesFixture(),
        ...globalSelectorsFixture(),
        ...nestedGlobalSelectorsFixture(),
        ...localClassCompositionFixture(),
        ...importedClassCompositionFixture(),
        ...rootRelativeImportedClassCompositionFixture(),
        ...globalClassCompositionFixture(),
        ...localValueFixture(),
        ...importedValueFixture(),
        ...rootRelativeImportedValueFixture(),
        ...imageUrlsFixture(),
        ...rootRelativeImageUrlsFixture(),
        ...absoluteImageUrlsFixture(),
        ...clientEntrySideEffectsFixture(),
        ...deduplicatedCssFixture(),
        ...uniqueClassNamesFixture(),
        ...treeShakingFixture(),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  let basicStylesFixture = () => ({
    "app/routes/basic-styles-test.tsx": js`
      import { Test } from "~/test-components/basic-styles";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/basic-styles/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="basic-styles" className={styles.root}>
            Basic styles test
          </div>
        );
      }
    `,
    "app/test-components/basic-styles/styles.module.css": css`
      .root {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("basic styles", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/basic-styles-test");
    let locator = await page.locator("[data-testid='basic-styles']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let globalSelectorsFixture = () => ({
    "app/routes/global-selector-test.tsx": js`
      import { Test } from "~/test-components/global-selector";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/global-selector/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div className="global_container">
            <div data-testid="global-selector" className={styles.root}>
              Nested global selector test
            </div>
          </div>
        );
      }
    `,
    "app/test-components/global-selector/styles.module.css": css`
      :global(.global_container) .root {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("global selectors", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/global-selector-test");
    let locator = await page.locator("[data-testid='global-selector']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let nestedGlobalSelectorsFixture = () => ({
    "app/routes/nested-global-selector-test.tsx": js`
      import { Test } from "~/test-components/nested-global-selector";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/nested-global-selector/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div className="global_container">
            <div data-testid="nested-global-selector" className={styles.root}>
              Nested global selector test
            </div>
          </div>
        );
      }
    `,
    "app/test-components/nested-global-selector/styles.module.css": css`
      :global .global_container :local .root {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("nested global selectors", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/nested-global-selector-test");
    let locator = await page.locator("[data-testid='nested-global-selector']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let localClassCompositionFixture = () => ({
    "app/routes/local-class-composition-test.tsx": js`
      import { Test } from "~/test-components/local-class-composition";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/local-class-composition/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="local-class-composition" className={styles.root}>
            Local composes test
          </div>
        );
      }
    `,
    "app/test-components/local-class-composition/styles.module.css": css`
      .padding {
        padding: ${TEST_PADDING_VALUE};
      }
      .root {
        background: peachpuff;
        composes: padding;
      }
    `,
  });
  test("local class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/local-class-composition-test");
    let locator = await page.locator("[data-testid='local-class-composition']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let importedClassCompositionFixture = () => ({
    "app/routes/imported-class-composition-test.tsx": js`
      import { Test } from "~/test-components/imported-class-composition";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/imported-class-composition/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="imported-class-composition" className={styles.root}>
            Imported class composition test
          </div>
        );
      }
    `,
    "app/test-components/imported-class-composition/styles.module.css": css`
      .root {
        background: peachpuff;
        composes: padding from "./import.module.css";
      }
    `,
    "app/test-components/imported-class-composition/import.module.css": css`
      .padding {
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("imported class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/imported-class-composition-test");
    let locator = await page.locator(
      "[data-testid='imported-class-composition']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let rootRelativeImportedClassCompositionFixture = () => ({
    "app/routes/root-relative-imported-class-composition-test.tsx": js`
      import { Test } from "~/test-components/root-relative-imported-class-composition";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/root-relative-imported-class-composition/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="root-relative-imported-class-composition" className={styles.root}>
            Root relative imported class composition test
          </div>
        );
      }
    `,
    "app/test-components/root-relative-imported-class-composition/styles.module.css": css`
      .root {
        background: peachpuff;
        composes: padding from "~/test-components/root-relative-imported-class-composition/import.module.css";
      }
    `,
    "app/test-components/root-relative-imported-class-composition/import.module.css": css`
      .padding {
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("root relative imported class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/root-relative-imported-class-composition-test");
    let locator = await page.locator(
      "[data-testid='root-relative-imported-class-composition']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let globalClassCompositionFixture = () => ({
    "app/routes/global-class-composition-test.tsx": js`
      import { Test } from "~/test-components/global-class-composition";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/global-class-composition/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="global-class-composition" className={styles.root}>
            Global class composition test
          </div>
        );
      }
    `,
    "app/test-components/global-class-composition/styles.module.css": css`
      .root {
        background: peachpuff;
        composes: padding from global;
      }
      :global(.padding) {
        padding: ${TEST_PADDING_VALUE};
      }
    `,
  });
  test("global class composition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/global-class-composition-test");
    let locator = await page.locator(
      "[data-testid='global-class-composition']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let localValueFixture = () => ({
    "app/routes/local-value-test.tsx": js`
      import { Test } from "~/test-components/local-value";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/local-value/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="local-value" className={styles.root}>
            Local @value test
          </div>
        );
      }
    `,
    "app/test-components/local-value/styles.module.css": css`
      @value padding: ${TEST_PADDING_VALUE};
      .root {
        background: peachpuff;
        padding: padding;
      }
    `,
  });
  test("local @value", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/local-value-test");
    let locator = await page.locator("[data-testid='local-value']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let importedValueFixture = () => ({
    "app/routes/imported-value-test.tsx": js`
      import { Test } from "~/test-components/imported-value";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/imported-value/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="imported-value" className={styles.root}>
            Imported @value test
          </div>
        );
      }
    `,
    "app/test-components/imported-value/styles.module.css": css`
      @value padding from "./values.module.css";
      .root {
        background: peachpuff;
        padding: padding;
      }
    `,
    "app/test-components/imported-value/values.module.css": css`
      @value padding: ${TEST_PADDING_VALUE};
    `,
  });
  test("imported @value", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/imported-value-test");
    let locator = await page.locator("[data-testid='imported-value']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let rootRelativeImportedValueFixture = () => ({
    "app/routes/root-relative-imported-value-test.tsx": js`
      import { Test } from "~/test-components/root-relative-imported-value";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/root-relative-imported-value/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="root-relative-imported-value" className={styles.root}>
            Root relative imported @value test
          </div>
        );
      }
    `,
    "app/test-components/root-relative-imported-value/styles.module.css": css`
      @value padding from "~/test-components/root-relative-imported-value/values.module.css";
      .root {
        background: peachpuff;
        padding: padding;
      }
    `,
    "app/test-components/root-relative-imported-value/values.module.css": css`
      @value padding: ${TEST_PADDING_VALUE};
    `,
  });
  test("root relative imported @value", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/root-relative-imported-value-test");
    let locator = await page.locator(
      "[data-testid='root-relative-imported-value']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let imageUrlsFixture = () => ({
    "app/routes/image-urls-test.tsx": js`
      import { Test } from "~/test-components/image-urls";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/image-urls/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="image-urls" className={styles.root}>
            Image URLs test
          </div>
        );
      }
    `,
    "app/test-components/image-urls/styles.module.css": css`
      .root {
        background-color: peachpuff;
        background-image: url(./image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/test-components/image-urls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
  });
  test("image URLs", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/image-urls-test");
    let locator = await page.locator("[data-testid='image-urls']");
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let rootRelativeImageUrlsFixture = () => ({
    "app/routes/root-relative-image-urls-test.tsx": js`
      import { Test } from "~/test-components/root-relative-image-urls";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/root-relative-image-urls/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="root-relative-image-urls" className={styles.root}>
            Root relative image URLs test
          </div>
        );
      }
    `,
    "app/test-components/root-relative-image-urls/styles.module.css": css`
      .root {
        background-color: peachpuff;
        background-image: url(~/test-components/root-relative-image-urls/image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/test-components/root-relative-image-urls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
  });
  test("root relative image URLs", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/root-relative-image-urls-test");
    let locator = await page.locator(
      "[data-testid='root-relative-image-urls']"
    );
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let absoluteImageUrlsFixture = () => ({
    "app/routes/absolute-image-urls-test.tsx": js`
      import { Test } from "~/test-components/absolute-image-urls";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/absolute-image-urls/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="absolute-image-urls" className={styles.root}>
            Image URLs test
          </div>
        );
      }
    `,
    "app/test-components/absolute-image-urls/styles.module.css": css`
      .root {
        background-color: peachpuff;
        background-image: url(/absolute-image-urls/image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "public/absolute-image-urls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
  });
  test("absolute image URLs", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let imgStatus: number | null = null;
    app.page.on("response", (res) => {
      if (res.url().endsWith(".svg")) imgStatus = res.status();
    });
    await app.goto("/absolute-image-urls-test");
    let locator = await page.locator("[data-testid='absolute-image-urls']");
    let backgroundImage = await locator.evaluate(
      (element) => window.getComputedStyle(element).backgroundImage
    );
    expect(backgroundImage).toContain(".svg");
    expect(imgStatus).toBe(200);
  });

  let clientEntrySideEffectsFixture = () => ({
    "app/entry.client.tsx": js`
      import { RemixBrowser } from "@remix-run/react";
      import { startTransition, StrictMode } from "react";
      import { hydrateRoot } from "react-dom/client";
      import "./entry.client.module.css";
      const hydrate = () => {
        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <RemixBrowser />
            </StrictMode>
          );
        });
      };
      if (window.requestIdleCallback) {
        window.requestIdleCallback(hydrate);
      } else {
        // Safari doesn't support requestIdleCallback
        // https://caniuse.com/requestidlecallback
        window.setTimeout(hydrate, 1);
      }
    `,
    "app/entry.client.module.css": css`
      :global(.clientEntry) {
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/routes/client-entry-side-effects-test.tsx": js`
      export default function() {
        return (
          <div data-testid="client-entry-side-effects" className="clientEntry">
            Client entry side effects test
          </div>
        );
      }
    `,
  });
  test("client entry side effects", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/client-entry-side-effects-test");
    let locator = await page.locator(
      "[data-testid='client-entry-side-effects']"
    );
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let deduplicatedCssFixture = () => ({
    "app/routes/deduplicated-css-test.tsx": js`
      import { Test } from "~/test-components/deduplicated-css";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/deduplicated-css/index.tsx": js`
      import styles_1 from "./styles_1.module.css";
      import styles_2 from "./styles_2.module.css";
      import sharedStyles from "./shared.module.css";
      export function Test() {
        return (
          <div
            data-testid="deduplicated-css"
            data-deduplicated-class-name={sharedStyles.deduplicated}
            className={[
              styles_1.root,
              styles_2.root,
            ].join(' ')}
            >
            Deduplicated CSS test
          </div>
        );
      }
    `,
    "app/test-components/deduplicated-css/styles_1.module.css": css`
      .root {
        composes: deduplicated from "./shared.module.css";
      }
    `,
    "app/test-components/deduplicated-css/styles_2.module.css": css`
      .root {
        composes: deduplicated from "./shared.module.css";
      }
    `,
    "app/test-components/deduplicated-css/shared.module.css": css`
      .deduplicated {
        background: peachpuff;
      }
    `,
  });
  test("deduplicated CSS", async ({ page }) => {
    // Using `composes: xxx from "./another.module.css"` leads
    // to duplicate CSS in the final bundle prior to optimization.
    // This test ensures the optimization does in fact happen,
    // otherwise it could lead to very large CSS files if this
    // feature is used heavily.
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/deduplicated-css-test");

    let element = await app.getElement("[data-testid='deduplicated-css']");
    let deduplicatedClassName = element.data().deduplicatedClassName;

    if (typeof deduplicatedClassName !== "string") {
      throw new Error(
        "Couldn't find data-deduplicated-class-name value on test element"
      );
    }

    let [cssBundlePath] = await globby(["public/build/css-bundle-*.css"], {
      cwd: fixture.projectDir,
      absolute: true,
    });

    if (!cssBundlePath) {
      throw new Error("Couldn't find CSS bundle");
    }

    let cssBundleContents = await fse.readFile(cssBundlePath, "utf8");

    let deduplicatedClassNameUsages = cssBundleContents.match(
      new RegExp(`\\.${deduplicatedClassName}`, "g")
    );

    expect(deduplicatedClassNameUsages?.length).toBe(1);
  });

  let uniqueClassNamesFixture = () => ({
    "app/routes/unique-class-names-test.tsx": js`
      import { Test } from "~/test-components/unique-class-names";
      export default function() {
        return <Test />;
      }
    `,
    "app/test-components/unique-class-names/index.tsx": js`
      import styles from "./styles.module.css";
      export function Test() {
        return (
          <div data-testid="unique-class-names" className={[styles.background, styles.color].join(' ')}>
            Unique class names test
          </div>
        );
      }
    `,
    "app/test-components/unique-class-names/styles.module.css": css`
      .background {
        background: peachpuff;
      }
      .color {
        color: coral;
      }
    `,
  });
  test("unique class names", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/unique-class-names-test");
    let element = await app.getElement("[data-testid='unique-class-names']");
    let classNames = element.attr("class")?.split(" ");
    expect(new Set(classNames).size).toBe(2);
  });

  let treeShakingFixture = () => ({
    "app/routes/tree-shaking-test.tsx": js`
      import { UsedTest } from "~/test-components/tree-shaking";
      export default function() {
        return <UsedTest />;
      }
    `,
    "app/test-components/tree-shaking/index.ts": js`
      export { UsedTest } from "./used";
      export { UnusedTest } from "./unused";
    `,
    "app/test-components/tree-shaking/used/index.tsx": js`
      import styles from "./styles.module.css";
      export function UsedTest() {
        return (
          <div data-testid="tree-shaking" className={[styles.root, 'global-class-from-unused-component'].join(' ')}>
            Tree shaking test
          </div>
        );
      }
    `,
    "app/test-components/tree-shaking/used/styles.module.css": css`
      .root {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/test-components/tree-shaking/unused/index.tsx": js`
      import styles from "./styles.module.css";
      export function UnusedTest() {
        return (
          <div data-testid="tree-shaking" className={[styles.root, 'global-class-from-unused-component'].join(' ')}>
            Unused component
          </div>
        );
      }
    `,
    "app/test-components/tree-shaking/unused/styles.module.css": css`
      :global(.global-class-from-unused-component) {
        padding: 999px !important;
      }
      .root {
        background: peachpuff;
      }
    `,
  });
  test("tree shaking of unused component styles", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/tree-shaking-test");
    let locator = await page.locator("[data-testid='tree-shaking']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
});
