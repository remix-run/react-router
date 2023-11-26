// This file allows us to dynamically require the plugin so non-Vite consumers
// don't need to have Vite installed as a peer dependency. Only types should
// be imported at the top level.
import type { RemixVitePlugin } from "./plugin";
import { serverEntryId } from "./server-entry-id";

export const unstable_vitePlugin: RemixVitePlugin = (...args) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let { remixVitePlugin } = require("./plugin") as typeof import("./plugin");
  return remixVitePlugin(...args);
};

// We rename this export because from a consumer's perspective this is the
// "server build" since they also provide their own server entry
export const unstable_viteServerBuildModuleId = serverEntryId;
