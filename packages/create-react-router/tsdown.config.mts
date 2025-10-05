import { defineConfig } from "tsdown";
import { createBanner } from "../../build.utils.mts";
import pkg from "./package.json" with { type: "json" };

const entry = ["cli.ts"];

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
