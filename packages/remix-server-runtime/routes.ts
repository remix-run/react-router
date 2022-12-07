import type {
  AgnosticDataRouteObject,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/router";

import { callRouteActionRR, callRouteLoaderRR } from "./data";
import type { ServerRouteModule } from "./routeModules";

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

export type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;

// NOTE: make sure to change the Route in remix-react if you change this
export interface Route {
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path?: string;
}

// NOTE: make sure to change the EntryRoute in remix-react if you change this
export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasCatchBoundary: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  module: string;
  parentId?: string;
}

export interface ServerRoute extends Route {
  children: ServerRoute[];
  module: ServerRouteModule;
}

export function createRoutes(
  manifest: ServerRouteManifest,
  parentId?: string
): ServerRoute[] {
  return Object.entries(manifest)
    .filter(([, route]) => route.parentId === parentId)
    .map(([id, route]) => ({
      ...route,
      children: createRoutes(manifest, id),
    }));
}

// Convert the Remix ServerManifest into DataRouteObject's for use with
// createStaticHandler
export function createStaticHandlerDataRoutes(
  manifest: ServerRouteManifest,
  parentId?: string
): AgnosticDataRouteObject[] {
  return Object.values(manifest)
    .filter((route) => route.parentId === parentId)
    .map((route) => {
      let commonRoute = {
        // Always include root due to default boundaries
        hasErrorBoundary:
          route.id === "root" ||
          route.module.CatchBoundary != null ||
          route.module.ErrorBoundary != null,
        id: route.id,
        path: route.path,
        loader: route.module.loader
          ? (args: LoaderFunctionArgs) =>
              callRouteLoaderRR({
                request: args.request,
                params: args.params,
                loadContext: args.context,
                loader: route.module.loader!,
                routeId: route.id,
              })
          : undefined,
        action: route.module.action
          ? (args: ActionFunctionArgs) =>
              callRouteActionRR({
                request: args.request,
                params: args.params,
                loadContext: args.context,
                action: route.module.action!,
                routeId: route.id,
              })
          : undefined,
        handle: route.module.handle,
        // TODO: RRR - Implement!
        shouldRevalidate: () => true,
      };

      return route.index
        ? {
            index: true,
            ...commonRoute,
          }
        : {
            caseSensitive: route.caseSensitive,
            children: createStaticHandlerDataRoutes(manifest, route.id),
            ...commonRoute,
          };
    });
}
