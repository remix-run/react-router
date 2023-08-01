import * as path from "node:path";
import type esbuild from "esbuild";

import type { Context } from "../context";

/**
 * This plugin substitutes an empty module for any modules in the `app`
 * directory that match the given `filter`.
 */
export function emptyModulesPlugin(
  { config }: Context,
  filter: RegExp,
  { includeNodeModules = false } = {}
): esbuild.Plugin {
  return {
    name: "empty-modules",
    setup(build) {
      build.onResolve({ filter }, (args) => {
        if (
          includeNodeModules ||
          // Limit this behavior to modules found in only the `app` directory.
          // This allows node_modules to use the `.server.js` and `.client.js`
          // naming conventions with different semantics.
          path
            .resolve(args.resolveDir, args.path)
            .startsWith(config.appDirectory)
        ) {
          return { path: args.path, namespace: "empty-module" };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "empty-module" }, () => {
        return {
          // Use an empty CommonJS module here instead of ESM to avoid "No
          // matching export" errors in esbuild for stuff that is imported
          // from this file.
          contents: "module.exports = {};",
          loader: "js",
        };
      });
    },
  };
}
