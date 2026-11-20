import { test, expect } from "@playwright/test";
import dedent from "dedent";

import { createProject, build, reactRouterConfig } from "./helpers/vite.js";
import { viteMajorTemplates } from "./helpers/templates";

test.describe("Vite plugin order validation", () => {
  for (const plugins of [
    "[react(), reactRouter()]",
    "[reactRouter(), react(), react()]",
  ]) {
    test(`Framework Mode rejects ${plugins}`, async () => {
      const cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({
          future: { unstable_externalReactPlugin: true },
        }),
        "vite.config.ts": `import { reactRouter } from "@react-router/dev/vite";
          import react from "@vitejs/plugin-react";
          export default { plugins: ${plugins} };`,
      });
      const result = build({ cwd });
      expect(result.status).not.toBe(0);
      expect(result.stderr.toString()).toContain(
        plugins.startsWith("[react(),")
          ? 'The "@vitejs/plugin-react" plugin should be placed after the React Router plugin'
          : 'Only one "@vitejs/plugin-react" plugin can be used with React Router',
      );
    });
  }

  test("Framework Mode with MDX plugin after React Router plugin", async () => {
    let cwd = await createProject({
      "vite.config.ts": dedent`
        import { reactRouter } from "@react-router/dev/vite";
        import mdx from "@mdx-js/rollup";

        export default {
          plugins: [
            reactRouter(),
            mdx(),
          ],
        }
      `,
    });

    let buildResult = build({ cwd });
    expect(buildResult.stderr.toString()).toContain(
      'Error: The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config',
    );
  });

  for (const template of viteMajorTemplates) {
    for (const plugins of [
      "[mdx(), reactRouter(), react()]",
      '[reactRouter(), { enforce: "pre", ...mdx() }, react()]',
      '[{ enforce: "pre", ...mdx(), transform: { order: "post", handler: mdx().transform } }, reactRouter(), react()]',
    ]) {
      test(`${template.displayName} with external React plugin rejects ${plugins}`, async () => {
        const cwd = await createProject(
          {
            "react-router.config.ts": reactRouterConfig({
              future: { unstable_externalReactPlugin: true },
            }),
            "vite.config.ts": `import { reactRouter } from "@react-router/dev/vite";
              import mdx from "@mdx-js/rollup";
              import react from "@vitejs/plugin-react";
              export default { plugins: ${plugins} };`,
          },
          template.name,
        );
        const result = build({ cwd });
        expect(result.status).not.toBe(0);
        expect(result.stderr.toString()).toContain(
          'Use { enforce: "pre", ...mdx() } before reactRouter() in your Vite config',
        );
      });
    }

    test(`${template.displayName} with external React plugin accepts MDX before route transforms`, async () => {
      const cwd = await createProject(
        {
          "react-router.config.ts": reactRouterConfig({
            future: { unstable_externalReactPlugin: true },
          }),
          "vite.config.ts": dedent`
            import { reactRouter } from "@react-router/dev/vite";
            import mdx from "@mdx-js/rollup";
            import react from "@vitejs/plugin-react";

            export default {
              plugins: [
                Object.freeze({ enforce: "pre", ...mdx() }),
                reactRouter(),
                react({ include: /\.(mdx?|[jt]sx?)$/ }),
              ],
            };
          `,
          "app/routes/mdx.mdx": dedent`
            import { message } from "../message.server";

            export const loader = () => ({ message });

            # MDX Route
          `,
          "app/message.server.ts": 'export const message = "server only";',
        },
        template.name,
      );
      const result = build({ cwd });
      expect(result.stderr.toString()).toBe("");
      expect(result.status).toBe(0);
    });
  }

  test("RSC Framework Mode with MDX plugin after React Router plugin", async () => {
    let cwd = await createProject(
      {
        "vite.config.js": dedent`
          import { defineConfig } from "vite";
          import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
          import react from "@vitejs/plugin-react";
          import rsc from "@vitejs/plugin-rsc";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            plugins: [
              reactRouterRSC(),
              react(),
              rsc(),
              mdx(),
            ],
          });
        `,
        "react-router.config.ts": reactRouterConfig(),
      },
      "rsc-vite-framework",
    );

    let buildResult = build({ cwd });
    expect(buildResult.stderr.toString()).toContain(
      'Error: The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config',
    );
  });

  test("RSC Framework Mode with @vitejs/plugin-rsc before React Router plugin", async () => {
    let cwd = await createProject(
      {
        "vite.config.js": dedent`
          import { defineConfig } from "vite";
          import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
          import rsc from "@vitejs/plugin-rsc";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            plugins: [
              rsc(),
              reactRouterRSC(),
            ],
          });
        `,
        "react-router.config.ts": reactRouterConfig(),
      },
      "rsc-vite-framework",
    );

    let buildResult = build({ cwd });
    expect(buildResult.stderr.toString()).toContain(
      'Error: The "@vitejs/plugin-rsc" plugin should be placed after the React Router RSC plugin in your Vite config',
    );
  });
});
