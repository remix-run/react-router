import path from "node:path";
import type { Plugin } from "esbuild";

import type { RemixConfig } from "../../config";

export const cssBundleEntryModuleId = "__remix_cssBundleEntryModule__";
const filter = new RegExp(`^${cssBundleEntryModuleId}$`);

/**
 * Creates a virtual module that imports all browser build entry points so that
 * all reachable CSS can be included in a single file at the end of the build.
 */
export function cssBundleEntryModulePlugin(config: RemixConfig): Plugin {
  return {
    name: "css-bundle-entry-module",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "css-bundle-entry-module",
        };
      });

      build.onLoad({ filter }, async () => {
        return {
          resolveDir: config.appDirectory,
          loader: "js",
          contents: [
            // These need to be exports to avoid tree shaking
            `export * as entryClient from ${JSON.stringify(
              path.resolve(config.rootDirectory, config.entryClientFilePath)
            )};`,
            ...Object.keys(config.routes).map((key, index) => {
              let route = config.routes[key];
              return `export * as route${index} from ${JSON.stringify(
                `./${route.file}`
              )};`;
            }),
          ].join("\n"),
        };
      });
    },
  };
}
