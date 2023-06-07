import type { Plugin } from "esbuild";
import { readFile } from "fs-extra";

import type { LazyValue } from "../lazyValue";

const pluginName = "css-bundle-update-plugin";
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
      let preventInfiniteLoop = {};
      build.onResolve({ filter: /^@remix-run\/css-bundle$/ }, async (args) => {
        // Prevent plugin from infinitely trying to resolve itself
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

        return {
          path: resolvedPath,
          namespace,
        };
      });

      build.onLoad({ filter: /.*/, namespace }, async (args) => {
        let cssBundleHref = await refs.lazyCssBundleHref.get();

        let contents = await readFile(args.path, "utf8");

        contents = contents.replace(
          /__INJECT_CSS_BUNDLE_HREF__/g,
          cssBundleHref ? JSON.stringify(cssBundleHref) : "undefined"
        );

        return {
          loader: "js",
          contents,
        };
      });
    },
  };
}
