import "./modules";

export type { AppConfig, RemixConfig as ResolvedRemixConfig } from "./config";

export * as cli from "./cli/index";
export { createApp } from "./cli/create";
export { CliError } from "./cli/error";

export type { Type as AssetsManifest } from "./compiler/manifest";
export { getDependenciesToBundle } from "./dependencies";
