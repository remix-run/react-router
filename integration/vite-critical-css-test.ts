import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  dev,
  reactRouterConfig,
  viteConfig,
  viteMajorTemplates,
} from "./helpers/vite.js";

const js = String.raw;

for (let { templateName, templateDisplayName } of viteMajorTemplates) {
  test(`Vite critical CSS preserves streamed Suspense hydration (${templateDisplayName})`, async ({
    page,
  }) => {
    let port = await getPort();
    let cwd = await createProject(
      {
        "react-router.config.ts": reactRouterConfig(),
        "vite.config.ts": await viteConfig.basic({ port, templateName }),
        "app/entry.client.tsx": js`
          import { startTransition, StrictMode } from "react";
          import { hydrateRoot } from "react-dom/client";
          import { HydratedRouter } from "react-router/dom";

          // Capture the streamed server node before starting hydration.
          window.criticalCssTest.serverNode = document.getElementById("streamed-content");
          startTransition(() => {
            hydrateRoot(document, <StrictMode><HydratedRouter /></StrictMode>);
          });
        `,
        "app/root.tsx": js`
          import { useEffect } from "react";
          import { Links, Outlet, Scripts } from "react-router";

          export default function Root() {
            useEffect(() => { window.criticalCssTest.rootMounted = true; }, []);
            return <html><head><Links /></head><body><Outlet /><Scripts /></body></html>;
          }
        `,
        "app/routes/_index.tsx": js`
          import { lazy, Suspense, useState } from "react";
          import styles from "../styles.css?url";

          export const links = () => [{ rel: "stylesheet", href: styles }];
          export default function Index() {
            // Each SSR request must suspend, even if Vite cached the module.
            let [Child] = useState(() => lazy(() => import("../lazy-child")));
            return <Suspense fallback={<p>Loading...</p>}><Child /></Suspense>;
          }
        `,
        "app/lazy-child.tsx": js`
          import { useEffect } from "react";

          export default function Child() {
            useEffect(() => { window.criticalCssTest.childHydrated = true; }, []);
            return <p id="streamed-content">Streamed content</p>;
          }
        `,
        "app/styles.css": "#streamed-content { padding: 20px; }",
      },
      templateName,
    );

    let stop = await dev({ cwd, port });
    let release!: () => void;
    let gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    let pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await page.addInitScript(() => {
        window.criticalCssTest = {
          rootMounted: false,
          childHydrated: false,
          serverNode: null,
        };
      });
      // SSR can stream the child; only the browser's lazy import is held.
      await page.route("**/app/lazy-child.tsx*", async (route) => {
        requested = true;
        await gate;
        await route.continue();
      });

      let response = await page.goto(`http://localhost:${port}/`, {
        waitUntil: "commit",
      });
      expect(response?.status()).toBe(200);
      let html = await response!.text();
      expect(html).toContain('id="streamed-content"');
      expect(html).toContain("<!--$?");
      expect(html).toContain("data-react-router-critical-css");
      await expect.poll(() => requested).toBe(true);
      await expect
        .poll(() => page.evaluate(() => window.criticalCssTest.rootMounted))
        .toBe(true);
      expect(
        await page.evaluate(() => window.criticalCssTest.childHydrated),
      ).toBe(false);
      expect(
        await page.evaluate(
          () => window.criticalCssTest.serverNode?.isConnected,
        ),
      ).toBe(true);

      release();
      await expect
        .poll(() => page.evaluate(() => window.criticalCssTest.childHydrated))
        .toBe(true);

      // React 19 can silently replace this DOM without reporting an error.
      expect(
        await page.evaluate(
          () =>
            document.getElementById("streamed-content") ===
            window.criticalCssTest.serverNode,
        ),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => window.criticalCssTest.serverNode?.isConnected,
        ),
      ).toBe(true);
      await expect(page.locator("#streamed-content")).toHaveText(
        "Streamed content",
      );
      await expect(page.locator("#streamed-content")).toHaveCSS(
        "padding",
        "20px",
      );
      await expect(
        page.locator("[data-react-router-critical-css]"),
      ).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    } finally {
      release();
      stop();
    }
  });
}

declare global {
  interface Window {
    criticalCssTest: {
      rootMounted: boolean;
      childHydrated: boolean;
      serverNode: HTMLElement | null;
    };
  }
}
