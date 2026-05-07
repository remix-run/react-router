import { blockTags } from "../../typedoc.mjs";

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  entryPoints: [
    "./index.ts",
    "./config.ts",
    "./routes.ts",
    "./vite.ts",
    "./vite/cloudflare.ts",
  ],
  blockTags,
};

export default config;
