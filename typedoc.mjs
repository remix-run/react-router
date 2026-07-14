import { OptionDefaults } from "typedoc";

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  name: "React Router API Reference",
  entryPoints: ["packages/*"],
  entryPointStrategy: "packages",
  includeVersion: false,
  json: "./public/dev/api.json",
  out: "./public/dev",
  hostedBaseUrl: "https://api.reactrouter.com/dev/",
};

export default config;

// Because we use `entryPointStrategy: "packages"`, the root config is not
// inherited by the child packages so we can export shared stuff here for them
// to use. See https://typedoc.org/documents/Options.Input.html#entrypointstrategy
export const blockTags = [
  ...OptionDefaults.blockTags,
  "@name",
  "@mode",
  "@additionalExamples",
];
