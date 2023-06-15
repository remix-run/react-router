import path, { isAbsolute, relative } from "path";
import fs from "fs";
import { builtinModules } from "module";
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
      build.onResolve({ filter: /.*/ }, ({ importer, kind, path }) => {
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

        if (
          !isNodeBuiltIn(packageName) &&
          kind !== "dynamic-import" &&
          ctx.config.serverPlatform === "node"
        ) {
          warnOnceIfEsmOnlyPackage(ctx, packageName, path, importer);
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

function warnOnceIfEsmOnlyPackage(
  ctx: Context,
  packageName: string,
  fullImportPath: string,
  importer: string
) {
  try {
    let packageDir = resolveModuleBasePath(
      packageName,
      fullImportPath,
      importer
    );
    let packageJsonFile = path.join(packageDir, "package.json");

    if (!fs.existsSync(packageJsonFile)) {
      ctx.logger.warn(`could not find package.json for ${packageName}`);
      return;
    }
    let pkg = JSON.parse(fs.readFileSync(packageJsonFile, "utf-8"));

    let subImport = fullImportPath.slice(packageName.length + 1);

    if (pkg.type === "module") {
      let isEsmOnly = true;
      if (pkg.exports) {
        if (!subImport) {
          if (pkg.exports.require) {
            isEsmOnly = false;
          } else if (pkg.exports["."]?.require) {
            isEsmOnly = false;
          }
        } else if (pkg.exports[`./${subImport}`]?.require) {
          isEsmOnly = false;
        }
      }

      if (isEsmOnly) {
        ctx.logger.warn(`esm-only package: ${packageName}`, {
          details: [
            `${packageName} is possibly an ESM-only package.`,
            "To bundle it with your server, include it in `serverDependenciesToBundle`",
            "-> https://remix.run/docs/en/main/file-conventions/remix-config#serverdependenciestobundle",
          ],
          key: packageName + ":esm-only",
        });
      }
    }
  } catch (error: unknown) {
    // module not installed
    // we warned earlier if a package is used without being in package.json
    // if the build fails, the reason will be right there
  }
}

// https://github.com/nodejs/node/issues/33460#issuecomment-919184789
// adapted to use the fullImportPath to resolve sub packages like @heroicons/react/solid
function resolveModuleBasePath(
  packageName: string,
  fullImportPath: string,
  importer: string
) {
  let moduleMainFilePath = require.resolve(fullImportPath, {
    paths: [importer],
  });

  let packageNameParts = packageName.split("/");

  let searchForPathSection;

  if (packageName.startsWith("@") && packageNameParts.length > 1) {
    let [org, mod] = packageNameParts;
    searchForPathSection = `node_modules${path.sep}${org}${path.sep}${mod}`;
  } else {
    let [mod] = packageNameParts;
    searchForPathSection = `node_modules${path.sep}${mod}`;
  }

  let lastIndex = moduleMainFilePath.lastIndexOf(searchForPathSection);

  if (lastIndex === -1) {
    throw new Error(
      `Couldn't resolve the base path of "${packageName}". Searched inside the resolved main file path "${moduleMainFilePath}" using "${searchForPathSection}"`
    );
  }

  return moduleMainFilePath.slice(0, lastIndex + searchForPathSection.length);
}
