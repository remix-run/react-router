import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

import type { Context } from "../../context";

export const serverNodeBuiltinsPolyfillPlugin = (ctx: Context) =>
  nodeModulesPolyfillPlugin({
    // Rename plugin to improve error message attribution
    name: "server-node-builtins-polyfill-plugin",
    // Only pass through the "modules" and "globals" options to ensure we
    // don't leak the full plugin API to Remix consumers.
    modules: ctx.config.serverNodeBuiltinsPolyfill?.modules ?? {},
    globals: ctx.config.serverNodeBuiltinsPolyfill?.globals ?? {},
    // Since the server environment may provide its own Node polyfills,
    // we don't define any fallback behavior here and allow all Node
    // builtins to be marked as external
    fallback: "none",
  });
