// This file allows us to dynamically require the plugin so non-Vite consumers
// don't need to have Vite installed as a peer dependency. Only types should
// be imported at the top level.
import type { ViteDevServer } from "vite";

import type { RemixVitePlugin } from "./plugin";
import { id } from "./vmod";

export const unstable_vitePlugin: RemixVitePlugin = (...args) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let { remixVitePlugin } = require("./plugin") as typeof import("./plugin");
  return remixVitePlugin(...args);
};

export const unstable_createViteServer = async () => {
  let vite = await import("vite");
  return vite.createServer({
    server: {
      middlewareMode: true,
    },
  });
};

export const unstable_loadViteServerBuild = async (vite: ViteDevServer) => {
  return vite.ssrLoadModule(id("server-entry"));
};
