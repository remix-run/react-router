export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./config";
export type {
  RouteConfig,
  RouteManifest,
  RouteManifestFunction,
  RouteManifestEntry,
} from "./config/routes";
export { defineRoutes } from "./config/routes";
export { reactRouterVitePlugin as vitePlugin } from "./vite/plugin";
export { cloudflareDevProxyVitePlugin } from "./vite/cloudflare-dev-proxy";
