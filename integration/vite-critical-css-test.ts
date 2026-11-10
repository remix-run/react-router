import { cp, readFile, rm, symlink } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  dev,
  reactRouterConfig,
  viteConfig,
} from "./helpers/vite.js";

const js = String.raw;
const router = createRequire(
  new URL("../packages/react-router/package.json", import.meta.url),
);
const react18 = createRequire(
  new URL("./helpers/react-18/package.json", import.meta.url),
);

for (let v8_viteEnvironmentApi of [false, true]) {
  test(`critical CSS preserves React 18 streamed Suspense hydration (environment API ${v8_viteEnvironmentApi})`, async ({
    page,
  }) => {
    let port = await getPort();
    let cwd = await createProject(
      {
        "react-router.config.ts": reactRouterConfig({
          future: { v8_viteEnvironmentApi },
        }),
        "vite.config.ts": await viteConfig.basic({ port }),
        "app/entry.server.tsx": await readFile(
          new URL(
            "../packages/react-router-dev/config/defaults/entry.server.node.tsx",
            import.meta.url,
          ),
          "utf8",
        ),
        "app/entry.client.tsx": js`
        import { hydrateRoot } from "react-dom/client";
        import { version as domVersion } from "react-dom";
        import { version } from "react";
        import { HydratedRouter } from "react-router/dom";

        window.clientVersions = [version, domVersion];
        window.serverNode = document.getElementById("lazy-content");
        window.serverNode.dataset.preserved = "yes";
        hydrateRoot(document, <HydratedRouter />, {
          onRecoverableError(error) { window.hydrationErrors.push(error.message); }
        });
      `,
        "app/root.tsx": js`
        import { useEffect } from "react";
        import { Links, Outlet, Scripts } from "react-router";

        export default function Root() {
          useEffect(() => { window.rootMounted = true; }, []);
          return <html><head><Links /></head><body><Outlet /><Scripts /></body></html>;
        }
      `,
        "app/routes/_index.tsx": js`
        import { lazy, Suspense, useState, version } from "react";
        import { version as domVersion } from "react-dom";
        import { useLoaderData } from "react-router";
        import styles from "../styles.css?url";

        export const links = () => [{ rel: "stylesheet", href: styles }];
        export function loader() { return { versions: [version, domVersion] }; }
        export default function Index() {
          let { versions } = useLoaderData();
          let [Child] = useState(() => lazy(() => import("../lazy-child")));
          return <><p id="server-versions">{versions.join(",")}</p>
            <Suspense fallback={<p id="fallback">Loading</p>}><Child /></Suspense></>;
        }
      `,
        "app/lazy-child.tsx": js`
        import { useEffect } from "react";
        export default function Child() {
          useEffect(() => { window.childHydrated = true; }, []);
          return <p id="lazy-content">Streamed child</p>;
        }
      `,
        "app/styles.css": "#lazy-content { padding: 20px; }",
      },
      "vite-6-template",
    );

    // Pin both the SSR and client graph without changing the React 19 catalog.
    for (let name of ["react", "react-dom"]) {
      let target = path.dirname(react18.resolve(`${name}/package.json`));
      await rm(path.join(cwd, "node_modules", name));
      await symlink(target, path.join(cwd, "node_modules", name), "dir");
    }
    // Workspace package symlinks otherwise resolve React from the catalog.
    // Copy only the trusted build so its SSR imports resolve from this fixture.
    let routerDir = path.dirname(router.resolve("./package.json"));
    let fixtureRouter = path.join(cwd, "node_modules/react-router");
    await rm(fixtureRouter);
    await cp(path.join(routerDir, "dist"), path.join(fixtureRouter, "dist"), {
      recursive: true,
    });
    await cp(
      path.join(routerDir, "package.json"),
      path.join(fixtureRouter, "package.json"),
    );
    for (let name of ["cookie", "set-cookie-parser"]) {
      await symlink(
        path.dirname(router.resolve(`${name}/package.json`)),
        path.join(cwd, "node_modules", name),
        "dir",
      );
    }
    let stop = await dev({ cwd, port });
    let release!: () => void;
    let gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    let pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      Object.assign(window, {
        hydrationErrors: [],
        rootMounted: false,
        childHydrated: false,
      });
    });
    // Hold only the browser's lazy module. SSR is free to stream the child.
    await page.route("**/app/lazy-child.tsx*", async (route) => {
      requested = true;
      await gate;
      await route.continue();
    });
    try {
      let response = await page.request.get(`http://localhost:${port}/`);
      let html = await response.text();
      expect(html).toContain('id="lazy-content"');
      expect(html).toContain("<!--$?");
      expect(html.includes("critical.css?pathname=")).toBe(
        v8_viteEnvironmentApi,
      );
      await page.goto(`http://localhost:${port}/`, { waitUntil: "commit" });
      await expect.poll(() => requested).toBe(true);
      await expect
        .poll(() => page.evaluate(() => window.rootMounted))
        .toBe(true);
      expect(await page.evaluate(() => window.childHydrated)).toBe(false);
      expect(await page.evaluate(() => window.clientVersions)).toEqual([
        "18.3.1",
        "18.3.1",
      ]);
      await expect(page.locator("#server-versions")).toHaveText(
        "18.3.1,18.3.1",
      );
      release();
      await expect
        .poll(() => page.evaluate(() => window.childHydrated))
        .toBe(true);
      await expect(page.locator("#lazy-content")).toHaveText("Streamed child");
      await expect(page.locator("#lazy-content")).toHaveCSS("padding", "20px");
      expect(await page.evaluate(() => window.hydrationErrors)).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(
        await page.evaluate(
          () => document.getElementById("lazy-content") === window.serverNode,
        ),
      ).toBe(true);
      await expect(page.locator("#lazy-content")).toHaveAttribute(
        "data-preserved",
        "yes",
      );
      await expect(
        page.locator('link[href*="critical.css?pathname="]'),
      ).toHaveCount(0);
    } finally {
      release();
      stop();
    }
  });
}

declare global {
  interface Window {
    clientVersions: string[];
    serverNode: HTMLElement;
    hydrationErrors: string[];
    rootMounted: boolean;
    childHydrated: boolean;
  }
}
