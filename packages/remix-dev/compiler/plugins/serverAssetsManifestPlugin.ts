import type { Plugin } from "esbuild";
import jsesc from "jsesc";

import invariant from "../../invariant";
import { assetsManifestVirtualModule } from "../virtualModules";

export type AssetsManifestPromiseRef = { current?: Promise<unknown> };

/**
 * Creates a virtual module called `@remix-run/dev/assets-manifest` that exports
 * the assets manifest. This is used in the server entry module to access the
 * assets manifest in the server build.
 */
export function serverAssetsManifestPlugin(
  assetsManifestPromiseRef: AssetsManifestPromiseRef
): Plugin {
  let filter = assetsManifestVirtualModule.filter;

  return {
    name: "server-assets-manifest",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "server-assets-manifest"
        };
      });

      build.onLoad({ filter }, async () => {
        invariant(
          assetsManifestPromiseRef.current,
          "Missing assets manifests in server build."
        );

        let manifest = await assetsManifestPromiseRef.current;

        return {
          contents: `export default ${jsesc(manifest, { es6: true })};`,
          loader: "js"
        };
      });
    }
  };
}
