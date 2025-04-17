import * as path from "node:path";

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
      resolve: {
        conditions: ["module-sync"],
      },
    },
    ssr: {
      resolve: {
        noExternal: true,
        conditions: ["module-sync"],
      },
    },
    server: {
      resolve: {
        noExternal: true,
        conditions: ["module-sync"],
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
          importFrom: path.resolve("./framework/references.browser.ts"),
        },
        server: {
          importFrom: path.resolve("./framework/references.rsc.ts"),
        },
        ssr: {
          importFrom: path.resolve("./framework/references.ssr.ts"),
        },
      },
    }),
    cloudflare({
      persistState: true,
      configPath: "src/ssr/wrangler.toml",
      auxiliaryWorkers: [
        {
          configPath: "src/rsc/wrangler.toml",
        },
      ],
    }),
  ],
});
