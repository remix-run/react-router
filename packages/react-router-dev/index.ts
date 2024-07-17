export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./config";
export { defineRoutes, dataRoutes, fsRoutes } from "./config/routes";
export { vitePlugin, cloudflareDevProxyVitePlugin } from "./vite";
