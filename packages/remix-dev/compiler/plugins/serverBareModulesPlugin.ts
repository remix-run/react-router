import path from "path";
import fs from "fs";
import { builtinModules } from "module";
import { isAbsolute, relative } from "path";
import type { Plugin } from "esbuild";

import type { RemixConfig } from "../../config";
import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule,
} from "../virtualModules";
import { createMatchPath } from "../utils/tsconfig";

/**
 * A plugin responsible for resolving bare module ids based on server target.
 * This includes externalizing for node based plaforms, and bundling for single file
 * environments such as cloudflare.
 */
export function serverBareModulesPlugin(
  remixConfig: RemixConfig,
  onWarning?: (warning: string, key: string) => void
): Plugin {
  let isDenoRuntime = remixConfig.serverBuildTarget === "deno";

  // Resolve paths according to tsconfig paths property
  let matchPath = isDenoRuntime ? undefined : createMatchPath();
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

        let packageName = getNpmPackageName(path);

        // Warn if we can't find an import for a package.
        if (
          onWarning &&
          !isNodeBuiltIn(packageName) &&
          !/\bnode_modules\b/.test(importer)
        ) {
          try {
            require.resolve(path);
          } catch (error) {
            onWarning(
              `The path "${path}" is imported in ` +
                `${relative(process.cwd(), importer)} but ` +
                `"${path}" was not found in your node_modules. ` +
                `Did you forget to install it?`,
              path
            );
          }
        }

        switch (remixConfig.serverBuildTarget) {
          // Always bundle everything for cloudflare.
          case "cloudflare-pages":
          case "cloudflare-workers":
          case "deno":
            return undefined;
        }

        for (let pattern of remixConfig.serverDependenciesToBundle) {
          // bundle it if the path matches the pattern
          if (
            typeof pattern === "string" ? path === pattern : pattern.test(path)
          ) {
            return undefined;
          }
        }

        if (
          onWarning &&
          !isNodeBuiltIn(packageName) &&
          kind !== "dynamic-import" &&
          (!remixConfig.serverBuildTarget ||
            remixConfig.serverBuildTarget === "node-cjs")
        ) {
          warnOnceIfEsmOnlyPackage(packageName, path, onWarning);
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
  packageName: string,
  fullImportPath: string,
  onWarning: (msg: string, key: string) => void
) {
  try {
    let packageDir = resolveModuleBasePath(packageName, fullImportPath);
    let packageJsonFile = path.join(packageDir, "package.json");

    if (!fs.existsSync(packageJsonFile)) {
      console.log(packageJsonFile, `does not exist`);
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
        onWarning(
          `${packageName} is possibly an ESM only package and should be bundled with ` +
            `"serverDependenciesToBundle in remix.config.js.`,
          packageName + ":esm-only"
        );
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
function resolveModuleBasePath(packageName: string, fullImportPath: string) {
  let moduleMainFilePath = require.resolve(fullImportPath);

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
