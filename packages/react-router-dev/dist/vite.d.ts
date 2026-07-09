
import * as Vite from "vite";

//#region vite/plugin.d.ts
type ReactRouterVitePlugin = () => Vite.Plugin[];
/**
 * React Router [Vite plugin.](https://vitejs.dev/guide/using-plugins.html)
 */
declare const reactRouterVitePlugin: ReactRouterVitePlugin;
//#endregion
//#region vite/rsc/plugin.d.ts
declare function reactRouterRSCVitePlugin(): Vite.PluginOption[];
//#endregion
export { reactRouterVitePlugin as reactRouter, reactRouterRSCVitePlugin as unstable_reactRouterRSC };