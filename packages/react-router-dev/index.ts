export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export type {
  BuildManifest,
  Preset,
  ServerBundlesFunction,
  VitePluginConfig,
} from "./config";
export {
  defineRoutesConfig as defineRoutes,
  dataRoutes,
  fsRoutes,
} from "./config/routes";
export { vitePlugin } from "./vite";
