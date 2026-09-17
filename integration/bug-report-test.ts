import { expect, test } from "@playwright/test";
import getPort from "get-port";

import { build, createProject, dev } from "./helpers/vite.js";

test("splitRouteModules enforce accepts JSX exports in Vite dev", async ({
  page,
}) => {
  let port = await getPort();
  let cwd = await createProject(
    {
      "react-router.config.ts": `
        import type { Config } from "@react-router/dev/config";

        export default {
          splitRouteModules: "enforce",
        } satisfies Config;
      `,
      "vite.config.ts": `
        import { reactRouter } from "@react-router/dev/vite";
        import react from "@vitejs/plugin-react";
        import { defineConfig } from "vite";

        export default defineConfig({
          plugins: [reactRouter(), react()],
          server: { port: ${port}, strictPort: true },
        });
      `,
      "app/routes/_index.tsx": `
        export function HydrateFallback() {
          return <p>Loading...</p>;
        }

        export default function Index() {
          return <h1>Ready</h1>;
        }
      `,
    },
    "rsc-vite-framework",
  );

  let buildResult = build({ cwd });
  expect(buildResult.status).toBe(0);

  let stop = await dev({ cwd, port });
  try {
    await page.goto(`http://localhost:${port}`);
    await expect(page.getByRole("heading", { name: "Ready" })).toBeVisible();
  } finally {
    stop();
  }
});
