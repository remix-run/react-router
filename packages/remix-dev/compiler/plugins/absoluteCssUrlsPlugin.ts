import path from "node:path";
import type { Plugin, PluginBuild } from "esbuild";

/**
 * This plugin treats absolute paths in 'url()' css rules as external to prevent
 * breaking changes
 */
export const absoluteCssUrlsPlugin = (): Plugin => {
  return {
    name: "absolute-css-urls-plugin",
    setup: async (build: PluginBuild) => {
      build.onResolve({ filter: /.*/ }, async (args) => {
        let { kind, path: resolvePath } = args;
        if (kind === "url-token" && path.isAbsolute(resolvePath)) {
          return {
            path: resolvePath,
            external: true,
          };
        }
      });
    },
  };
};
