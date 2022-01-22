import * as path from "path";
import type esbuild from "esbuild";

import type { RemixConfig } from "../../config";

/**
 * This plugin substitutes an empty module for any modules in the `app`
 * directory that match the given `filter`.
 */
export function emptyModulesPlugin(
  config: RemixConfig,
  filter: RegExp
): esbuild.Plugin {
  return {
    name: "empty-modules",
    setup(build) {
      build.onResolve({ filter }, args => {
        let resolved = path.resolve(args.resolveDir, args.path);
        if (
          // Limit this behavior to modules found in only the `app` directory.
          // This allows node_modules to use the `.server.js` and `.client.js`
          // naming conventions with different semantics.
          resolved.startsWith(config.appDirectory)
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
          loader: "js"
        };
      });
    }
  };
}
