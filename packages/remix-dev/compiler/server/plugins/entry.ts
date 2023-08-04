import type { Plugin } from "esbuild";

import type { Context } from "../../context";
import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule,
} from "../virtualModules";

/**
 * Creates a virtual module called `@remix-run/dev/server-build` that exports the
 * compiled server build for consumption in remix request handlers. This allows
 * for you to consume the build in a custom server entry that is also fed through
 * the compiler.
 */
export function serverEntryModulePlugin({ config, options }: Context): Plugin {
  let filter = serverBuildVirtualModule.filter;

  return {
    name: "server-entry-module",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "server-entry-module",
        };
      });

      build.onLoad({ filter }, async () => {
        return {
          resolveDir: config.appDirectory,
          loader: "js",
          contents: `
import * as entryServer from ${JSON.stringify(config.entryServerFilePath)};
${Object.keys(config.routes)
  .map((key, index) => {
    // IMPORTANT: Any values exported from this generated module must also be
    // typed in `packages/remix-dev/server-build.ts` to avoid tsc errors.
    let route = config.routes[key];
    return `import * as route${index} from ${JSON.stringify(
      `./${route.file}`
    )};`;
  })
  .join("\n")}
  export const mode = ${JSON.stringify(options.mode)};
  export { default as assets } from ${JSON.stringify(
    assetsManifestVirtualModule.id
  )};
  export const assetsBuildDirectory = ${JSON.stringify(
    config.relativeAssetsBuildDirectory
  )};
  export const future = ${JSON.stringify(config.future)};
  export const publicPath = ${JSON.stringify(config.publicPath)};
  export const entry = { module: entryServer };
  export const routes = {
    ${Object.keys(config.routes)
      .map((key, index) => {
        let route = config.routes[key];
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
  };`,
        };
      });
    },
  };
}
