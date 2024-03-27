import * as path from "node:path";
import fse from "fs-extra";
import type esbuild from "esbuild";

import { getLoaderForFile } from "../../utils/loaders";
import type { Context } from "../../context";

/**
 * This plugin loads route modules for the server build and prevents errors
 * while adding new files in development mode.
 */
export function serverRouteModulesPlugin({ config }: Context): esbuild.Plugin {
  return {
    name: "server-route-modules",
    setup(build) {
      let routeFiles = new Set(
        Object.keys(config.routes).map((key) =>
          path.resolve(config.appDirectory, config.routes[key].file)
        )
      );

      build.onResolve({ filter: /.*/ }, (args) => {
        if (routeFiles.has(args.path)) {
          return { path: args.path, namespace: "route" };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "route" }, async (args) => {
        let file = args.path;
        let contents = await fse.readFile(file, "utf-8");

        // Default to `export {}` if the file is empty so esbuild interprets
        // this file as ESM instead of CommonJS with `default: {}`. This helps
        // in development when creating new files.
        // See https://github.com/evanw/esbuild/issues/1043
        if (!/\S/.test(contents)) {
          return { contents: "export {}", loader: "js" };
        }

        return {
          contents,
          resolveDir: path.dirname(file),
          loader: getLoaderForFile(file),
        };
      });
    },
  };
}
