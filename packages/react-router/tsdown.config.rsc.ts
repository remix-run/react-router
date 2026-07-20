import { defineConfig, type UserConfig } from "tsdown";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.ts";

import pkg from "./package.json" with { type: "json" };

const entry = ["index-react-server.ts"];
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
});

export default defineConfig([config(false), config(true)]);
