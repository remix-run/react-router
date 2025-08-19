import { blockTags } from "../../typedoc.mjs";

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  entryPoints: ["./cli.ts"],
  blockTags,
};

export default config;
