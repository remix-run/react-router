import "./modules";

export type { AppConfig, RemixConfig as ResolvedRemixConfig } from "./config";

export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export { getDependenciesToBundle } from "./dependencies";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./vite";
export { vitePlugin, cloudflareDevProxyVitePlugin } from "./vite";
