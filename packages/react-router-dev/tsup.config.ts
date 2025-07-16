import * as fsp from "fs/promises";

import { defineConfig } from "tsup";

// @ts-ignore - out of scope
import { createBanner } from "../../build.utils.js";

import pkg from "./package.json";

const entry = [
  "cli/index.ts",
  "config.ts",
  "routes.ts",
  "vite.ts",
  "vite/cloudflare.ts",
];

const external = ["./static/refresh-utils.mjs", /\.json$/];

export default defineConfig([
  {
    clean: true,
    entry,
    format: ["cjs"],
    outDir: "dist",
    dts: true,
    external,
    banner: {
      js: createBanner(pkg.name, pkg.version),
    },
    plugins: [
      {
        name: "copy",
        async buildEnd() {
          await fsp.mkdir("dist/static", { recursive: true });
          await fsp.copyFile(
            "vite/static/refresh-utils.mjs",
            "dist/static/refresh-utils.mjs"
          );

          await fsp.mkdir("dist/config/defaults", { recursive: true });
          const files = await fsp.readdir("config/defaults");
          for (const file of files) {
            await fsp.copyFile(
              `config/defaults/${file}`,
              `dist/config/defaults/${file}`
            );
          }
        },
      },
    ],
  },
]);
