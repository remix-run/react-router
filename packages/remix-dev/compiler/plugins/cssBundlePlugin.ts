import type { Plugin } from "esbuild";

import type { LazyValue } from "../lazyValue";

const pluginName = "css-bundle-plugin";
const namespace = `${pluginName}-ns`;

/**
 * This plugin lazily requests the CSS bundle href and then injects it into the
 * JS for `@remix-run/css-bundle`. This ensures we only run the CSS bundle build
 * if necessary and that changes to the CSS bundle result in an HMR update.
 */
export function cssBundlePlugin(refs: {
  lazyCssBundleHref: LazyValue<string | undefined>;
}): Plugin {
  return {
    name: pluginName,
    async setup(build) {
      build.onResolve({ filter: /^@remix-run\/css-bundle$/ }, async (args) => {
        return {
          path: args.path,
          namespace,
        };
      });

      build.onLoad({ filter: /.*/, namespace }, async () => {
        let cssBundleHref = await refs.lazyCssBundleHref.get();

        return {
          loader: "js",
          contents: `export const cssBundleHref = ${
            cssBundleHref ? JSON.stringify(cssBundleHref) : "undefined"
          };`,
        };
      });
    },
  };
}
