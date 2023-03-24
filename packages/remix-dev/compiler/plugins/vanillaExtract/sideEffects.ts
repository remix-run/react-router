import type { Plugin } from "esbuild";
import { cssFileFilter } from "@vanilla-extract/integration";

/**
 * This plugin marks all .css.ts/js files as having side effects. This is
 * to ensure that all usages of `globalStyle` are included in the CSS bundle,
 * even if a .css.ts/js file has no exports or is otherwise tree-shaken.
 */
export const vanillaExtractSideEffectsPlugin: Plugin = {
  name: "vanilla-extract-side-effects-plugin",
  setup(build) {
    let preventInfiniteLoop = {};

    build.onResolve(
      { filter: /\.css(\.(j|t)sx?)?(\?.*)?$/, namespace: "file" },
      async (args) => {
        if (args.pluginData === preventInfiniteLoop) {
          return null;
        }

        let resolvedPath = (
          await build.resolve(args.path, {
            resolveDir: args.resolveDir,
            kind: args.kind,
            pluginData: preventInfiniteLoop,
          })
        ).path;

        if (!cssFileFilter.test(resolvedPath)) {
          return null;
        }

        return {
          path: resolvedPath,
          sideEffects: true,
        };
      }
    );
  },
};
