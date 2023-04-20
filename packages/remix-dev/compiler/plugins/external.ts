import type { Plugin } from "esbuild";

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
