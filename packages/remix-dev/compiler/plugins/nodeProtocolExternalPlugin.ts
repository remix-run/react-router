import type esbuild from "esbuild";

/**
 * Node supports importing modules using the node: protocol. However, this causes resolution
 * to fail in the compiler. This plugin properly marks all `node:` imports as external.
 */
export function NodeProtocolExternalPlugin(): esbuild.Plugin {
  return {
    name: "node-protocol-external",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /node:.*/ }, () => {
        return { external: true, sideEffects: false };
      });
    },
  };
}
