import "./modules";

export type { AppConfig, RemixConfig as ResolvedRemixConfig } from "./config";

export * as cli from "./cli/index";
export { createApp } from "./cli/create";
export { CliError } from "./cli/error";

export { type Manifest as AssetsManifest } from "./manifest";
export { getDependenciesToBundle } from "./dependencies";
