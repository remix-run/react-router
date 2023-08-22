import { isAbsolute } from "node:path";
import type { Plugin } from "esbuild";

import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule,
} from "../virtualModules";
import { isCssSideEffectImportPath } from "../../plugins/cssSideEffectImports";
import { createMatchPath } from "../../utils/tsconfig";
import type { Context } from "../../context";
import { getLoaderForFile } from "../../utils/loaders";

/**
 * A plugin responsible for resolving bare module ids based on server target.
 * This includes externalizing for node based platforms, and bundling for single file
 * environments such as cloudflare.
 */
export function serverBareModulesPlugin(ctx: Context): Plugin {
  // Resolve paths according to tsconfig paths property
  let matchPath = ctx.config.tsconfigPath
    ? createMatchPath(ctx.config.tsconfigPath)
    : undefined;
  function resolvePath(id: string) {
    if (!matchPath) {
      return id;
    }
    return (
      matchPath(id, undefined, undefined, [".ts", ".tsx", ".js", ".jsx"]) || id
    );
  }

  return {
    name: "server-bare-modules",
    setup(build) {
      build.onResolve({ filter: /.*/ }, ({ importer, path }) => {
        // If it's not a bare module ID, bundle it.
        if (!isBareModuleId(resolvePath(path))) {
          return undefined;
        }

        // Always bundle @remix-run/css-bundle
        if (path === "@remix-run/css-bundle") {
          return undefined;
        }

        // To prevent `import xxx from "remix"` from ending up in the bundle
        // we "bundle" remix but the other modules where the code lives.
        if (path === "remix") {
          return undefined;
        }

        // These are our virtual modules, always bundle them because there is no
        // "real" file on disk to externalize.
        if (
          path === serverBuildVirtualModule.id ||
          path === assetsManifestVirtualModule.id
        ) {
          return undefined;
        }

        // Skip assets that are treated as files (.css, .svg, .png, etc.).
        // Otherwise, esbuild would emit code that would attempt to require()
        // or import these files --- which aren't JavaScript!
        let loader;
        try {
          loader = getLoaderForFile(path);
        } catch (e) {
          if (
            !(
              e instanceof Error &&
              e.message.startsWith("Cannot get loader for file")
            )
          ) {
            throw e;
          }
        }
        if (loader === "file") {
          return undefined;
        }

        // Always bundle CSS side-effect imports.
        if (isCssSideEffectImportPath(path)) {
          return undefined;
        }

        if (ctx.config.serverDependenciesToBundle === "all") {
          return undefined;
        }

        for (let pattern of ctx.config.serverDependenciesToBundle) {
          // bundle it if the path matches the pattern
          if (
            typeof pattern === "string" ? path === pattern : pattern.test(path)
          ) {
            return undefined;
          }
        }

        // Externalize everything else if we've gotten here.
        return {
          path,
          external: true,
        };
      });
    },
  };
}

function isBareModuleId(id: string): boolean {
  return !id.startsWith("node:") && !id.startsWith(".") && !isAbsolute(id);
}
