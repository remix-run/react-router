import { blockTags } from "../../typedoc.mjs";

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  entryPoints: ["./index.ts"],
  blockTags,
};

export default config;
