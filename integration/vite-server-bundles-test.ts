import fs from "node:fs";
import path from "node:path";
import { type Page, test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import {
  createProject,
  viteDev,
  viteBuild,
  viteRemixServe,
  viteConfig,
} from "./helpers/vite.js";

const withBundleServer = async (
  cwd: string,
  serverBundle: string,
  callback: (port: number) => Promise<void>
): Promise<void> => {
  let port = await getPort();
  let stop = await viteRemixServe({ cwd, port, serverBundle });
  await callback(port);
  stop();
};

const ROUTE_FILE_COMMENT = "// THIS IS A ROUTE FILE";

function createRoute(path: string) {
  return {
    [`app/routes/${path}`]: `
      ${ROUTE_FILE_COMMENT}
      import { Outlet } from "@remix-run/react";
      import { useState, useEffect } from "react";

      export default function Route() {
        const [mounted, setMounted] = useState(false);
        useEffect(() => {
          setMounted(true);
        }, []);
        return (
          <>
            <div data-route-file="${path}">
              Route: ${path}
              {mounted ? <span data-mounted> (Mounted)</span> : null}
            </div>
            <Outlet />
          </>
        );
      }
    `,
  };
}

const TEST_ROUTES = [
  "_index.tsx",

  // Bundle A has an index route
  "bundle-a.tsx",
  "bundle-a._index.tsx",
  "bundle-a.route-a.tsx",
  "bundle-a.route-b.tsx",

  // Bundle B doesn't have an index route
  "bundle-b.tsx",
  "bundle-b.route-a.tsx",
  "bundle-b.route-b.tsx",

  // Bundle C is nested in a pathless route
  "_pathless.tsx",
  "_pathless.bundle-c.tsx",
  "_pathless.bundle-c.route-a.tsx",
  "_pathless.bundle-c.route-b.tsx",
];

const files = {
  "app/root.tsx": `
    ${ROUTE_FILE_COMMENT}
    import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

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
  ...Object.assign({}, ...TEST_ROUTES.map(createRoute)),
};

const expectRenderedRoutes = async (page: Page, routeFiles: string[]) => {
  await Promise.all(
    TEST_ROUTES.map(async (routeFile) => {
      let locator = page.locator(
        `[data-route-file="${routeFile}"] [data-mounted]`
      );
      if (routeFiles.includes(routeFile)) {
        await expect(locator).toBeAttached();
      } else {
        // Assert no other routes are rendered
        await expect(locator).not.toBeAttached();
      }
    })
  );
};

test.describe(() => {
  let cwd: string;
  let port: number;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      "vite.config.ts": dedent`
        import { vitePlugin as remix } from "@remix-run/dev";

        export default {
          ${await viteConfig.server({ port })}
          build: { manifest: true },
          plugins: [remix({
            manifest: true,
            serverBundles: async ({ branch }) => {
              // Smoke test to ensure we can read the route files via 'route.file'
              await Promise.all(branch.map(async (route) => {
                const fs = await import("node:fs/promises");
                const routeFileContents = await fs.readFile(route.file, "utf8");
                if (!routeFileContents.includes(${JSON.stringify(
                  ROUTE_FILE_COMMENT
                )})) {
                  throw new Error("Couldn't file route file test comment");
                }
              }));

              if (branch.some((route) => route.id === "routes/_index")) {
                return "root";
              }

              if (branch.some((route) => route.id === "routes/bundle-a")) {
                return "bundle-a";
              }

              if (branch.some((route) => route.id === "routes/bundle-b")) {
                return "bundle-b";
              }

              if (branch.some((route) => route.id === "routes/_pathless.bundle-c")) {
                return "bundle-c";
              }

              throw new Error("No bundle defined for route " + branch[branch.length - 1].id);
            }
          })]
        }
      `,
      ...files,
    });
  });

  test.describe(() => {
    let stop: () => void;
    test.beforeAll(async () => {
      stop = await viteDev({ cwd, port });
    });

    test.afterAll(() => stop());

    test("Vite / server bundles / dev", async ({ page }) => {
      // There are no server bundles in dev mode, this is just a smoke test to
      // ensure dev mode works and that routes from all bundles are available
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}/`);
      await expectRenderedRoutes(page, ["_index.tsx"]);

      await page.goto(`http://localhost:${port}/bundle-a`);
      await expectRenderedRoutes(page, ["bundle-a.tsx", "bundle-a._index.tsx"]);

      await page.goto(`http://localhost:${port}/bundle-b`);
      await expectRenderedRoutes(page, ["bundle-b.tsx"]);

      await page.goto(`http://localhost:${port}/bundle-c`);
      await expectRenderedRoutes(page, [
        "_pathless.tsx",
        "_pathless.bundle-c.tsx",
      ]);

      expect(pageErrors).toEqual([]);
    });
  });

  test.describe(() => {
    test.beforeAll(() => viteBuild({ cwd }));

    test("Vite / server bundles / build / server", async ({ page }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await withBundleServer(cwd, "root", async (port) => {
        await page.goto(`http://localhost:${port}/`);
        await expectRenderedRoutes(page, ["_index.tsx"]);

        let _404s = ["/bundle-a", "/bundle-b", "/bundle-c"];
        for (let path of _404s) {
          let response = await page.goto(`http://localhost:${port}${path}`);
          expect(response?.status()).toBe(404);
        }
      });

      await withBundleServer(cwd, "bundle-a", async (port) => {
        await page.goto(`http://localhost:${port}/bundle-a`);
        await expectRenderedRoutes(page, [
          "bundle-a.tsx",
          "bundle-a._index.tsx",
        ]);

        await page.goto(`http://localhost:${port}/bundle-a/route-a`);
        await expectRenderedRoutes(page, [
          "bundle-a.tsx",
          "bundle-a.route-a.tsx",
        ]);

        await page.goto(`http://localhost:${port}/bundle-a/route-b`);
        await expectRenderedRoutes(page, [
          "bundle-a.tsx",
          "bundle-a.route-b.tsx",
        ]);

        let _404s = ["/bundle-b", "/bundle-c"];
        for (let path of _404s) {
          let response = await page.goto(`http://localhost:${port}${path}`);
          expect(response?.status()).toBe(404);
        }
      });

      await withBundleServer(cwd, "bundle-b", async (port) => {
        await page.goto(`http://localhost:${port}/bundle-b`);
        await expectRenderedRoutes(page, ["bundle-b.tsx"]);

        await page.goto(`http://localhost:${port}/bundle-b/route-a`);
        await expectRenderedRoutes(page, [
          "bundle-b.tsx",
          "bundle-b.route-a.tsx",
        ]);

        await page.goto(`http://localhost:${port}/bundle-b/route-b`);
        await expectRenderedRoutes(page, [
          "bundle-b.tsx",
          "bundle-b.route-b.tsx",
        ]);

        let _404s = ["/bundle-a", "/bundle-c"];
        for (let path of _404s) {
          let response = await page.goto(`http://localhost:${port}${path}`);
          expect(response?.status()).toBe(404);
        }
      });

      await withBundleServer(cwd, "bundle-c", async (port) => {
        await page.goto(`http://localhost:${port}/bundle-c`);
        await expectRenderedRoutes(page, [
          "_pathless.tsx",
          "_pathless.bundle-c.tsx",
        ]);

        await page.goto(`http://localhost:${port}/bundle-c/route-a`);
        await expectRenderedRoutes(page, [
          "_pathless.tsx",
          "_pathless.bundle-c.tsx",
          "_pathless.bundle-c.route-a.tsx",
        ]);

        await page.goto(`http://localhost:${port}/bundle-c/route-b`);
        await expectRenderedRoutes(page, [
          "_pathless.tsx",
          "_pathless.bundle-c.tsx",
          "_pathless.bundle-c.route-b.tsx",
        ]);

        let _404s = ["/bundle-a", "/bundle-b"];
        for (let path of _404s) {
          let response = await page.goto(`http://localhost:${port}${path}`);
          expect(response?.status()).toBe(404);
        }
      });

      expect(pageErrors).toEqual([]);
    });

    test("Vite / server bundles / build / Remix browser manifest", () => {
      let clientAssetFiles = fs.readdirSync(
        path.join(cwd, "build", "client", "assets")
      );
      let manifestFiles = clientAssetFiles.filter((filename) =>
        filename.startsWith("manifest-")
      );

      expect(manifestFiles.length).toEqual(1);
    });

    test("Vite / server bundles / build / Vite manifests", () => {
      let viteManifestFiles = fs.readdirSync(path.join(cwd, "build", ".vite"));

      expect(viteManifestFiles).toEqual([
        "client-manifest.json",
        "server-bundle-a-manifest.json",
        "server-bundle-b-manifest.json",
        "server-bundle-c-manifest.json",
        "server-root-manifest.json",
      ]);
    });

    test("Vite / server bundles / build / Remix manifest", () => {
      let manifestPath = path.join(cwd, "build", ".remix", "manifest.json");
      expect(JSON.parse(fs.readFileSync(manifestPath, "utf8"))).toEqual({
        serverBundles: {
          "bundle-c": {
            id: "bundle-c",
            file: "build/server/bundle-c/index.js",
          },
          "bundle-a": {
            id: "bundle-a",
            file: "build/server/bundle-a/index.js",
          },
          "bundle-b": {
            id: "bundle-b",
            file: "build/server/bundle-b/index.js",
          },
          root: {
            id: "root",
            file: "build/server/root/index.js",
          },
        },
        routeIdToServerBundleId: {
          "routes/_pathless.bundle-c.route-a": "bundle-c",
          "routes/_pathless.bundle-c.route-b": "bundle-c",
          "routes/_pathless.bundle-c": "bundle-c",
          "routes/bundle-a.route-a": "bundle-a",
          "routes/bundle-a.route-b": "bundle-a",
          "routes/bundle-b.route-a": "bundle-b",
          "routes/bundle-b.route-b": "bundle-b",
          "routes/bundle-a._index": "bundle-a",
          "routes/bundle-b": "bundle-b",
          "routes/_index": "root",
        },
        routes: {
          root: {
            path: "",
            id: "root",
            file: "app/root.tsx",
          },
          "routes/_pathless.bundle-c.route-a": {
            file: "app/routes/_pathless.bundle-c.route-a.tsx",
            id: "routes/_pathless.bundle-c.route-a",
            path: "route-a",
            parentId: "routes/_pathless.bundle-c",
          },
          "routes/_pathless.bundle-c.route-b": {
            file: "app/routes/_pathless.bundle-c.route-b.tsx",
            id: "routes/_pathless.bundle-c.route-b",
            path: "route-b",
            parentId: "routes/_pathless.bundle-c",
          },
          "routes/_pathless.bundle-c": {
            file: "app/routes/_pathless.bundle-c.tsx",
            id: "routes/_pathless.bundle-c",
            path: "bundle-c",
            parentId: "routes/_pathless",
          },
          "routes/bundle-a.route-a": {
            file: "app/routes/bundle-a.route-a.tsx",
            id: "routes/bundle-a.route-a",
            path: "route-a",
            parentId: "routes/bundle-a",
          },
          "routes/bundle-a.route-b": {
            file: "app/routes/bundle-a.route-b.tsx",
            id: "routes/bundle-a.route-b",
            path: "route-b",
            parentId: "routes/bundle-a",
          },
          "routes/bundle-b.route-a": {
            file: "app/routes/bundle-b.route-a.tsx",
            id: "routes/bundle-b.route-a",
            path: "route-a",
            parentId: "routes/bundle-b",
          },
          "routes/bundle-b.route-b": {
            file: "app/routes/bundle-b.route-b.tsx",
            id: "routes/bundle-b.route-b",
            path: "route-b",
            parentId: "routes/bundle-b",
          },
          "routes/bundle-a._index": {
            file: "app/routes/bundle-a._index.tsx",
            id: "routes/bundle-a._index",
            index: true,
            parentId: "routes/bundle-a",
          },
          "routes/_pathless": {
            file: "app/routes/_pathless.tsx",
            id: "routes/_pathless",
            parentId: "root",
          },
          "routes/bundle-a": {
            file: "app/routes/bundle-a.tsx",
            id: "routes/bundle-a",
            path: "bundle-a",
            parentId: "root",
          },
          "routes/bundle-b": {
            file: "app/routes/bundle-b.tsx",
            id: "routes/bundle-b",
            path: "bundle-b",
            parentId: "root",
          },
          "routes/_index": {
            file: "app/routes/_index.tsx",
            id: "routes/_index",
            index: true,
            parentId: "root",
          },
        },
      });
    });
  });
});
