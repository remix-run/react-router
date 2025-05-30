import { defineConfig, type Options } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = ["rsc-export.ts"];
const external = ["react-router"];

const config = (enableDevWarnings: boolean) =>
  defineConfig([
    {
      clean: false,
      entry,
      external,
      format: ["cjs"],
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
      treeshake: true,
    },
    {
      clean: false,
      entry,
      external,
      format: ["esm"],
      outDir: enableDevWarnings ? "dist/development" : "dist/production",
      dts: true,
      banner: {
        js: createBanner(pkg.name, pkg.version),
      },
      define: {
        REACT_ROUTER_VERSION: JSON.stringify(pkg.version),
        __DEV__: JSON.stringify(enableDevWarnings),
      },
      treeshake: true,
    },
  ]) as Options[];

export default defineConfig([
  ...config(false),
  ...config(true),
]);
