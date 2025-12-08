import { defineConfig } from "tsdown";
import { createBanner } from "../../build.utils.mts";
import pkg from "./package.json" with { type: "json" };

const entry = [
  "cli/index.ts",
  "config.ts",
  "routes.ts",
  "vite.ts",
  "vite/cloudflare.ts",
];

const external = [
  "./static/refresh-utils.mjs",
  "./static/rsc-refresh-utils.mjs",
  /\.json$/,
  "vite",
];

export default defineConfig({
  entry,
  format: "cjs",
  external,
  banner: {
    js: createBanner(pkg.name, pkg.version),
  },
  dts: true,
  fixedExtension: false,
  copy: [
    {
      from: "vite/static/refresh-utils.mjs",
      to: "dist/static/refresh-utils.mjs",
    },
    {
      from: "vite/static/rsc-refresh-utils.mjs",
      to: "dist/static/rsc-refresh-utils.mjs",
    },
    {
      from: "config/default-rsc-entries",
      to: "dist/config/default-rsc-entries",
    },
  ],
});
