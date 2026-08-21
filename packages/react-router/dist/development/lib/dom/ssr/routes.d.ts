
import { DataRouteObject, RouteManifest } from "../../router/utils.js";
import { HydrationState } from "../../router/router.js";
import { ClientLoaderFunction, RouteModules } from "./routeModules.js";
//#region lib/dom/ssr/routes.d.ts
interface Route {
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path?: string;
}
interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasClientAction: boolean;
  hasClientLoader: boolean;
  hasClientMiddleware: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  css?: string[];
  module: string;
  clientActionModule: string | undefined;
  clientLoaderModule: string | undefined;
  clientMiddlewareModule: string | undefined;
  hydrateFallbackModule: string | undefined;
  parentId?: string;
}
declare function createClientRoutesWithHMRRevalidationOptOut(needsRevalidation: Set<string>, manifest: RouteManifest<EntryRoute>, routeModulesCache: RouteModules, initialState: HydrationState, ssr: boolean, isSpaMode: boolean): DataRouteObject[];
declare function createClientRoutes(manifest: RouteManifest<EntryRoute>, routeModulesCache: RouteModules, initialState: HydrationState | null, ssr: boolean, isSpaMode: boolean, parentId?: string, routesByParentId?: Record<string, Omit<EntryRoute, "children">[]>, needsRevalidation?: Set<string>): DataRouteObject[];
declare function shouldHydrateRouteLoader(routeId: string, clientLoader: ClientLoaderFunction | undefined, hasLoader: boolean, isSpaMode: boolean): boolean;
//#endregion
export { EntryRoute, Route, createClientRoutes, createClientRoutesWithHMRRevalidationOptOut, shouldHydrateRouteLoader };