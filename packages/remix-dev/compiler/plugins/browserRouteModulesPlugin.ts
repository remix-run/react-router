import * as path from "path";

import type esbuild from "esbuild";

import { RemixConfig } from "../../config";
import { getRouteModuleExportsCached } from "../routes";
import invariant from "../../invariant";

type Route = RemixConfig["routes"][string];

const browserSafeRouteExports: { [name: string]: boolean } = {
  CatchBoundary: true,
  ErrorBoundary: true,
  default: true,
  handle: true,
  links: true,
  meta: true,
  unstable_shouldReload: true
};

/**
 * This plugin loads route modules for the browser build, using module shims
 * that re-export only the route module exports that are safe for the browser.
 */
export function browserRouteModulesPlugin(
  config: RemixConfig,
  suffixMatcher: RegExp
): esbuild.Plugin {
  return {
    name: "browser-route-modules",
    async setup(build) {
      let routesByFile: Map<string, Route> = Object.keys(config.routes).reduce(
        (map, key) => {
          let route = config.routes[key];
          map.set(path.resolve(config.appDirectory, route.file), route);
          return map;
        },
        new Map()
      );

      build.onResolve({ filter: suffixMatcher }, args => {
        return { path: args.path, namespace: "browser-route-module" };
      });

      build.onLoad(
        { filter: suffixMatcher, namespace: "browser-route-module" },
        async args => {
          let theExports;
          let file = args.path.replace(suffixMatcher, "");
          let route = routesByFile.get(file);

          try {
            invariant(route, `Cannot get route by path: ${args.path}`);

            theExports = (
              await getRouteModuleExportsCached(config, route.id)
            ).filter(ex => !!browserSafeRouteExports[ex]);
          } catch (error: any) {
            return {
              errors: [
                {
                  text: error.message,
                  pluginName: "browser-route-module"
                }
              ]
            };
          }
          let spec =
            theExports.length > 0 ? `{ ${theExports.join(", ")} }` : "*";
          let contents = `export ${spec} from ${JSON.stringify(file)};`;

          return {
            contents,
            resolveDir: path.dirname(file),
            loader: "js",
          };
        }
      );
    }
  };
}
