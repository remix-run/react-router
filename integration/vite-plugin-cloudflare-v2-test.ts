import { expect, test } from "@playwright/test";
import dedent from "dedent";
import fs from "node:fs";
import path from "node:path";

import { build, createProject } from "./helpers/vite.js";

const ts = dedent;

test.describe("vite-plugin-cloudflare v2", () => {
  test("builds to Build Output", async () => {
    const cwd = await createProject(
      {
        "vite.config.ts": ts`
          import { defineConfig } from "vite";
          import { cloudflare } from "@cloudflare/vite-plugin-v2";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            plugins: [
              cloudflare({ viteEnvironment: { name: "ssr" } }),
              reactRouter(),
            ],
          });
        `,
        "cloudflare.config.ts": ts`
          import { defineConfig, defineWorker } from "cf/config";
          import * as entrypoint from "./workers/app.ts" with { type: "cf-worker" };

          export default defineConfig({
            worker: defineWorker({
              name: "react-router-app",
              entrypoint,
              compatibilityDate: "2025-03-17",
            }),
          });
        `,
      },
      "vite-plugin-cloudflare-template",
    );

    const buildResult = build({ cwd });

    expect(buildResult.status).toBe(0);
    expect(fs.existsSync(path.join(cwd, ".cloudflare/output"))).toBe(true);
  });
});
