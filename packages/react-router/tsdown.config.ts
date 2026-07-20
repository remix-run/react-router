import { defineConfig, type UserConfig } from "tsdown";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.ts";

import pkg from "./package.json" with { type: "json" };

const entry = [
  "index.ts",
  "index-react-server-client.ts",
  "dom-export.ts",
  "lib/types/internal.ts",
];

const neverBundle = [
  "react-router",
  "react-router/internal/react-server-client",
];

const config = (enableDevWarnings: boolean): UserConfig => ({
  clean: false,
  entry,
  deps: {
    neverBundle,
  },
  format: "esm",
  fixedExtension: false,
  unbundle: true,
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
});

export default defineConfig([config(false), config(true)]);
