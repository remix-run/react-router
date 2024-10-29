import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = ["index.ts"];

export default defineConfig([
  {
    clean: true,
    entry,
    format: ["cjs"],
    outDir: "dist",
    dts: true,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
  },
]);
