import { test, expect } from "@playwright/test";
import dedent from "dedent";

import { createProject, viteBuild } from "./helpers/vite.js";

test.describe(() => {
  let cwd: string;
  let buildResult: ReturnType<typeof viteBuild>;

  test.beforeAll(async () => {
    cwd = await createProject({
      "vite.config.ts": dedent`
        import { vitePlugin as remix } from "@remix-run/dev";
        import mdx from "@mdx-js/rollup";

        export default {
          plugins: [
            remix(),
            mdx(),
          ],
        }
      `,
    });

    buildResult = viteBuild({ cwd });
  });

  test("Vite / plugin order validation / MDX", () => {
    expect(buildResult.stderr.toString()).toContain(
      'Error: The "@mdx-js/rollup" plugin should be placed before the Remix plugin in your Vite config file'
    );
  });
});
