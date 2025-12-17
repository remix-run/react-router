import fs from "node:fs";
import path from "node:path";
import { type Page, test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import {
  createProject,
  dev,
  build,
  reactRouterServe,
  viteConfig,
} from "./helpers/vite.js";

const js = String.raw;

const withBundleServer = async (
  cwd: string,
  serverBundle: string,
  callback: (port: number) => Promise<void>,
): Promise<void> => {
  let port = await getPort();
  let stop = await reactRouterServe({ cwd, port, serverBundle });
  await callback(port);
  stop();
};

const ROUTE_FILE_COMMENT = "// THIS IS A ROUTE FILE";

function createRoute(path: string) {
  return {
    [`app/routes/${path}`]: js`
      ${ROUTE_FILE_COMMENT}
      import { Outlet } from "react-router";
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
  "bundle_a.tsx",
  "bundle_a._index.tsx",
  "bundle_a.route_a.tsx",
  "bundle_a.route_b.tsx",

  // Bundle B doesn't have an index route
  "bundle_b.tsx",
  "bundle_b.route_a.tsx",
  "bundle_b.route_b.tsx",

  // Bundle C is nested in a pathless route
  "_pathless.tsx",
  "_pathless.bundle_c.tsx",
  "_pathless.bundle_c.route_a.tsx",
  "_pathless.bundle_c.route_b.tsx",
];

const files = {
  "app/root.tsx": js`
    ${ROUTE_FILE_COMMENT}
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
  ...Object.assign({}, ...TEST_ROUTES.map(createRoute)),
};

const expectRenderedRoutes = async (page: Page, routeFiles: string[]) => {
  await Promise.all(
    TEST_ROUTES.map(async (routeFile) => {
      let locator = page.locator(
        `[data-route-file="${routeFile}"] [data-mounted]`,
      );
      if (routeFiles.includes(routeFile)) {
        await expect(locator).toBeAttached();
      } else {
        // Assert no other routes are rendered
        await expect(locator).not.toBeAttached();
      }
    }),
  );
};

test.describe("Server bundles", () => {
  let cwd: string;
  let port: number;

  [false, true].forEach((v8_viteEnvironmentApi) => {
    test.describe(`v8_viteEnvironmentApi enabled: ${v8_viteEnvironmentApi}`, () => {
      test.beforeAll(async () => {
        port = await getPort();
        cwd = await createProject(
          {
            "react-router.config.ts": dedent(js`
              export default {
                future: {
                  v8_viteEnvironmentApi: ${v8_viteEnvironmentApi},
                },
                buildEnd: async ({ buildManifest }) => {
                  let fs = await import("node:fs");
                  await fs.promises.writeFile(
                    "build/test-manifest.json",
                    JSON.stringify(buildManifest, null, 2)
                  );
                },
                serverBundles: async ({ branch }) => {
                  // Smoke test to ensure we can read the route files via 'route.file'
                  await Promise.all(branch.map(async (route) => {
                    const fs = await import("node:fs/promises");
                    const routeFileContents = await fs.readFile(route.file, "utf8");
                    if (!routeFileContents.includes(${JSON.stringify(
                      ROUTE_FILE_COMMENT,
                    )})) {
                      throw new Error("Couldn't file route file test comment");
                    }
                  }));

                  if (branch.some((route) => route.id === "routes/_index")) {
                    return "root";
                  }

                  if (branch.some((route) => route.id === "routes/bundle_a")) {
                    return "bundle_a";
                  }

                  if (branch.some((route) => route.id === "routes/bundle_b")) {
                    return "bundle_b";
                  }

                  if (branch.some((route) => route.id === "routes/_pathless.bundle_c")) {
                    return "bundle_c";
                  }

                  throw new Error("No bundle defined for route " + branch[branch.length - 1].id);
                }
              }
            `),
            "vite.config.ts": dedent(js`
              import { reactRouter } from "@react-router/dev/vite";

              export default {
                ${await viteConfig.server({ port })}
                build: { manifest: true },
                plugins: [reactRouter()]
              }
            `),
            ...files,
          },
          v8_viteEnvironmentApi ? "vite-6-template" : "vite-5-template",
        );
      });

      test.describe(() => {
        let stop: () => void;
        test.beforeAll(async () => {
          stop = await dev({ cwd, port });
        });

        test.afterAll(() => stop());

        test("dev", async ({ page }) => {
          // There are no server bundles in dev mode, this is just a smoke test to
          // ensure dev mode works and that routes from all bundles are available
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await page.goto(`http://localhost:${port}/`);
          await expectRenderedRoutes(page, ["_index.tsx"]);

          await page.goto(`http://localhost:${port}/bundle_a`);
          await expectRenderedRoutes(page, [
            "bundle_a.tsx",
            "bundle_a._index.tsx",
          ]);

          await page.goto(`http://localhost:${port}/bundle_b`);
          await expectRenderedRoutes(page, ["bundle_b.tsx"]);

          await page.goto(`http://localhost:${port}/bundle_c`);
          await expectRenderedRoutes(page, [
            "_pathless.tsx",
            "_pathless.bundle_c.tsx",
          ]);

          expect(pageErrors).toEqual([]);
        });
      });

      test.describe("build", () => {
        let stdout: string;
        test.beforeAll(() => {
          let buildResult = build({ cwd });
          stdout = buildResult.stdout.toString();
        });

        test("Vite Environment API message", () => {
          let viteEnvironmentApiMessage =
            "Using Vite Environment API (experimental)";
          if (v8_viteEnvironmentApi) {
            expect(stdout).toContain(viteEnvironmentApiMessage);
          } else {
            expect(stdout).not.toContain(viteEnvironmentApiMessage);
          }
        });

        test("server", async ({ page }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          await withBundleServer(cwd, "root", async (port) => {
            await page.goto(`http://localhost:${port}/`);
            await expectRenderedRoutes(page, ["_index.tsx"]);

            let _404s = ["/bundle_a", "/bundle_b", "/bundle_c"];
            for (let path of _404s) {
              let response = await page.goto(`http://localhost:${port}${path}`);
              expect(response?.status()).toBe(404);
            }
          });

          await withBundleServer(cwd, "bundle_a", async (port) => {
            await page.goto(`http://localhost:${port}/bundle_a`);
            await expectRenderedRoutes(page, [
              "bundle_a.tsx",
              "bundle_a._index.tsx",
            ]);

            await page.goto(`http://localhost:${port}/bundle_a/route_a`);
            await expectRenderedRoutes(page, [
              "bundle_a.tsx",
              "bundle_a.route_a.tsx",
            ]);

            await page.goto(`http://localhost:${port}/bundle_a/route_b`);
            await expectRenderedRoutes(page, [
              "bundle_a.tsx",
              "bundle_a.route_b.tsx",
            ]);

            let _404s = ["/bundle_b", "/bundle_c"];
            for (let path of _404s) {
              let response = await page.goto(`http://localhost:${port}${path}`);
              expect(response?.status()).toBe(404);
            }
          });

          await withBundleServer(cwd, "bundle_b", async (port) => {
            await page.goto(`http://localhost:${port}/bundle_b`);
            await expectRenderedRoutes(page, ["bundle_b.tsx"]);

            await page.goto(`http://localhost:${port}/bundle_b/route_a`);
            await expectRenderedRoutes(page, [
              "bundle_b.tsx",
              "bundle_b.route_a.tsx",
            ]);

            await page.goto(`http://localhost:${port}/bundle_b/route_b`);
            await expectRenderedRoutes(page, [
              "bundle_b.tsx",
              "bundle_b.route_b.tsx",
            ]);

            let _404s = ["/bundle_a", "/bundle_c"];
            for (let path of _404s) {
              let response = await page.goto(`http://localhost:${port}${path}`);
              expect(response?.status()).toBe(404);
            }
          });

          await withBundleServer(cwd, "bundle_c", async (port) => {
            await page.goto(`http://localhost:${port}/bundle_c`);
            await expectRenderedRoutes(page, [
              "_pathless.tsx",
              "_pathless.bundle_c.tsx",
            ]);

            await page.goto(`http://localhost:${port}/bundle_c/route_a`);
            await expectRenderedRoutes(page, [
              "_pathless.tsx",
              "_pathless.bundle_c.tsx",
              "_pathless.bundle_c.route_a.tsx",
            ]);

            await page.goto(`http://localhost:${port}/bundle_c/route_b`);
            await expectRenderedRoutes(page, [
              "_pathless.tsx",
              "_pathless.bundle_c.tsx",
              "_pathless.bundle_c.route_b.tsx",
            ]);

            let _404s = ["/bundle_a", "/bundle_b"];
            for (let path of _404s) {
              let response = await page.goto(`http://localhost:${port}${path}`);
              expect(response?.status()).toBe(404);
            }
          });

          expect(pageErrors).toEqual([]);
        });

        test("React Router browser manifest", () => {
          let clientAssetFiles = fs.readdirSync(
            path.join(cwd, "build", "client", "assets"),
          );
          let manifestFiles = clientAssetFiles.filter((filename) =>
            filename.startsWith("manifest-"),
          );

          expect(manifestFiles.length).toEqual(1);
        });

        test("Vite manifests", () => {
          [
            ["client"],
            ["server", "bundle_a"],
            ["server", "bundle_b"],
            ["server", "bundle_c"],
            ["server", "root"],
          ].forEach((buildPaths) => {
            let viteManifestFiles = fs.readdirSync(
              path.join(cwd, "build", ...buildPaths, ".vite"),
            );
            expect(viteManifestFiles).toEqual(["manifest.json"]);
          });
        });

        test("React Router build manifest", () => {
          let manifestPath = path.join(cwd, "build", "test-manifest.json");
          expect(JSON.parse(fs.readFileSync(manifestPath, "utf8"))).toEqual({
            serverBundles: {
              bundle_c: {
                id: "bundle_c",
                file: "build/server/bundle_c/index.js",
              },
              bundle_a: {
                id: "bundle_a",
                file: "build/server/bundle_a/index.js",
              },
              bundle_b: {
                id: "bundle_b",
                file: "build/server/bundle_b/index.js",
              },
              root: {
                id: "root",
                file: "build/server/root/index.js",
              },
            },
            routeIdToServerBundleId: {
              "routes/_pathless.bundle_c.route_a": "bundle_c",
              "routes/_pathless.bundle_c.route_b": "bundle_c",
              "routes/_pathless.bundle_c": "bundle_c",
              "routes/bundle_a.route_a": "bundle_a",
              "routes/bundle_a.route_b": "bundle_a",
              "routes/bundle_b.route_a": "bundle_b",
              "routes/bundle_b.route_b": "bundle_b",
              "routes/bundle_a._index": "bundle_a",
              "routes/bundle_b": "bundle_b",
              "routes/_index": "root",
            },
            routes: {
              root: {
                path: "",
                id: "root",
                file: "app/root.tsx",
              },
              "routes/_pathless.bundle_c.route_a": {
                file: "app/routes/_pathless.bundle_c.route_a.tsx",
                id: "routes/_pathless.bundle_c.route_a",
                path: "route_a",
                parentId: "routes/_pathless.bundle_c",
              },
              "routes/_pathless.bundle_c.route_b": {
                file: "app/routes/_pathless.bundle_c.route_b.tsx",
                id: "routes/_pathless.bundle_c.route_b",
                path: "route_b",
                parentId: "routes/_pathless.bundle_c",
              },
              "routes/_pathless.bundle_c": {
                file: "app/routes/_pathless.bundle_c.tsx",
                id: "routes/_pathless.bundle_c",
                path: "bundle_c",
                parentId: "routes/_pathless",
              },
              "routes/bundle_a.route_a": {
                file: "app/routes/bundle_a.route_a.tsx",
                id: "routes/bundle_a.route_a",
                path: "route_a",
                parentId: "routes/bundle_a",
              },
              "routes/bundle_a.route_b": {
                file: "app/routes/bundle_a.route_b.tsx",
                id: "routes/bundle_a.route_b",
                path: "route_b",
                parentId: "routes/bundle_a",
              },
              "routes/bundle_b.route_a": {
                file: "app/routes/bundle_b.route_a.tsx",
                id: "routes/bundle_b.route_a",
                path: "route_a",
                parentId: "routes/bundle_b",
              },
              "routes/bundle_b.route_b": {
                file: "app/routes/bundle_b.route_b.tsx",
                id: "routes/bundle_b.route_b",
                path: "route_b",
                parentId: "routes/bundle_b",
              },
              "routes/bundle_a._index": {
                file: "app/routes/bundle_a._index.tsx",
                id: "routes/bundle_a._index",
                index: true,
                parentId: "routes/bundle_a",
              },
              "routes/_pathless": {
                file: "app/routes/_pathless.tsx",
                id: "routes/_pathless",
                parentId: "root",
              },
              "routes/bundle_a": {
                file: "app/routes/bundle_a.tsx",
                id: "routes/bundle_a",
                path: "bundle_a",
                parentId: "root",
              },
              "routes/bundle_b": {
                file: "app/routes/bundle_b.tsx",
                id: "routes/bundle_b",
                path: "bundle_b",
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
  });
});
