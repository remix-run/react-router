import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

// @ts-expect-error - no types
import pkg from "./package.json" with { type: "json" };

const entry = ["index.ts", "install.ts"];

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
