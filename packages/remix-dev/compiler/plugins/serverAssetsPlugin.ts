import type { Plugin } from "esbuild";
import jsesc from "jsesc";

import invariant from "../../invariant";
import { assetsManifestVirtualModule } from "../virtualModules";

export type AssetsManifestPromiseRef = { current?: Promise<unknown> };

/**
 * Creates a virtual module of the asset manifest for consumption.
 * See {@link serverEntryModulesPlugin} for consumption.
 */
export function serverAssetsPlugin(
  browserManifestPromiseRef: AssetsManifestPromiseRef,
  filter: RegExp = assetsManifestVirtualModule.filter
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
