import type * as Vite from "vite";

export default function validatePluginOrder(): Vite.Plugin {
  return {
    name: "react-router:validate-plugin-order",
    configResolved(viteConfig) {
      let pluginIndex = (pluginName: string | string[]) => {
        pluginName = Array.isArray(pluginName) ? pluginName : [pluginName];
        return viteConfig.plugins.findIndex((plugin) =>
          pluginName.includes(plugin.name),
        );
      };

      let rollupPrePlugins = [
        { pluginName: "@mdx-js/rollup", displayName: "@mdx-js/rollup" },
      ];
      for (let prePlugin of rollupPrePlugins) {
        let prePluginIndex = pluginIndex(prePlugin.pluginName);
        console.log(
          prePluginIndex,
          pluginIndex(["react-router", "react-router/rsc"]),
        );
        if (
          prePluginIndex >= 0 &&
          prePluginIndex > pluginIndex(["react-router", "react-router/rsc"])
        ) {
          throw new Error(
            `The "${prePlugin.displayName}" plugin should be placed before the React Router plugin in your Vite config file`,
          );
        }
      }
    },
  };
}
