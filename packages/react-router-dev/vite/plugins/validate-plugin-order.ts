import type * as Vite from "vite";

export function validatePluginOrder(
  isExternalReactEnabled: () => boolean = () => false,
): Vite.Plugin {
  return {
    name: "react-router:validate-plugin-order",
    configResolved(viteConfig) {
      let pluginIndex = (pluginName: string | string[]) => {
        pluginName = Array.isArray(pluginName) ? pluginName : [pluginName];
        return viteConfig.plugins.findIndex((plugin) =>
          pluginName.includes(plugin.name),
        );
      };

      let routeExportsIndex = isExternalReactEnabled()
        ? pluginIndex("react-router:route-exports:external")
        : -1;
      let reactPluginIndices = viteConfig.plugins.flatMap((plugin, index) =>
        ["vite:react-babel", "vite:react-compiler"].includes(plugin.name)
          ? [index]
          : [],
      );
      if (
        routeExportsIndex >= 0 &&
        reactPluginIndices.some((index) => index < routeExportsIndex)
      ) {
        throw new Error(
          'The "@vitejs/plugin-react" plugin should be placed after the React Router plugin in your Vite config',
        );
      }
      if (
        routeExportsIndex >= 0 &&
        viteConfig.plugins.filter(
          (plugin) => plugin.name === "vite:react-babel",
        ).length > 1
      ) {
        throw new Error(
          'Only one "@vitejs/plugin-react" plugin can be used with React Router',
        );
      }
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
      if (routeExportsIndex >= 0 && mdxPluginIndex >= 0) {
        let mdxTransform = viteConfig.plugins[mdxPluginIndex].transform;
        let mdxTransformOrder =
          typeof mdxTransform === "object" ? mdxTransform.order : undefined;
        let runsBeforeRouteTransforms =
          mdxTransformOrder === "pre" ||
          (mdxTransformOrder !== "post" &&
            mdxPluginIndex < pluginIndex("react-router:route-source"));
        if (!runsBeforeRouteTransforms) {
          throw new Error(
            'The "@mdx-js/rollup" plugin should run before the React Router route transforms. Use { enforce: "pre", ...mdx() } before reactRouter() in your Vite config',
          );
        }
      }
      if (mdxPluginIndex >= 0 && mdxPluginIndex > reactRouterPluginIndex) {
        throw new Error(
          `The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config`,
        );
      }
    },
  };
}
