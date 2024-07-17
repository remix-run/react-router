export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./config";
export { defineRoutes, configRoutes, fileRoutes } from "./config/routes";
export { vitePlugin, cloudflareDevProxyVitePlugin } from "./vite";
