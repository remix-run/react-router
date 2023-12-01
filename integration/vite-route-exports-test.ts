import { test, expect } from "@playwright/test";

import { createProject, viteBuild } from "./helpers/vite.js";

test("Vite / invalid route exports / expected build error", async () => {
  let cwd = await createProject({
    "app/routes/fail-non-remix-exports.tsx": String.raw`
      // Remix exports
      export const ErrorBoundary = () => {}
      export const action = () => {}
      export const handle = () => {}
      export const headers = () => {}
      export const links = () => {}
      export const loader = () => {}
      export const meta = () => {}
      export const shouldRevalidate = () => {}
      export default function() {}

      // Non-Remix exports
      export const invalid1 = 1;
      export const invalid2 = 2;
    `,
  });
  let client = viteBuild({ cwd })[0];
  let stderr = client.stderr.toString("utf8");
  expect(stderr).toMatch(
    "2 invalid route exports in `routes/fail-non-remix-exports.tsx`:\n  - `invalid1`\n  - `invalid2`"
  );
  expect(stderr).toMatch(
    "See https://remix.run/docs/en/main/future/vite#strict-route-exports"
  );
});

test("Vite / invalid route exports / ignore in mdx", async () => {
  let cwd = await createProject({
    "vite.config.ts": String.raw`
      import { defineConfig } from "vite";
      import { unstable_vitePlugin as remix } from "@remix-run/dev";
      import mdx from "@mdx-js/rollup";

      export default defineConfig({
        plugins: [
          remix(),
          mdx(),
        ],
      });
    `,
    "app/routes/pass-non-remix-exports-in-mdx.mdx": String.raw`
      // Remix exports
      export const ErrorBoundary = () => {}
      export const action = () => {}
      export const handle = () => {}
      export const headers = () => {}
      export const links = () => {}
      export const loader = () => {}
      export const meta = () => {}
      export const shouldRevalidate = () => {}
      export default function() {}

      // Non-Remix exports
      export const invalid1 = 1;
      export const invalid2 = 2;

      # Hello World
    `,
  });
  let [client, server] = viteBuild({ cwd });
  expect(client.status).toBe(0);
  expect(server.status).toBe(0);
});
