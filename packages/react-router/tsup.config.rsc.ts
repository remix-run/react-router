import { defineConfig, type Options } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = ["index-react-server.ts"];
const external = ["react-router", "react-router/internal/react-server-client"];

const config = (enableDevWarnings: boolean) =>
  defineConfig([
    {
      clean: false,
      entry,
      external,
      format: ["cjs"],
      removeNodeProtocol: false,
      splitting: true,
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
      removeNodeProtocol: false,
      splitting: true,
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

export default defineConfig([...config(false), ...config(true)]);
