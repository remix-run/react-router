import * as fsp from "fs/promises";

import { defineConfig } from "tsdown";
import { createBanner } from "../../build.utils.mts";
import pkg from "./package.json" with { type: "json" };

const entry = [
  "cli/index.ts",
  "config.ts",
  "internal.ts",
  "routes.ts",
  "vite.ts",
  "vite/cloudflare.ts",
];

const external = [
  "./static/refresh-utils.mjs",
  "./static/rsc-refresh-utils.mjs",
  /\.json$/,
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
  plugins: [
    {
      name: "copy",
      async buildEnd() {
        await fsp.mkdir("dist/static", { recursive: true });
        await fsp.copyFile(
          "vite/static/refresh-utils.mjs",
          "dist/static/refresh-utils.mjs",
        );
        await fsp.copyFile(
          "vite/static/rsc-refresh-utils.mjs",
          "dist/static/rsc-refresh-utils.mjs",
        );

        await fsp.mkdir("dist/config/defaults", { recursive: true });
        const files = await fsp.readdir("config/defaults");
        for (const file of files) {
          await fsp.copyFile(
            `config/defaults/${file}`,
            `dist/config/defaults/${file}`,
          );
        }

        await fsp.mkdir("dist/config/default-rsc-entries", {
          recursive: true,
        });
        const rscFiles = await fsp.readdir("config/default-rsc-entries");
        for (const file of rscFiles) {
          await fsp.copyFile(
            `config/default-rsc-entries/${file}`,
            `dist/config/default-rsc-entries/${file}`,
          );
        }
      },
    },
  ],
});
