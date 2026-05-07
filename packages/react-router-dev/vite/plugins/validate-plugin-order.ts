import type * as Vite from "vite";

export function validatePluginOrder(): Vite.Plugin {
  return {
    name: "react-router:validate-plugin-order",
    configResolved(viteConfig) {
      let pluginIndex = (pluginName: string | string[]) => {
        pluginName = Array.isArray(pluginName) ? pluginName : [pluginName];
        return viteConfig.plugins.findIndex((plugin) =>
          pluginName.includes(plugin.name),
        );
      };

      let reactRouterRscPluginIndex = pluginIndex("react-router/rsc");
      let viteRscPluginIndex = pluginIndex("rsc");
      if (
        reactRouterRscPluginIndex >= 0 &&
        viteRscPluginIndex >= 0 &&
        reactRouterRscPluginIndex > viteRscPluginIndex
      ) {
        throw new Error(
          `The "@vitejs/plugin-rsc" plugin should be placed after the React Router RSC plugin in your Vite config`,
        );
      }

      let reactRouterPluginIndex = pluginIndex([
        "react-router",
        "react-router/rsc",
      ]);
      let mdxPluginIndex = pluginIndex("@mdx-js/rollup");
      if (mdxPluginIndex >= 0 && mdxPluginIndex > reactRouterPluginIndex) {
        throw new Error(
          `The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config`,
        );
      }
    },
  };
}
