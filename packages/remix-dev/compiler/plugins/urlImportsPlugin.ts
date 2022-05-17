import type { Plugin } from "esbuild";

/**
 * Mark all URL imports as external so that each URL import is preserved in the build output.
 */
export const urlImportsPlugin = (): Plugin => {
  return {
    name: "url-imports",
    setup(build) {
      build.onResolve({ filter: /^https?:\/\// }, ({ path }) => {
        /*
        The vast majority of packages are side-effect free,
        and URL imports don't have a mechanism for specifying that they are side-effect free.
        
        Mark all url imports as side-effect free so that they can be treeshaken by esbuild.
        */
        return { path, external: true, sideEffects: false };
      });
    },
  };
};
