import type { Plugin } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

export function nodePolyfillsPlugin(): Plugin {
  return nodeModulesPolyfillPlugin({
    globals: {
      Buffer: true,
      process: true,
    },
  });
}
