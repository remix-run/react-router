import * as path from "node:path";
import { test, expect } from "@playwright/test";
import shell from "shelljs";
import glob from "glob";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("Vite build", () => {
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
        ".env": `
          ENV_VAR_FROM_DOTENV_FILE=true
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { vitePlugin as remix } from "@remix-run/dev";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            build: {
              // force emitting asset files instead of inlined as data-url
              assetsInlineLimit: 0,
            },
            plugins: [
              mdx(),
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
                    <h1>Root</h1>
                    <Outlet />
                  </div>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          import { useState, useEffect } from "react";
          import { json } from "@remix-run/node";

          import { serverOnly1, serverOnly2 } from "../utils.server";

          export const loader = () => {
            return json({ serverOnly1 })
          }

          export const action = () => {
            console.log(serverOnly2)
            return null
          }

          export default function() {
            const [mounted, setMounted] = useState(false);
            useEffect(() => {
              setMounted(true);
            }, []);

            return (
              <>
                <h2>Index</h2>
                {!mounted ? <h3>Loading...</h3> : <h3 data-mounted>Mounted</h3>}
              </>
            );
          }
        `,
        "app/utils.server.ts": js`
          export const serverOnly1 = "SERVER_ONLY_1"
          export const serverOnly2 = "SERVER_ONLY_2"
        `,
        "app/routes/resource.ts": js`
          import { json } from "@remix-run/node";

          import { serverOnly1, serverOnly2 } from "../utils.server";

          export const loader = () => {
            return json({ serverOnly1 })
          }

          export const action = () => {
            console.log(serverOnly2)
            return null
          }
        `,
        "app/routes/mdx.mdx": js`
          import { useEffect, useState } from "react";
          import { json } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react";

          import { serverOnly1, serverOnly2 } from "../utils.server";

          export const loader = () => {
            return json({
              serverOnly1,
              content: "MDX route content from loader",
            })
          }

          export const action = () => {
            console.log(serverOnly2)
            return null
          }

          export function MdxComponent() {
            const [mounted, setMounted] = useState(false);
            useEffect(() => {
              setMounted(true);
            }, []);
            const { content } = useLoaderData();
            const text = content + (mounted
              ? ": mounted"
              : ": not mounted");
            return <div data-mdx-route>{text}</div>
          }

          ## MDX Route

          <MdxComponent />
        `,
        "app/routes/code-split1.tsx": js`
          import { CodeSplitComponent } from "../code-split-component";

          export default function CodeSplit1Route() {
            return <div id="code-split1"><CodeSplitComponent /></div>;
          }
        `,
        "app/routes/code-split2.tsx": js`
          import { CodeSplitComponent } from "../code-split-component";

          export default function CodeSplit2Route() {
            return <div id="code-split2"><CodeSplitComponent /></div>;
          }
        `,
        "app/code-split-component.tsx": js`
          import classes from "./code-split.module.css";

          export function CodeSplitComponent() {
            return <span className={classes.test}>ok</span>
          }
        `,
        "app/code-split.module.css": js`
          .test {
            background-color: rgb(255, 170, 0);
          }
        `,
        "app/routes/dotenv.tsx": js`
          import { json } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react";

          export const loader = () => {
            return json({
              loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE ?? '.env file was NOT loaded, which is a good thing',
            })
          }

          export default function DotenvRoute() {
            const { loaderContent } = useLoaderData();

            return <div data-dotenv-route-loader-content>{loaderContent}</div>;
          }
        `,

        "app/assets/test.txt": "test",
        "app/routes/ssr-only-assets.tsx": js`
          import txtUrl from "../assets/test.txt?url";
          import { useLoaderData } from "@remix-run/react"

          export const loader: LoaderFunction = () => {
            return { txtUrl };
          };

          export default function SsrOnlyAssetsRoute() {
            const loaderData = useLoaderData();
            return (
              <div>
                <a href={loaderData.txtUrl}>txtUrl</a>
              </div>
            );
          }
        `,

        "app/assets/test.css": ".test{color:red}",
        "app/routes/ssr-only-css-url-files.tsx": js`
          import cssUrl from "../assets/test.css?url";
          import { useLoaderData } from "@remix-run/react"

          export const loader: LoaderFunction = () => {
            return { cssUrl };
          };

          export default function SsrOnlyCssUrlFilesRoute() {
            const loaderData = useLoaderData();
            return (
              <div>
                <a href={loaderData.cssUrl}>cssUrl</a>
              </div>
            );
          }
        `,

        "app/routes/ssr-code-split.tsx": js`
          import { useLoaderData } from "@remix-run/react"

          export const loader: LoaderFunction = async () => {
            const lib = await import("../ssr-code-split-lib");
            return lib.ssrCodeSplitTest();
          };

          export default function SsrCodeSplitRoute() {
            const loaderData = useLoaderData();
            return (
              <div data-ssr-code-split>{loaderData}</div>
            );
          }
        `,

        "app/ssr-code-split-lib.ts": js`
          export function ssrCodeSplitTest() {
            return "ssrCodeSplitTest";
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("server code is removed from client build", async () => {
    let clientBuildDir = path.join(fixture.projectDir, "build/client");

    // detect client asset files
    let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
      cwd: clientBuildDir,
      absolute: true,
    });

    // grep for server-only values in client assets
    let result = shell
      .grep("-l", /SERVER_ONLY_1|SERVER_ONLY_2/, assetFiles)
      .stdout.trim()
      .split("\n")
      .filter((line) => line.length > 0);

    expect(result).toHaveLength(0);
  });

  test("server renders matching routes", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(selectHtml(await res.text(), "#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Index</h2>
  <h3>Loading...</h3>
</div>`);
  });

  test("hydrates", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await page.locator("#content h2").textContent()).toBe("Index");
    expect(await page.locator("#content h3[data-mounted]").textContent()).toBe(
      "Mounted"
    );
  });

  test("server renders matching MDX routes", async ({ page }) => {
    let res = await fixture.requestDocument("/mdx");
    expect(res.status).toBe(200);
    expect(selectHtml(await res.text(), "[data-mdx-route]")).toBe(
      `<div data-mdx-route="true">MDX route content from loader: not mounted</div>`
    );
  });

  test("hydrates matching MDX routes", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/mdx");
    await expect(page.locator("[data-mdx-route]")).toContainText(
      "MDX route content from loader: mounted"
    );

    expect(pageErrors).toEqual([]);
  });

  test("emits SSR-only assets to the client assets directory", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/ssr-only-assets");

    await page.getByRole("link", { name: "txtUrl" }).click();
    await page.waitForURL("**/assets/test-*.txt");
    await expect(page.getByText("test")).toBeVisible();
  });

  test("emits SSR-only .css?url files to the client assets directory", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/ssr-only-css-url-files");

    await page.getByRole("link", { name: "cssUrl" }).click();
    await page.waitForURL("**/assets/test-*.css");
    await expect(page.getByText(".test{")).toBeVisible();
  });

  test("supports code-split JS from SSR build", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/ssr-code-split`);
    expect(pageErrors).toEqual([]);

    await expect(page.locator("[data-ssr-code-split]")).toHaveText(
      "ssrCodeSplitTest"
    );

    expect(pageErrors).toEqual([]);
  });

  test("removes assets (other than code-split JS) and CSS files from SSR build", async () => {
    let assetFiles = glob.sync("*", {
      cwd: path.join(fixture.projectDir, "build/server/assets"),
    });
    let [asset, ...rest] = assetFiles;
    expect(rest).toEqual([]); // Provide more useful test output if this fails
    expect(asset).toMatch(/ssr-code-split-lib-.*\.js/);
  });

  test("supports code-split css", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/code-split1");
    expect(
      await page
        .locator("#code-split1 span")
        .evaluate((e) => window.getComputedStyle(e).backgroundColor)
    ).toBe("rgb(255, 170, 0)");

    await app.goto("/code-split2");
    expect(
      await page
        .locator("#code-split2 span")
        .evaluate((e) => window.getComputedStyle(e).backgroundColor)
    ).toBe("rgb(255, 170, 0)");

    expect(pageErrors).toEqual([]);
  });

  test("doesn't load .env file", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/dotenv`);
    expect(pageErrors).toEqual([]);

    let loaderContent = page.locator("[data-dotenv-route-loader-content]");
    await expect(loaderContent).toHaveText(
      ".env file was NOT loaded, which is a good thing"
    );

    expect(pageErrors).toEqual([]);
  });
});
