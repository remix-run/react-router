// This file allows us to dynamically require the plugin so non-Vite consumers
// don't need to have Vite installed as a peer dependency. Only types should
// be imported at the top level, or code that doesn't import Vite.
import type { RemixVitePlugin } from "./plugin";
export type {
  BuildManifest,
  Preset,
  VitePluginConfig,
  ServerBundlesFunction,
} from "./plugin";

export const vitePlugin: RemixVitePlugin = (...args) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let { remixVitePlugin } = require("./plugin") as typeof import("./plugin");
  return remixVitePlugin(...args);
};

export { cloudflareDevProxyVitePlugin } from "./cloudflare-proxy-plugin";
