import type { Plugin } from "esbuild";

/**
 * Mark all URL imports as external so that each URL import is preserved in the build output.
 */
export const externalPlugin = (
  filter: RegExp,
  options: {
    sideEffects?: boolean;
  } = {}
): Plugin => {
  return {
    name: "external",
    setup(build) {
      build.onResolve({ filter }, () => {
        return { external: true, sideEffects: options.sideEffects };
      });
    },
  };
};
