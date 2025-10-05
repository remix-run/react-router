import { defineConfig } from "tsdown";
import { createBanner } from "../../build.utils.mts";
import pkg from "./package.json" with { type: "json" };

const entry = ["index.ts"];

export default defineConfig([
  {
    entry,
    format: ["cjs"],
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
  },
]);
