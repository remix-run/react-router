import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import {
  createProject,
  createEditor,
  dev,
  build,
  reactRouterServe,
  customDev,
  EXPRESS_SERVER,
  reactRouterConfig,
  viteConfig,
  viteMajorTemplates,
} from "./helpers/vite.js";

const js = String.raw;
const css = String.raw;

const PADDING = "20px";
const NEW_PADDING = "30px";

const files = {
  "postcss.config.js": js`
    export default ({
      plugins: [
        {
          // Minimal PostCSS plugin to test that it's being used
          postcssPlugin: 'replace',
          Declaration (decl) {
            decl.value = decl.value
              .replace(
                /NEW_PADDING_INJECTED_VIA_POSTCSS/g,
                ${JSON.stringify(NEW_PADDING)},
              )
              .replace(
                /PADDING_INJECTED_VIA_POSTCSS/g,
                ${JSON.stringify(PADDING)},
              );
          },
        },
      ],
    });
  `,
  "app/entry.client.tsx": js`
    import "./entry.client.css";

    import { HydratedRouter } from "react-router/dom";
    import { startTransition, StrictMode } from "react";
    import { hydrateRoot } from "react-dom/client";

    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      );
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
            <Outlet />
            <Scripts />
          </body>
        </html>
      );
    }
  `,
  "app/entry.client.css": css`
    .entry-client {
      background: pink;
      padding: ${PADDING};
    }
  `,
  "app/styles-bundled.css": css`
    .index_bundled {
      background: papayawhip;
      padding: ${PADDING};
    }
  `,
  "app/styles-postcss-linked.css": css`
    .index_postcss_linked {
      background: salmon;
      padding: PADDING_INJECTED_VIA_POSTCSS;
    }
  `,
  "app/styles.module.css": css`
    .index {
      background: peachpuff;
      padding: ${PADDING};
    }
  `,
  "app/styles-vanilla-global.css.ts": js`
    import { createVar, globalStyle } from "@vanilla-extract/css";

    globalStyle(".index_vanilla_global", {
      background: "lightgreen",
      padding: "${PADDING}",
    });
  `,
  "app/styles-vanilla-local.css.ts": js`
    import { style } from "@vanilla-extract/css";

    export const index = style({
      background: "lightblue",
      padding: "${PADDING}",
    });
  `,
  "app/routes/_index.tsx": js`
    import "../styles-bundled.css";
    import postcssLinkedStyles from "../styles-postcss-linked.css?url";
    import cssModulesStyles from "../styles.module.css";
    import "../styles-vanilla-global.css";
    import * as stylesVanillaLocal from "../styles-vanilla-local.css";

    export function links() {
      return [{ rel: "stylesheet", href: postcssLinkedStyles }];
    }

    export default function IndexRoute() {
      return (
        <>
          <input />
          <div id="entry-client" className="entry-client">
            <div id="css-modules" className={cssModulesStyles.index}>
              <div id="css-postcss-linked" className="index_postcss_linked">
                <div id="css-bundled" className="index_bundled">
                  <div id="css-vanilla-global" className="index_vanilla_global">
                    <div id="css-vanilla-local" className={stylesVanillaLocal.index}>
                      <h2>CSS test</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
  `,
};

const VITE_CONFIG = async ({
  port,
  base,
}: {
  port: number;
  base?: string;
}) => dedent`
  import { reactRouter } from "@react-router/dev/vite";
  import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

  export default {
    ${await viteConfig.server({ port })}
    ${base ? `base: "${base}",` : ""}
    plugins: [
      reactRouter(),
      vanillaExtractPlugin({
        emitCssInSsr: true,
      }),
    ],
  }
`;

test.describe("Vite CSS", () => {
  viteMajorTemplates.forEach(({ templateName, templateDisplayName }) => {
    test.describe(templateDisplayName, () => {
      test.describe("vite dev", async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig({
                viteEnvironmentApi: templateName === "vite-6-template",
              }),
              "vite.config.ts": await VITE_CONFIG({ port }),
              ...files,
            },
            templateName
          );
          stop = await dev({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
            await hmrWorkflow({ page, port, cwd });
          });
        });
      });

      test.describe("vite dev with custom base", async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;
        let base = "/custom/base/";

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig({
                viteEnvironmentApi: templateName === "vite-6-template",
                basename: base,
              }),
              "vite.config.ts": await VITE_CONFIG({ port, base }),
              ...files,
            },
            templateName
          );
          stop = await dev({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, base });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, base });
            await hmrWorkflow({ page, port, cwd, base });
          });
        });
      });

      test.describe("express", async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject({
            "vite.config.ts": await VITE_CONFIG({ port }),
            "server.mjs": EXPRESS_SERVER({ port }),
            ...files,
          });
          stop = await customDev({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
            await hmrWorkflow({ page, port, cwd });
          });
        });
      });

      test.describe(async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject({
            "vite.config.ts": await VITE_CONFIG({ port }),
            ...files,
          });

          let edit = createEditor(cwd);
          await edit("package.json", (contents) =>
            contents.replace(
              '"sideEffects": false',
              '"sideEffects": ["*.css.ts"]'
            )
          );

          let { stderr, status } = build({
            cwd,
            env: {
              // Vanilla Extract uses Vite's CJS build which emits a warning to stderr
              VITE_CJS_IGNORE_WARNING: "true",
            },
          });
          expect(stderr.toString()).toBeFalsy();
          expect(status).toBe(0);
          stop = await reactRouterServe({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("vite build / without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("vite build / with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port });
          });
        });
      });
    });
  });
});

async function pageLoadWorkflow({
  page,
  port,
  base,
}: {
  page: Page;
  port: number;
  base?: string;
}) {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}${base ?? "/"}`, {
    waitUntil: "networkidle",
  });

  await Promise.all(
    [
      "#css-bundled",
      "#css-postcss-linked",
      "#css-modules",
      "#css-vanilla-global",
      "#css-vanilla-local",
    ].map(
      async (selector) =>
        await expect(page.locator(selector)).toHaveCSS("padding", PADDING)
    )
  );
}

async function hmrWorkflow({
  page,
  cwd,
  port,
  base,
}: {
  page: Page;
  cwd: string;
  port: number;
  base?: string;
}) {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}${base ?? "/"}`, {
    waitUntil: "networkidle",
  });

  let input = page.locator("input");
  await expect(input).toBeVisible();
  await input.type("stateful");
  await expect(input).toHaveValue("stateful");

  let edit = createEditor(cwd);
  let modifyCss = (contents: string) =>
    contents
      .replace(PADDING, NEW_PADDING)
      .replace(
        "PADDING_INJECTED_VIA_POSTCSS",
        "NEW_PADDING_INJECTED_VIA_POSTCSS"
      );

  await Promise.all([
    edit("app/styles-bundled.css", modifyCss),
    edit("app/styles.module.css", modifyCss),
    edit("app/styles-vanilla-global.css.ts", modifyCss),
    edit("app/styles-vanilla-local.css.ts", modifyCss),
    edit("app/styles-postcss-linked.css", modifyCss),
  ]);

  await Promise.all(
    [
      "#css-bundled",
      "#css-postcss-linked",
      "#css-modules",
      "#css-vanilla-global",
      "#css-vanilla-local",
    ].map(
      async (selector) =>
        await expect(page.locator(selector)).toHaveCSS("padding", NEW_PADDING)
    )
  );

  // Ensure CSS updates were handled by HMR
  await expect(input).toHaveValue("stateful");

  // The following change triggers a full page reload, so we check it after all the checks for HMR state preservation
  await edit("app/entry.client.css", modifyCss);
  await expect(page.locator("#entry-client")).toHaveCSS("padding", NEW_PADDING);

  expect(pageErrors).toEqual([]);
}
