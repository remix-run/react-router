import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

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
  type TemplateName,
} from "./helpers/vite.js";

const js = String.raw;
const css = String.raw;

const PADDING = "20px";
const NEW_PADDING = "30px";

const fixtures = [
  ...viteMajorTemplates,
  {
    templateName: "rsc-vite-framework",
    templateDisplayName: "RSC Vite Framework",
  },
] as const satisfies ReadonlyArray<{
  templateName: TemplateName;
  templateDisplayName: string;
}>;

type RouteBasePath =
  | "css-with-links-export"
  | "css-with-floated-link"
  | "rsc-server-first-route";
const getRouteBasePaths = (templateName: TemplateName) => {
  return [
    "css-with-links-export",
    "css-with-floated-link",
    ...(templateName.includes("rsc")
      ? (["rsc-server-first-route"] as const)
      : []),
  ] as const satisfies RouteBasePath[];
};

const files = ({ templateName }: { templateName: TemplateName }) => ({
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
  // RSC Framework mode doesn't support custom entries yet
  ...(!templateName.includes("rsc")
    ? {
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
        "app/entry.client.css": css`
          .entry-client {
            background: pink;
            padding: ${PADDING};
          }
        `,
      }
    : {}),
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
  ...Object.assign(
    {},
    ...getRouteBasePaths(templateName).map((routeBasePath) => {
      const isServerFirstRoute = routeBasePath === "rsc-server-first-route";
      const exportName = isServerFirstRoute ? "ServerComponent" : "default";

      return {
        [`app/routes/${routeBasePath}/styles-bundled.css`]: css`
          .${routeBasePath}-bundled {
            background: papayawhip;
            padding: ${PADDING};
          }
        `,
        [`app/routes/${routeBasePath}/styles-postcss-linked.css`]: css`
          .${routeBasePath}-postcss-linked {
            background: salmon;
            padding: PADDING_INJECTED_VIA_POSTCSS;
          }
        `,
        [`app/routes/${routeBasePath}/styles.module.css`]: css`
          .index {
            background: peachpuff;
            padding: ${PADDING};
          }
        `,
        [`app/routes/${routeBasePath}/styles-vanilla-global.css.ts`]: js`
          import { createVar, globalStyle } from "@vanilla-extract/css";

          globalStyle(".${routeBasePath}-vanilla-global", {
            background: "lightgreen",
            padding: "${PADDING}",
          });
        `,
        [`app/routes/${routeBasePath}/styles-vanilla-local.css.ts`]: js`
          import { style } from "@vanilla-extract/css";

          export const index = style({
            background: "lightblue",
            padding: "${PADDING}",
          });
        `,
        [`app/routes/${routeBasePath}/route.tsx`]: js`
          import "./styles-bundled.css";
          import postcssLinkedStyles from "./styles-postcss-linked.css?url";
          import cssModulesStyles from "./styles.module.css";
          import "./styles-vanilla-global.css";
          import * as stylesVanillaLocal from "./styles-vanilla-local.css";

          // Workaround for "Generated an empty chunk" warnings in RSC Framework Mode
          export function loader() {
            return null;
          }

          ${
            routeBasePath === "css-with-links-export"
              ? `export function links() { return [{ rel: "stylesheet", href: postcssLinkedStyles }]; }`
              : ""
          }

          function TestRoute() {
            return (
              <>
                <input />
                ${routeBasePath !== "css-with-links-export" ? `<link rel="stylesheet" href={postcssLinkedStyles} precedence="default" />` : ""}
                <div id="entry-client" className="entry-client">
                  <div id="css-modules" className={cssModulesStyles.index}>
                    <div id="css-postcss-linked" className="${routeBasePath}-postcss-linked">
                      <div id="css-bundled" className="${routeBasePath}-bundled">
                        <div id="css-vanilla-global" className="${routeBasePath}-vanilla-global">
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

          export ${exportName === "default" ? "default" : `const ${exportName} =`} TestRoute;
        `,
      };
    }),
  ),
});

test.describe("Vite CSS", () => {
  fixtures.forEach(({ templateName, templateDisplayName }) => {
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
                v8_viteEnvironmentApi: templateName !== "vite-5-template",
              }),
              "vite.config.ts": await viteConfig.basic({
                port,
                templateName,
                vanillaExtract: true,
              }),
              ...files({ templateName }),
            },
            templateName,
          );
          stop = await dev({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
            await hmrWorkflow({ page, port, cwd, templateName });
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
                v8_viteEnvironmentApi: templateName !== "vite-5-template",
                basename: base,
              }),
              "vite.config.ts": await viteConfig.basic({
                port,
                base,
                templateName,
                vanillaExtract: true,
              }),
              ...files({ templateName }),
            },
            templateName,
          );
          stop = await dev({ cwd, port, basename: base });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, base, templateName });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, base, templateName });
            await hmrWorkflow({ page, port, cwd, base, templateName });
          });
        });
      });

      test.describe("express", async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig({
                v8_viteEnvironmentApi: templateName !== "vite-5-template",
              }),
              "vite.config.ts": await viteConfig.basic({
                port,
                templateName,
                vanillaExtract: true,
              }),
              "server.mjs": EXPRESS_SERVER({ port, templateName }),
              ...files({ templateName }),
            },
            templateName,
          );
          stop = await customDev({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
            await hmrWorkflow({ page, port, cwd, templateName });
          });
        });
      });

      test.describe("vite build", async () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig({
                v8_viteEnvironmentApi: templateName !== "vite-5-template",
              }),
              "vite.config.ts": await viteConfig.basic({
                port,
                templateName,
                vanillaExtract: true,
              }),
              ...files({ templateName }),
            },
            templateName,
          );

          let edit = createEditor(cwd);
          await edit("package.json", (contents) =>
            contents.replace(
              '"sideEffects": false',
              '"sideEffects": ["*.css.ts"]',
            ),
          );

          let { stderr, status } = build({
            cwd,
            env: {
              // Vanilla Extract uses Vite's CJS build which emits a warning to stderr
              VITE_CJS_IGNORE_WARNING: "true",
            },
          });
          let stderrString = stderr.toString();
          if (templateName.includes("rsc")) {
            // In RSC builds, the same assets can be generated multiple times
            stderrString = stderrString.replace(
              /The emitted file ".*?" overwrites a previously emitted file of the same name\.\n?/g,
              "",
            );
          }
          expect(stderrString).toBeFalsy();
          expect(status).toBe(0);
          stop = await reactRouterServe({ cwd, port });
        });
        test.afterAll(() => stop());

        test.describe(() => {
          test.use({ javaScriptEnabled: false });
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
          });
        });
      });

      test.describe("vite build with CSS code splitting disabled", async () => {
        test.fixme(
          templateName.includes("rsc"),
          "RSC Framework mode doesn't support disabling CSS code splitting yet (likely due to @vitejs/plugin-rsc)",
        );

        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig({
                v8_viteEnvironmentApi: templateName !== "vite-5-template",
              }),
              "vite.config.ts": await viteConfig.basic({
                port,
                templateName,
                cssCodeSplit: false,
                vanillaExtract: true,
              }),
              ...files({ templateName }),
            },
            templateName,
          );

          let edit = createEditor(cwd);
          await edit("package.json", (contents) =>
            contents.replace(
              '"sideEffects": false',
              '"sideEffects": ["*.css.ts"]',
            ),
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
          test("without JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
          });
        });

        test.describe(() => {
          test.use({ javaScriptEnabled: true });
          test("with JS", async ({ page }) => {
            await pageLoadWorkflow({ page, port, templateName });
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
  templateName,
}: {
  page: Page;
  port: number;
  base?: string;
  templateName: TemplateName;
}) {
  for (const routeBase of getRouteBasePaths(templateName)) {
    let pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${port}${base ?? "/"}${routeBase}`, {
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
          await expect(page.locator(selector)).toHaveCSS("padding", PADDING),
      ),
    );
  }
}

async function hmrWorkflow({
  page,
  cwd,
  port,
  base,
  templateName,
}: {
  page: Page;
  cwd: string;
  port: number;
  base?: string;
  templateName: TemplateName;
}) {
  for (const routeBase of getRouteBasePaths(templateName)) {
    let pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${port}${base ?? "/"}${routeBase}`, {
      waitUntil: "networkidle",
    });

    let input = page.locator("input");
    await expect(input).toBeVisible();

    let edit = createEditor(cwd);
    let modifyCss = (contents: string) =>
      contents
        .replace(PADDING, NEW_PADDING)
        .replace(
          "PADDING_INJECTED_VIA_POSTCSS",
          "NEW_PADDING_INJECTED_VIA_POSTCSS",
        );

    const testCases = [
      {
        file: "styles-bundled.css",
        selector: "#css-bundled",
      },
      {
        file: "styles.module.css",
        selector: "#css-modules",
      },
      {
        file: "styles-postcss-linked.css",
        selector: "#css-postcss-linked",
      },
      {
        file: "styles-vanilla-global.css.ts",
        selector: "#css-vanilla-global",
      },
      // Vanilla Extract's HMR isn't working for RSC server-first routes
      ...(routeBase === "rsc-server-first-route"
        ? []
        : ([
            {
              file: "styles-vanilla-local.css.ts",
              selector: "#css-vanilla-local",
            },
          ] as const)),
    ] as const satisfies Array<{
      file: string;
      selector: string;
    }>;

    for (const { file, selector } of testCases) {
      const routeFile = `app/routes/${routeBase}/${file}`;
      await input.fill(routeFile);
      await edit(routeFile, modifyCss);
      await expect(
        page.locator(selector),
        `CSS update for ${routeFile}`,
      ).toHaveCSS("padding", NEW_PADDING);

      // Ensure CSS updates were handled by HMR
      await expect(input, `State preservation for ${routeFile}`).toHaveValue(
        routeFile,
      );
    }

    // RSC Framework mode doesn't support custom entries yet
    if (!templateName.includes("rsc")) {
      // The following change triggers a full page reload, so we check it after all the checks for HMR state preservation
      await edit("app/entry.client.css", modifyCss);
      await expect(page.locator("#entry-client")).toHaveCSS(
        "padding",
        NEW_PADDING,
      );
    }

    expect(pageErrors).toEqual([]);
  }
}
