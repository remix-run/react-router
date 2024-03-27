import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  css,
  js,
  json,
} from "./helpers/create-fixture.js";

const TEST_PADDING_VALUE = "20px";

test.describe("CSS side-effect imports", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      config: {
        serverDependenciesToBundle: ["react", /@test-package/],
      },
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
        ...basicSideEffectFixture(),
        ...rootRelativeFixture(),
        ...imageUrlsFixture(),
        ...rootRelativeImageUrlsFixture(),
        ...absoluteImageUrlsFixture(),
        ...jsxInJsFileFixture(),
        ...commonJsPackageFixture(),
        ...esmPackageFixture(),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  let basicSideEffectFixture = () => ({
    "app/basicSideEffect/styles.css": css`
      .basicSideEffect {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/routes/basic-side-effect-test.tsx": js`
      import "../basicSideEffect/styles.css";

      export default function() {
        return (
          <div data-testid="basic-side-effect" className="basicSideEffect">
            Basic side effect test
          </div>
        )
      }
    `,
  });
  test("basic side effect", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/basic-side-effect-test");
    let locator = await page.locator("[data-testid='basic-side-effect']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let rootRelativeFixture = () => ({
    "app/rootRelative/styles.css": css`
      .rootRelative {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/routes/root-relative-test.tsx": js`
      import "~/rootRelative/styles.css";

      export default function() {
        return (
          <div data-testid="root-relative" className="rootRelative">
            Root relative import test
          </div>
        )
      }
    `,
  });
  test("root relative", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/root-relative-test");
    let locator = await page.locator("[data-testid='root-relative']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let imageUrlsFixture = () => ({
    "app/imageUrls/styles.css": css`
      .imageUrls {
        background-color: peachpuff;
        background-image: url(./image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/imageUrls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/image-urls-test.tsx": js`
      import "../imageUrls/styles.css";

      export default function() {
        return (
          <div data-testid="image-urls" className="imageUrls">
            Image URLs test
          </div>
        )
      }
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
    "app/rootRelativeImageUrls/styles.css": css`
      .rootRelativeImageUrls {
        background-color: peachpuff;
        background-image: url(~/rootRelativeImageUrls/image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/rootRelativeImageUrls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/root-relative-image-urls-test.tsx": js`
      import "../rootRelativeImageUrls/styles.css";

      export default function() {
        return (
          <div data-testid="root-relative-image-urls" className="rootRelativeImageUrls">
            Image URLs test
          </div>
        )
      }
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
    "app/absoluteImageUrls/styles.css": css`
      .absoluteImageUrls {
        background-color: peachpuff;
        background-image: url(/absoluteImageUrls/image.svg);
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "public/absoluteImageUrls/image.svg": `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="coral" />
      </svg>
    `,
    "app/routes/absolute-image-urls-test.tsx": js`
      import "../absoluteImageUrls/styles.css";

      export default function() {
        return (
          <div data-testid="absolute-image-urls" className="absoluteImageUrls">
            Absolute image URLs test
          </div>
        )
      }
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

  let jsxInJsFileFixture = () => ({
    "app/jsxInJsFile/styles.css": css`
      .jsxInJsFile {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "app/routes/jsx-in-js-file-test.js": js`
      import "../jsxInJsFile/styles.css";

      export default function() {
        return (
          <div data-testid="jsx-in-js-file" className="jsxInJsFile">
            JSX in JS file test
          </div>
        )
      }
    `,
  });
  test("JSX in JS file", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/jsx-in-js-file-test");
    let locator = await page.locator("[data-testid='jsx-in-js-file']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let commonJsPackageFixture = () => ({
    "node_modules/@test-package/commonjs/styles.css": css`
      .commonJsPackage {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "node_modules/@test-package/commonjs/index.js": js`
      var React = require('react');
      require('./styles.css');

      exports.Test = function() {
        return React.createElement(
          'div',
          {
            'data-testid': 'commonjs-package',
            'className': 'commonJsPackage'
          },
          'CommonJS package test',
        );
      };
    `,
    "node_modules/@test-package/commonjs/package.json": json({
      main: "./index.js",
    }),
    "app/routes/commonjs-package-test.jsx": js`
      import { Test } from "@test-package/commonjs";
      export default function() {
        return <Test />;
      }
    `,
  });
  test("CommonJS package", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/commonjs-package-test");
    let locator = await page.locator("[data-testid='commonjs-package']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });

  let esmPackageFixture = () => ({
    "node_modules/@test-package/esm/styles.css": css`
      .esmPackage {
        background: peachpuff;
        padding: ${TEST_PADDING_VALUE};
      }
    `,
    "node_modules/@test-package/esm/index.mjs": js`
      import React from 'react';
      import './styles.css';

      export function Test() {
        return React.createElement(
          'div',
          {
            'data-testid': 'esm-package',
            'className': 'esmPackage'
          },
          'ESM package test',
        );
      };
    `,
    "node_modules/@test-package/esm/package.json": json({
      exports: "./index.mjs",
    }),
    "app/routes/esm-package-test.tsx": js`
      import { Test } from "@test-package/esm";
      export default function() {
        return <Test />;
      }
    `,
  });
  test("ESM package", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/esm-package-test");
    let locator = await page.locator("[data-testid='esm-package']");
    let padding = await locator.evaluate(
      (element) => window.getComputedStyle(element).padding
    );
    expect(padding).toBe(TEST_PADDING_VALUE);
  });
});
