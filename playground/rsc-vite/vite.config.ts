import { cloudflare } from "@cloudflare/vite-plugin";
import reactServerDOM from "@jacob-ebey/vite-react-server-dom";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    external: ["cloudflare:workers"],
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: "src/browser/entry.browser.tsx",
          treeshake: {
            moduleSideEffects: () => {
              return false;
            },
          },
        },
      },
    },
  },
  plugins: [
    tsconfigPaths({ configNames: ["tsconfig.client.json"] }),
    reactServerDOM({
      browserEnvironment: "client",
      serverEnvironments: ["server"],
      ssrEnvironments: ["ssr"],
      runtime: {
        browser: {
          importFrom: "framework/references.browser",
        },
        server: {
          importFrom: "framework/references.server",
        },
        ssr: {
          importFrom: "framework/references.ssr",
        },
      },
    }),
    cloudflare({
      persistState: true,
      configPath: "src/ssr/wrangler.toml",
      auxiliaryWorkers: [
        {
          configPath: "src/server/wrangler.toml",
        },
      ],
    }),
  ],
});
