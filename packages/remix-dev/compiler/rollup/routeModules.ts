import * as fs from "fs";
import type { Plugin } from "rollup";

import { BuildTarget } from "../../build";
import { getRemixConfig } from "./remixConfig";

export const routeModuleProxy = "?route-module-proxy";
export const emptyRouteModule = "?empty-route-module";

/**
 * A resolver/loader for route modules that does a few things:
 *
 * - when building for the browser, it excludes server-only code from the build
 * - when new route files are created in development (watch) mode, it creates
 *   an empty shim for the module so Rollup doesn't complain and the build
 *   doesn't break
 */
export default function routeModulesPlugin({
  target
}: {
  target: string;
}): Plugin {
  return {
    name: "routeModules",

    async options(options) {
      let input = options.input;

      if (input && typeof input === "object" && !Array.isArray(input)) {
        let config = await getRemixConfig(options.plugins);
        let routeIds = Object.keys(config.routes);

        for (let alias in input) {
          if (routeIds.includes(alias)) {
            input[alias] = input[alias] + routeModuleProxy;
          }
        }
      }

      return options;
    },

    async resolveId(id, importer) {
      if (id.endsWith(routeModuleProxy) || id.endsWith(emptyRouteModule)) {
        return id;
      }

      if (
        importer &&
        importer.endsWith(routeModuleProxy) &&
        importer.slice(0, -routeModuleProxy.length) === id
      ) {
        let resolved = await this.resolve(id, importer, { skipSelf: true });

        if (resolved) {
          if (isEmptyFile(resolved.id)) {
            resolved.id = resolved.id + emptyRouteModule;
          }

          // Using syntheticNamedExports here prevents Rollup from complaining
          // when the route source module may not have some of the properties
          // we explicitly list in the proxy module.
          resolved.syntheticNamedExports = true;

          return resolved;
        }
      }

      return null;
    },

    load(id) {
      if (id.endsWith(emptyRouteModule)) {
        let source = id.slice(0, -emptyRouteModule.length);

        this.addWatchFile(source);

        // In a new file, default to an empty component. This prevents errors in
        // dev (watch) mode when creating new routes.
        return `export default function () { throw new Error('Route "${source}" is empty, put a default export in there!') }`;
      }

      if (id.endsWith(routeModuleProxy)) {
        let source = id.slice(0, -routeModuleProxy.length);

        if (target === BuildTarget.Browser) {
          // Create a proxy module that re-exports only the things we want to be
          // available in the browser. All the rest will be tree-shaken out so
          // we don't end up with server-only code (and its dependencies) in the
          // browser bundles.
          return `export { ErrorBoundary, default, handle, links, meta } from ${JSON.stringify(
            source
          )};`;
        }

        // Create a proxy module that transparently re-exports everything from
        // the original module.
        return (
          `export { default } from ${JSON.stringify(source)};\n` +
          `export * from ${JSON.stringify(source)};`
        );
      }

      return null;
    }
  };
}

function isEmptyFile(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).size === 0;
}
