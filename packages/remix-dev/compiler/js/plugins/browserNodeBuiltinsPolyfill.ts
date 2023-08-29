import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

import type { Context } from "../../context";

export const browserNodeBuiltinsPolyfillPlugin = (ctx: Context) =>
  nodeModulesPolyfillPlugin({
    // Rename plugin to improve error message attribution
    name: "browser-node-builtins-polyfill-plugin",
    // Only pass through the "modules" and "globals" options to ensure we
    // don't leak the full plugin API to Remix consumers.
    modules: ctx.config.browserNodeBuiltinsPolyfill?.modules ?? {},
    globals: ctx.config.browserNodeBuiltinsPolyfill?.globals ?? {},
    // Mark any unpolyfilled Node builtins in the build output as errors.
    fallback: "error",
    formatError({ moduleName, importer, polyfillExists }) {
      let normalizedModuleName = moduleName.replace("node:", "");
      let modulesConfigKey = /^[a-z_]+$/.test(normalizedModuleName)
        ? normalizedModuleName
        : JSON.stringify(normalizedModuleName);

      return {
        text: (polyfillExists
          ? [
              `Node builtin "${moduleName}" (imported by "${importer}") must be polyfilled for the browser. `,
              `You can enable this polyfill in your Remix config, `,
              `e.g. \`browserNodeBuiltinsPolyfill: { modules: { ${modulesConfigKey}: true } }\``,
            ]
          : [
              `Node builtin "${moduleName}" (imported by "${importer}") doesn't have a browser polyfill available. `,
              `You can stub it out with an empty object in your Remix config `,
              `e.g. \`browserNodeBuiltinsPolyfill: { modules: { ${modulesConfigKey}: "empty" } }\` `,
              "but note that this may cause runtime errors if the module is used in your browser code.",
            ]
        ).join(""),
      };
    },
  });
