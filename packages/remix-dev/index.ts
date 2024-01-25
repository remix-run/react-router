import "./modules";

export type { AppConfig, RemixConfig as ResolvedRemixConfig } from "./config";

export * as cli from "./cli/index";

export type { Manifest as AssetsManifest } from "./manifest";
export { getDependenciesToBundle } from "./dependencies";
export type {
  Unstable_BuildManifest,
  Unstable_VitePluginAdapter,
} from "./vite";
export {
  unstable_vitePlugin,
  unstable_vitePluginAdapterCloudflare,
} from "./vite";
