import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  createEditor,
  viteDev,
  viteBuild,
  viteRemixServe,
  customDev,
  VITE_CONFIG,
  EXPRESS_SERVER,
} from "./helpers/vite.js";

const PADDING = "20px";
const NEW_PADDING = "30px";

const files = {
  "app/entry.client.tsx": `
    import "./entry.client.css";
  
    import { RemixBrowser } from "@remix-run/react";
    import { startTransition, StrictMode } from "react";
    import { hydrateRoot } from "react-dom/client";

    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      );
    });
  `,
  "app/root.tsx": `
    import { Links, Meta, Outlet, Scripts, LiveReload } from "@remix-run/react";

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
            <LiveReload />
          </body>
        </html>
      );
    }
  `,
  "app/entry.client.css": `
    .entry-client {
      background: pink;
      padding: ${PADDING};
    }
  `,
  "app/styles-bundled.css": `
    .index_bundled {
      background: papayawhip;
      padding: ${PADDING};
    }
  `,
  "app/styles-linked.css": `
    .index_linked {
      background: salmon;
      padding: ${PADDING};
    }
  `,
  "app/styles.module.css": `
    .index {
      background: peachpuff;
      padding: ${PADDING};
    }
  `,
  "app/styles-vanilla-global.css.ts": `
    import { createVar, globalStyle } from "@vanilla-extract/css";

    globalStyle(".index_vanilla_global", {
      background: "lightgreen",
      padding: "${PADDING}",
    });
  `,
  "app/styles-vanilla-local.css.ts": `
    import { style } from "@vanilla-extract/css";

    export const index = style({
      background: "lightblue",
      padding: "${PADDING}",
    });
  `,
  "app/routes/_index.tsx": `
    import "../styles-bundled.css";
    import linkedStyles from "../styles-linked.css?url";
    import cssModulesStyles from "../styles.module.css";
    import "../styles-vanilla-global.css";
    import * as stylesVanillaLocal from "../styles-vanilla-local.css";

    export function links() {
      return [{ rel: "stylesheet", href: linkedStyles }];
    }

    export default function IndexRoute() {
      return (
        <>
          <input />
          <div id="entry-client" className="entry-client">
            <div id="css-modules" className={cssModulesStyles.index}>
              <div id="css-linked" className="index_linked">
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

const vitePlugins =
  '(await import("@vanilla-extract/vite-plugin")).vanillaExtractPlugin()';

test.describe(() => {
  test.describe(async () => {
    let port: number;
    let cwd: string;
    let stop: () => Promise<void>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "vite.config.ts": await VITE_CONFIG({ port, vitePlugins }),
        ...files,
      });
      stop = await viteDev({ cwd, port });
    });
    test.afterAll(async () => await stop());

    test.describe(() => {
      test.use({ javaScriptEnabled: false });
      test("Vite / CSS / vite dev / without JS", async ({ page }) => {
        await pageLoadWorkflow({ page, port });
      });
    });

    test.describe(() => {
      test.use({ javaScriptEnabled: true });
      test("Vite / CSS / vite dev / with JS", async ({ page }) => {
        await pageLoadWorkflow({ page, port });
        await hmrWorkflow({ page, port, cwd });
      });
    });
  });

  test.describe(async () => {
    let port: number;
    let cwd: string;
    let stop: () => Promise<void>;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "vite.config.ts": await VITE_CONFIG({ port, vitePlugins }),
        "server.mjs": EXPRESS_SERVER({ port }),
        ...files,
      });
      stop = await customDev({ cwd, port });
    });
    test.afterAll(async () => await stop());

    test.describe(() => {
      test.use({ javaScriptEnabled: false });
      test("Vite / CSS / express / without JS", async ({ page }) => {
        await pageLoadWorkflow({ page, port });
      });
    });

    test.describe(() => {
      test.use({ javaScriptEnabled: true });
      test("Vite / CSS / express / with JS", async ({ page }) => {
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
        "vite.config.ts": await VITE_CONFIG({ port, vitePlugins }),
        ...files,
      });

      let edit = createEditor(cwd);
      await edit("package.json", (contents) =>
        contents.replace('"sideEffects": false', '"sideEffects": ["*.css.ts"]')
      );

      await viteBuild({ cwd });
      stop = await viteRemixServe({ cwd, port });
    });
    test.afterAll(() => stop());

    test.describe(() => {
      test.use({ javaScriptEnabled: false });
      test("Vite / CSS / vite build / without JS", async ({ page }) => {
        await pageLoadWorkflow({ page, port });
      });
    });

    test.describe(() => {
      test.use({ javaScriptEnabled: true });
      test("Vite / CSS / vite build / with JS", async ({ page }) => {
        await pageLoadWorkflow({ page, port });
      });
    });
  });
});

async function pageLoadWorkflow({ page, port }: { page: Page; port: number }) {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });

  await Promise.all(
    [
      "#css-bundled",
      "#css-linked",
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
}: {
  page: Page;
  cwd: string;
  port: number;
}) {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });

  let input = page.locator("input");
  await expect(input).toBeVisible();
  await input.type("stateful");
  await expect(input).toHaveValue("stateful");

  let edit = createEditor(cwd);
  let modifyCss = (contents: string) => contents.replace(PADDING, NEW_PADDING);

  await Promise.all([
    edit("app/styles-bundled.css", modifyCss),
    edit("app/styles-linked.css", modifyCss),
    edit("app/styles.module.css", modifyCss),
    edit("app/styles-vanilla-global.css.ts", modifyCss),
    edit("app/styles-vanilla-local.css.ts", modifyCss),
  ]);

  await Promise.all(
    [
      "#css-bundled",
      "#css-linked",
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
