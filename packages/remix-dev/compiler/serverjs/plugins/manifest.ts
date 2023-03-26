import type { Plugin } from "esbuild";
import jsesc from "jsesc";

import { type Manifest } from "../../../manifest";
import { assetsManifestVirtualModule } from "../virtualModules";

/**
 * Creates a virtual module called `@remix-run/dev/assets-manifest` that exports
 * the assets manifest. This is used in the server entry module to access the
 * assets manifest in the server build.
 */
export function serverAssetsManifestPlugin(manifest: Manifest): Plugin {
  let filter = assetsManifestVirtualModule.filter;

  return {
    name: "server-assets-manifest",
    setup(build) {
      build.onResolve({ filter }, ({ path }) => {
        return {
          path,
          namespace: "server-assets-manifest",
        };
      });

      build.onLoad({ filter }, async () => {
        return {
          contents: `export default ${jsesc(manifest, { es6: true })};`,
          loader: "js",
        };
      });
    },
  };
}
