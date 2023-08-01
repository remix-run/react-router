import { isAbsolute, relative } from "node:path";
import { builtinModules } from "node:module";
import type { Plugin } from "esbuild";

import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule,
} from "../virtualModules";
import { isCssSideEffectImportPath } from "../../plugins/cssSideEffectImports";
import { createMatchPath } from "../../utils/tsconfig";
import { detectPackageManager } from "../../../cli/detectPackageManager";
import type { Context } from "../../context";

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

        // Always bundle CSS files so we get immutable fingerprinted asset URLs.
        if (path.endsWith(".css")) {
          return undefined;
        }

        // Always bundle CSS side-effect imports.
        if (isCssSideEffectImportPath(path)) {
          return undefined;
        }

        let packageName = getNpmPackageName(path);
        let pkgManager = detectPackageManager() ?? "npm";

        // Warn if we can't find an import for a package.
        if (
          !isNodeBuiltIn(packageName) &&
          !/\bnode_modules\b/.test(importer) &&
          // Silence spurious warnings when using Yarn PnP. Yarn PnP doesn’t use
          // a `node_modules` folder to keep its dependencies, so the above check
          // will always fail.
          (pkgManager === "npm" ||
            (pkgManager === "yarn" && process.versions.pnp == null))
        ) {
          try {
            require.resolve(path, { paths: [importer] });
          } catch (error: unknown) {
            ctx.logger.warn(`could not resolve "${path}"`, {
              details: [
                `You imported "${path}" in ${relative(
                  process.cwd(),
                  importer
                )},`,
                "but that package is not in your `node_modules`.",
                "Did you forget to install it?",
              ],
              key: path,
            });
          }
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

function isNodeBuiltIn(packageName: string) {
  return builtinModules.includes(packageName);
}

function getNpmPackageName(id: string): string {
  let split = id.split("/");
  let packageName = split[0];
  if (packageName.startsWith("@")) packageName += `/${split[1]}`;
  return packageName;
}

function isBareModuleId(id: string): boolean {
  return !id.startsWith("node:") && !id.startsWith(".") && !isAbsolute(id);
}
