import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = ["index.ts", "dom-export.ts", "lib/types/internal.ts"];

const config = (enableDevWarnings: boolean) =>
  defineConfig([
    {
      clean: false,
      entry,
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
      entry,
      format: ["esm"],
      // We don't do the external thing for `react-router` here because it
      // doesn't get bundled by default in the ESM build, and when we tried it
      // in https://github.com/remix-run/react-router/pull/13497 it changed up
      // some chunk creation that we didn't want to risk having any side effects
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
  ]);

export default defineConfig([
  // @ts-expect-error
  ...config(false),
  ...config(true),
]);
