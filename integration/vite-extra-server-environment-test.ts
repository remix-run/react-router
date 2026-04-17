import { test, expect } from "@playwright/test";
import glob from "glob";

import { build, createProject, reactRouterConfig } from "./helpers/vite.js";

const js = String.raw;

test("ignores external server environments without skipping React Router build hooks", async () => {
  let cwd = await createProject(
    {
      "react-router.config.ts": reactRouterConfig({
        future: { v8_viteEnvironmentApi: true },
      }),
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
    "vite-6-template",
  );

  let { status, stderr } = build({ cwd });

  expect(stderr.toString().trim()).toBeFalsy();
  expect(status).toBe(0);
  expect(glob.sync("build/client/assets/test-*.txt", { cwd }).length).toBe(1);
});
