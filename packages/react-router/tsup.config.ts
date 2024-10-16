import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

// @ts-expect-error - no types
import pkg from "./package.json" with { type: "json" };

const entry = ["index.ts", "dom-export.tsx", "lib/types.ts"];

export default defineConfig([
  {
    clean: false,
    entry,
    format: ["cjs"],
    outDir: "dist",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
    define: {
      "import.meta.hot": "undefined",
      REACT_ROUTER_VERSION: JSON.stringify(pkg.version),
    },
  },
  {
    clean: false,
    entry,
    format: ["esm"],
    outDir: "dist",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
    define: {
      REACT_ROUTER_VERSION: JSON.stringify(pkg.version),
    },
  },
]);
