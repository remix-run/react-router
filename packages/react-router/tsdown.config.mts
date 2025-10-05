// eslint-disable-next-line no-unused-vars
import { defineConfig, type Options } from "tsdown";
import { createBanner } from "../../build.utils.mts";
import pkg from "./package.json" with { type: "json" };

const config = (enableDevWarnings: boolean): Options => ({
  entry: [
    "index.ts",
    "index-react-server-client.ts",
    "dom-export.ts",
    "lib/types/internal.ts",
  ],
  external: ["react-router", "react-router/internal/react-server-client"],
  format: ["esm", "cjs"],
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
});

const configRsc = (enableDevWarnings: boolean): Options => ({
  entry: ["index-react-server.ts"],
  external: ["react-router", "react-router/internal/react-server-client"],
  format: ["esm", "cjs"],
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
});

export default defineConfig([
  config(false),
  config(true),
  configRsc(false),
  configRsc(true),
]);
