export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./vite";
export { vitePlugin, cloudflareDevProxyVitePlugin } from "./vite";
