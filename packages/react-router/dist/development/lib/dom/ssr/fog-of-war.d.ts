
import { PatchRoutesOnNavigationFunction } from "../../router/utils.js";
import { Router } from "../../router/router.js";
import { RouteModules } from "./routeModules.js";
import { AssetsManifest } from "./entry.js";
import { ServerBuild } from "../../server-runtime/build.js";

//#region lib/dom/ssr/fog-of-war.d.ts
declare function getPatchRoutesOnNavigationFunction(getRouter: () => Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean, basename: string | undefined): PatchRoutesOnNavigationFunction | undefined;
declare function useFogOFWarDiscovery(router: Router, manifest: AssetsManifest, routeModules: RouteModules, ssr: boolean, routeDiscovery: ServerBuild["routeDiscovery"], isSpaMode: boolean): void;
//#endregion
export { getPatchRoutesOnNavigationFunction, useFogOFWarDiscovery };