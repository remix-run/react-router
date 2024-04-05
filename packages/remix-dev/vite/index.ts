// This file allows us to dynamically require the plugin so non-Vite consumers
// don't need to have Vite installed as a peer dependency. Only types should
// be imported at the top level, or code that doesn't import Vite.
import type { ReactRouterVitePlugin } from "./plugin";
export type {
  BuildManifest,
  Preset,
  VitePluginConfig,
  ServerBundlesFunction,
} from "./plugin";

export const vitePlugin: ReactRouterVitePlugin = (...args) => {
  let { reactRouterVitePlugin } =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    require("./plugin") as typeof import("./plugin");
  return reactRouterVitePlugin(...args);
};

export { cloudflareDevProxyVitePlugin } from "./cloudflare-proxy-plugin";
