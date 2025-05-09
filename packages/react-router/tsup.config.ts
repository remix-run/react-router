import { type Options, defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const config = (entry: string, enableDevWarnings: boolean): Options[] => [
  {
    clean: false,
    entry: [entry],
    format: ["cjs"],
    // Don't bundle `react-router` in sub-exports (i.e., `react-router/dom`)
    external: ["react-router"],
    outDir: enableDevWarnings ? "dist/development" : "dist/production",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
    define: {
      "import.meta.hot": "undefined",
      REACT_ROUTER_VERSION: JSON.stringify(pkg.version),
      __DEV__: JSON.stringify(enableDevWarnings),
    },
  },
  {
    clean: false,
    entry: [entry],
    format: ["esm"],
    // Don't bundle `react-router` in sub-exports (i.e., `react-router/dom`)
    external: ["react-router"],
    outDir: enableDevWarnings ? "dist/development" : "dist/production",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
    define: {
      REACT_ROUTER_VERSION: JSON.stringify(pkg.version),
      __DEV__: JSON.stringify(enableDevWarnings),
    },
  },
];

export default defineConfig([
  ...config("index.ts", false),
  ...config("index.ts", true),
  ...config("dom-export.ts", false),
  ...config("dom-export.ts", true),
  ...config("internal.ts", false),
  ...config("internal.ts", true),
]);
