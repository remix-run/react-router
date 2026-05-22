import { defineConfig } from "tsdown";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.ts";

import pkg from "./package.json" with { type: "json" };

const entry = ["cli.ts"];

export default defineConfig([
  {
    clean: true,
    entry,
    format: "esm",
    fixedExtension: false,
    unbundle: true,
    outDir: "dist",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
  },
]);