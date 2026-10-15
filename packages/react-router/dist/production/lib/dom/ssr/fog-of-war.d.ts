
import { PatchRoutesOnNavigationFunction } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { RouterFetch } from "./single-fetch.js";
import { RouteModules } from "./routeModules.js";
import { AssetsManifest } from "./entry.js";
import { ServerBuild } from "../../server-runtime/build.js";

//#region lib/dom/ssr/fog-of-war.d.ts
declare function getPatchRoutesOnNavigationFunction(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean, basename: string | undefined, fetchImplementation?: RouterFetch, serverOrigin?: string, isApiOnly?: boolean): PatchRoutesOnNavigationFunction | undefined;
declare function useFogOFWarDiscovery(router: Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean, fetchImplementation?: RouterFetch, serverOrigin?: string, isApiOnly?: boolean): void;
//#endregion
export { getPatchRoutesOnNavigationFunction, useFogOFWarDiscovery };