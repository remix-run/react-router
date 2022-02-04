import * as path from "path";
import type { Plugin } from "esbuild";

import type { RemixConfig } from "../../config";
import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule
} from "../virtualModules";

/**
 * Creates a virtual module called `@remix-run/dev/server-build` that exports the
 * compiled server build for consumption in remix request handlers. This allows
 * for you to consume the build in a custom server entry that is also fed through
 * the compiler.
 */
export function serverEntryModulesPlugin(
  remixConfig: RemixConfig,
  filter: RegExp = serverBuildVirtualModule.filter
): Plugin {
  return {
    name: "server-entry",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "server-entry"
        };
      });

      build.onLoad({ filter }, async () => {
        return {
          resolveDir: remixConfig.appDirectory,
          loader: "js",
          contents: `
import * as entryServer from ${JSON.stringify(
            path.resolve(remixConfig.appDirectory, remixConfig.entryServerFile)
          )};
${Object.keys(remixConfig.routes)
  .map((key, index) => {
    let route = remixConfig.routes[key];
    return `import * as route${index} from ${JSON.stringify(
      path.resolve(remixConfig.appDirectory, route.file)
    )};`;
  })
  .join("\n")}
  export { default as assets } from ${JSON.stringify(
    assetsManifestVirtualModule.id
  )};
  export const entry = { module: entryServer };
  export const routes = {
    ${Object.keys(remixConfig.routes)
      .map((key, index) => {
        let route = remixConfig.routes[key];
        return `${JSON.stringify(key)}: {
      id: ${JSON.stringify(route.id)},
      parentId: ${JSON.stringify(route.parentId)},
      path: ${JSON.stringify(route.path)},
      index: ${JSON.stringify(route.index)},
      caseSensitive: ${JSON.stringify(route.caseSensitive)},
      module: route${index}
    }`;
      })
      .join(",\n  ")}
  };`
        };
      });
    }
  };
}
