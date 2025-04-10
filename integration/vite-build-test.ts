import * as path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";
import glob from "glob";

import {
  createProject,
  build,
  reactRouterServe,
  reactRouterConfig,
  viteConfig,
  grep,
  viteMajorTemplates,
} from "./helpers/vite.js";

let port: number;
let cwd: string;
let stop: () => void;

const js = String.raw;

test.describe("Build", () => {
  [false, true].forEach((viteEnvironmentApi) => {
    viteMajorTemplates.forEach(({ templateName, templateDisplayName }) => {
      // Vite 5 doesn't support the Environment API
      if (templateName === "vite-5-template" && viteEnvironmentApi) {
        return;
      }

      test.describe(`${templateDisplayName}${
        viteEnvironmentApi ? " with Vite Environment API" : ""
      }`, () => {
        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              ".env": `
                ENV_VAR_FROM_DOTENV_FILE=true
              `,
              "react-router.config.ts": reactRouterConfig({
                viteEnvironmentApi,
              }),
              "vite.config.ts": js`
                import { defineConfig } from "vite";
                import { reactRouter } from "@react-router/dev/vite";
                import mdx from "@mdx-js/rollup";

                export default defineConfig({
                  ${await viteConfig.server({ port })}
                  ${viteConfig.build({
                    assetsInlineLimit: 0,
                  })}
                  plugins: [
                    mdx(),
                    reactRouter(),
                  ],
                });
              `,
              "app/root.tsx": js`
                import { Links, Meta, Outlet, Scripts } from "react-router";

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

                import { serverOnly1, serverOnly2 } from "../utils.server";

                export const loader = () => {
                  return { serverOnly1 }
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
                import { serverOnly1, serverOnly2 } from "../utils.server";

                export const loader = () => {
                  return { serverOnly1 }
                }

                export const action = () => {
                  console.log(serverOnly2)
                  return null
                }
              `,
              "app/routes/mdx.mdx": js`
                import { useEffect, useState } from "react";
                import { useLoaderData } from "react-router";

                import { serverOnly1, serverOnly2 } from "../utils.server";

                export const loader = () => {
                  return {
                    serverOnly1,
                    content: "MDX route content from loader",
                  }
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
                import { useLoaderData } from "react-router";

                export const loader = () => {
                  return {
                    loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE ?? '.env file was NOT loaded, which is a good thing',
                  }
                }

                export default function DotenvRoute() {
                  const { loaderContent } = useLoaderData();

                  return <div data-dotenv-route-loader-content>{loaderContent}</div>;
                }
              `,

              "app/assets/test.txt": "test",
              "app/routes/ssr-only-assets.tsx": js`
                import txtUrl from "../assets/test.txt?url";
                import { useLoaderData } from "react-router"

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
                import { useLoaderData } from "react-router"

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
                import { useLoaderData } from "react-router"

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
            templateName
          );

          let { stderr, status } = build({ cwd });
          expect(
            stderr
              .toString()
              // This can be removed when this issue is fixed: https://github.com/remix-run/remix/issues/9055
              .replace('Generated an empty chunk: "resource".', "")
              .trim()
          ).toBeFalsy();
          expect(status).toBe(0);
          stop = await reactRouterServe({ cwd, port });
        });
        test.afterAll(() => stop());

        test("server code is removed from client build", async () => {
          expect(
            grep(path.join(cwd, "build/client"), /SERVER_ONLY_1/).length
          ).toBe(0);
          expect(
            grep(path.join(cwd, "build/client"), /SERVER_ONLY_2/).length
          ).toBe(0);
        });

        test("renders matching MDX routes", async ({ page }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/mdx`, {
            waitUntil: "networkidle",
          });
          await expect(page.locator("[data-mdx-route]")).toHaveText(
            "MDX route content from loader: mounted"
          );
          expect(pageErrors).toEqual([]);
        });

        test("emits SSR-only assets to the client assets directory", async ({
          page,
        }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/ssr-only-assets`, {
            waitUntil: "networkidle",
          });

          await page.getByRole("link", { name: "txtUrl" }).click();
          await page.waitForURL("**/assets/test-*.txt");
          await expect(page.getByText("test")).toBeVisible();
          expect(pageErrors).toEqual([]);
        });

        test("emits SSR-only .css?url files to the client assets directory", async ({
          page,
        }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/ssr-only-css-url-files`, {
            waitUntil: "networkidle",
          });

          await page.getByRole("link", { name: "cssUrl" }).click();
          await page.waitForURL("**/assets/test-*.css");
          await expect(page.getByText(".test{")).toBeVisible();
          expect(pageErrors).toEqual([]);
        });

        test("supports code-split JS from SSR build", async ({ page }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/ssr-code-split`, {
            waitUntil: "networkidle",
          });

          await expect(page.locator("[data-ssr-code-split]")).toHaveText(
            "ssrCodeSplitTest"
          );
          expect(pageErrors).toEqual([]);
        });

        test("removes assets (other than code-split JS) and CSS files from SSR build", async () => {
          let assetFiles = glob.sync("build/server/assets/**/*", { cwd });
          let [asset, ...rest] = assetFiles;
          expect(rest).toEqual([]); // Provide more useful test output if this fails
          expect(asset).toMatch(/ssr-code-split-lib-.*\.js/);
        });

        test("supports code-split CSS", async ({ page }) => {
          let pageErrors: unknown[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/code-split1`, {
            waitUntil: "networkidle",
          });
          expect(
            await page
              .locator("#code-split1 span")
              .evaluate((e) => window.getComputedStyle(e).backgroundColor)
          ).toBe("rgb(255, 170, 0)");

          await page.goto(`http://localhost:${port}/code-split2`, {
            waitUntil: "networkidle",
          });
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

          await page.goto(`http://localhost:${port}/dotenv`, {
            waitUntil: "networkidle",
          });
          expect(pageErrors).toEqual([]);

          let loaderContent = page.locator(
            "[data-dotenv-route-loader-content]"
          );
          await expect(loaderContent).toHaveText(
            ".env file was NOT loaded, which is a good thing"
          );

          expect(pageErrors).toEqual([]);
        });
      });
    });
  });
});
