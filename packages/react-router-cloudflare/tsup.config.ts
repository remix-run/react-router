import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = ["index.ts"];
const dts = { compilerOptions: { ignoreDeprecations: "6.0" } };

export default defineConfig([
  {
    clean: true,
    entry,
    format: ["esm"],
    outDir: "dist",
    dts,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
  },
]);
