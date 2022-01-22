import type { Plugin } from "esbuild";
import jsesc from "jsesc";

import invariant from "../../invariant";
import virtualModules from "../virtualModules";
import type { serverEntryModulesPlugin } from "./serverEntryModulesPlugin";

export type BrowserManifestPromiseRef = { current?: Promise<unknown> };

/**
 * Creates a virtual module of the asset manifest for consumption.
 * See {@link serverEntryModulesPlugin} for consumption.
 */
export function serverAssetsPlugin(
  browserManifestPromiseRef: BrowserManifestPromiseRef,
  filter: RegExp = virtualModules.assetsManifestVirtualModule.filter
): Plugin {
  return {
    name: "server-assets",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "assets"
        };
      });
      build.onLoad({ filter }, async () => {
        invariant(
          browserManifestPromiseRef.current,
          "Missing browser manifest assets ref in server build."
        );
        let manifest = await browserManifestPromiseRef.current;

        return {
          contents: `export default ${jsesc(manifest, { es6: true })};`,
          loader: "js"
        };
      });
    }
  };
}
