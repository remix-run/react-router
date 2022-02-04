import { builtinModules } from "module";
import { isAbsolute, relative } from "path";
import type { Plugin } from "esbuild";

import type { RemixConfig } from "../../config";
import {
  serverBuildVirtualModule,
  assetsManifestVirtualModule
} from "../virtualModules";

/**
 * A plugin responsible for resolving bare module ids based on server target.
 * This includes externalizing for node based plaforms, and bundling for single file
 * environments such as cloudflare.
 */
export function serverBareModulesPlugin(
  remixConfig: RemixConfig,
  dependencies: Record<string, string>,
  onWarning?: (warning: string, key: string) => void
): Plugin {
  return {
    name: "server-bare-modules",
    setup(build) {
      build.onResolve({ filter: /.*/ }, ({ importer, path }) => {
        // If it's not a bare module ID, bundle it.
        if (!isBareModuleId(path)) {
          return undefined;
        }

        // To prevent `import xxx from "remix"` from ending up in the bundle
        // we "bundle" remix but the other modules where the code lives.
        if (path === "remix") {
          return undefined;
        }

        // These are our virutal modules, always bundle the because there is no
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
          !/\bnode_modules\b/.test(importer) &&
          !builtinModules.includes(packageName) &&
          !dependencies[packageName]
        ) {
          onWarning(
            `The path "${path}" is imported in ` +
              `${relative(process.cwd(), importer)} but ` +
              `${packageName} is not listed in your package.json dependencies. ` +
              `Did you forget to install it?`,
            packageName
          );
        }

        switch (remixConfig.serverBuildTarget) {
          // Always bundle everything for cloudflare.
          case "cloudflare-pages":
          case "cloudflare-workers":
            return undefined;
          // Map node externals to deno std libs and bundle everything else.
          case "deno":
            if (isNodeBuiltIn(packageName)) {
              return {
                path: `https://deno.land/std/node/${packageName}/mod.ts`,
                external: true
              };
            }
            return undefined;
        }

        // Externalize everything else if we've gotten here.
        return {
          path,
          external: true
        };
      });
    }
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
  return !id.startsWith(".") && !id.startsWith("~") && !isAbsolute(id);
}
