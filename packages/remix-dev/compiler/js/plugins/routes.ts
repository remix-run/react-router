import * as path from "node:path";
import type esbuild from "esbuild";

import type { RemixConfig } from "../../../config";
import { getRouteModuleExports } from "../../utils/routeExports";
import invariant from "../../../invariant";
import type { Context } from "../../context";

type Route = RemixConfig["routes"][string];

// If you change this, make sure you update loadRouteModuleWithBlockingLinks in
// remix-react/routes.ts
const browserSafeRouteExports: { [name: string]: boolean } = {
  clientAction: true,
  clientLoader: true,
  ErrorBoundary: true,
  HydrateFallback: true,
  Layout: true,
  default: true,
  handle: true,
  links: true,
  meta: true,
  shouldRevalidate: true,
};

/**
 * This plugin loads route modules for the browser build, using module shims
 * that re-export only the route module exports that are safe for the browser.
 */
export function browserRouteModulesPlugin(
  { config, fileWatchCache }: Context,
  suffixMatcher: RegExp
): esbuild.Plugin {
  return {
    name: "browser-route-modules",
    async setup(build) {
      let routesByFile: Map<string, Route> = Object.keys(config.routes).reduce(
        (map, key) => {
          let route = config.routes[key];
          map.set(route.file, route);
          return map;
        },
        new Map()
      );

      build.onResolve({ filter: suffixMatcher }, (args) => {
        return {
          path: args.path,
          namespace: "browser-route-module",
        };
      });

      build.onLoad(
        { filter: suffixMatcher, namespace: "browser-route-module" },
        async (args) => {
          let theExports;
          let file = args.path.replace(suffixMatcher, "");
          let route = routesByFile.get(file);

          try {
            invariant(route, `Cannot get route by path: ${args.path}`);

            let cacheKey = `module-exports:${route.id}`;
            let { cacheValue: sourceExports } = await fileWatchCache.getOrSet(
              cacheKey,
              async () => {
                let file = path.resolve(
                  config.appDirectory,
                  config.routes[route!.id].file
                );
                return {
                  cacheValue: await getRouteModuleExports(config, route!.id),
                  fileDependencies: new Set([file]),
                };
              }
            );

            theExports = sourceExports.filter(
              (ex) => !!browserSafeRouteExports[ex]
            );
          } catch (error: any) {
            return {
              errors: [
                {
                  text: error.message,
                  pluginName: "browser-route-module",
                },
              ],
            };
          }

          let contents = "module.exports = {};";
          if (theExports.length !== 0) {
            let spec = `{ ${theExports.join(", ")} }`;
            contents = `export ${spec} from ${JSON.stringify(`./${file}`)};`;
          }

          return {
            contents,
            resolveDir: config.appDirectory,
            loader: "js",
          };
        }
      );
    },
  };
}
