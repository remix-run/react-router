import { blockTags } from "../../typedoc.mjs";

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  entryPoints: ["./index.ts", "./dom-export.ts"],
  categoryOrder: [
    "Components",
    "Hooks",
    "Data Routers",
    "Component Routers",
    "Utils",
    "Types",
    "*",
  ],
  blockTags,
};

export default config;
