import { test, expect } from "@playwright/test";
import dedent from "dedent";

import { createProject, build, reactRouterConfig } from "./helpers/vite.js";

test.describe("Vite plugin order validation", () => {
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

  test("RSC Framework Mode with MDX plugin after React Router plugin", async () => {
    let cwd = await createProject(
      {
        "vite.config.js": dedent`
          import { defineConfig } from "vite";
          import { __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__ } from "@react-router/dev/internal";
          import rsc from "@vitejs/plugin-rsc";
          import mdx from "@mdx-js/rollup";

          const { unstable_reactRouterRSC: reactRouterRSC } =
            __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__;

          export default defineConfig({
            plugins: [
              reactRouterRSC(),
              rsc(),
              mdx(),
            ],
          });
        `,
        "react-router.config.ts": reactRouterConfig({
          viteEnvironmentApi: true,
        }),
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
          import { __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__ } from "@react-router/dev/internal";
          import rsc from "@vitejs/plugin-rsc";
          import mdx from "@mdx-js/rollup";

          const { unstable_reactRouterRSC: reactRouterRSC } =
            __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__;

          export default defineConfig({
            plugins: [
              rsc(),
              reactRouterRSC(),
            ],
          });
        `,
        "react-router.config.ts": reactRouterConfig({
          viteEnvironmentApi: true,
        }),
      },
      "rsc-vite-framework",
    );

    let buildResult = build({ cwd });
    expect(buildResult.stderr.toString()).toContain(
      'Error: The "@vitejs/plugin-rsc" plugin should be placed after the React Router RSC plugin in your Vite config',
    );
  });
});
