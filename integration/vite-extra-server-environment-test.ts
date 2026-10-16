import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import getPort from "get-port";

import {
  build,
  createProject,
  dev,
  reactRouterConfig,
  viteConfig,
} from "./helpers/vite.js";

const js = String.raw;

test("ignores external server environments without skipping React Router build hooks", async () => {
  let cwd = await createProject(
    {
      "react-router.config.ts": reactRouterConfig(),
      "vite.config.ts": js`
        import { defineConfig } from "vite";
        import { reactRouter } from "@react-router/dev/vite";

        function extraServerEnvironment() {
          return {
            name: "extra-server-environment",
            config() {
              return {
                environments: {
                  externalServerEnv: {
                    consumer: "server",
                    build: {
                      rollupOptions: { input: "./external-server-env.ts" },
                    },
                  },
                },
                builder: {
                  sharedConfigBuild: true,
                  sharedPlugins: true,
                  async buildApp(builder) {
                    // External build orchestrators can introduce additional
                    // server environments that React Router should ignore.
                    await builder.build(builder.environments.client);
                    await builder.build(builder.environments.ssr);
                    await builder.build(builder.environments.externalServerEnv);
                  },
                },
              };
            },
          };
        }

        export default defineConfig({
          build: {
            assetsInlineLimit: 0,
          },
          plugins: [
            reactRouter(),
            extraServerEnvironment(),
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
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": js`
        export default function Index() {
          return <h1>Hello</h1>;
        }
      `,
      "app/assets/test.txt": "test",
      "app/ssr-only-asset.server.ts": js`
        import txtUrl from "./assets/test.txt?url";

        export { txtUrl };
      `,
      "app/routes/ssr-only-assets.tsx": js`
        import { useLoaderData } from "react-router";

        export const loader = async () => {
          let { txtUrl } = await import("../ssr-only-asset.server");
          return { txtUrl };
        };

        export default function SsrOnlyAssetsRoute() {
          const loaderData = useLoaderData<typeof loader>();
          return <a href={loaderData.txtUrl}>txtUrl</a>;
        }
      `,
      "external-server-env.ts": js`
        export default {
          async fetch() {
            return new Response("ok");
          },
        };
      `,
    },
    "vite-7-template",
  );

  let { status, stderr } = build({ cwd });

  expect(stderr.toString().trim()).toBeFalsy();
  expect(status).toBe(0);
  expect(
    fs
      .readdirSync(path.join(cwd, "build/client/assets"))
      .filter((file) => /^test-.*\.txt$/.test(file)).length,
  ).toBe(1);
});

for (let ssr of [true, "unstable_api-only"] as const) {
  test.describe(`route exports in additional server environments (ssr: ${ssr})`, () => {
    let cwd: string;
    let port: number;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({ ssr }),
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            ${await viteConfig.server({ port })}
            environments: {
              externalServerEnv: {
                consumer: "server",
                resolve: { external: ["react-router"] },
                build: {
                  outDir: "build/external-server",
                  rollupOptions: {
                    input: "external-server-env.ts",
                    output: { entryFileNames: "index.js" },
                  },
                },
              },
            },
            plugins: [
              reactRouter(),
              {
                name: "additional-server-entry",
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if (req.url !== "/external-data") return next();
                    try {
                      let entry = await server.environments.externalServerEnv.runner.import(
                        "./external-server-env.ts",
                      );
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify(await entry.data()));
                    } catch (error) {
                      next(error);
                    }
                  });
                },
                config() {
                  return {
                    builder: {
                      async buildApp(builder) {
                        await builder.build(builder.environments.client);
                        await builder.build(builder.environments.ssr);
                        await builder.build(builder.environments.externalServerEnv);
                      },
                    },
                  };
                },
              },
            ],
          });
        `,
        "app/root.tsx": js`
          import { Outlet, Scripts } from "react-router";
          export function Layout({ children }) {
            return <html><body>{children}<Scripts /></body></html>;
          }
          export function HydrateFallback() { return <p>Loading...</p>; }
          export default function Root() { return <Outlet />; }
        `,
        "app/routes/_index.tsx": js`
          export function loader() { return "loader data"; }
          export function action() { return "action data"; }
          export default function Index() { return <p>Index</p>; }
        `,
        "external-server-env.ts": js`
          import { loader, action } from "./app/routes/_index";
          export async function data() {
            return { loader: await loader(), action: await action() };
          }
        `,
      });
    });

    test("preserves server-only exports in development", async () => {
      let stop = await dev({ cwd, port });
      try {
        let response = await fetch(`http://localhost:${port}/external-data`);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          loader: "loader data",
          action: "action data",
        });
      } finally {
        stop();
      }
    });

    test("preserves server-only exports in production builds", async () => {
      let { status, stderr } = build({ cwd });
      expect(stderr.toString().trim()).toBeFalsy();
      expect(status).toBe(0);
      let entry = await import(
        pathToFileURL(path.join(cwd, "build/external-server/index.js")).href
      );
      expect(await entry.data()).toEqual({
        loader: "loader data",
        action: "action data",
      });
    });
  });
}
