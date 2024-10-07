import type {
  AgnosticDataRouteObject,
  LoaderFunctionArgs as RRLoaderFunctionArgs,
  ActionFunctionArgs as RRActionFunctionArgs,
} from "../router/utils";
import { callRouteHandler } from "./data";
import type { FutureConfig } from "../dom/ssr/entry";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  ServerRouteModule,
} from "./routeModules";
import type { SingleFetchResults } from "../dom/ssr/single-fetch";
import { decodeViaTurboStream } from "../dom/ssr/single-fetch";
import invariant from "./invariant";

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

export type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;

// NOTE: make sure to change the Route in remix-react/react-router-dev if you change this
export interface Route {
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path?: string;
}

// NOTE: make sure to change the EntryRoute in react-router/react-router-dev if you change this
export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasClientAction: boolean;
  hasClientLoader: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  css?: string[];
  module: string;
  parentId?: string;
}

export interface ServerRoute extends Route {
  children: ServerRoute[];
  module: ServerRouteModule;
}

function groupRoutesByParentId(manifest: ServerRouteManifest) {
  let routes: Record<string, Omit<ServerRoute, "children">[]> = {};

  Object.values(manifest).forEach((route) => {
    let parentId = route.parentId || "";
    if (!routes[parentId]) {
      routes[parentId] = [];
    }
    routes[parentId].push(route);
  });

  return routes;
}

// Create a map of routes by parentId to use recursively instead of
// repeatedly filtering the manifest.
export function createRoutes(
  manifest: ServerRouteManifest,
  parentId: string = "",
  routesByParentId: Record<
    string,
    Omit<ServerRoute, "children">[]
  > = groupRoutesByParentId(manifest)
): ServerRoute[] {
  return (routesByParentId[parentId] || []).map((route) => ({
    ...route,
    children: createRoutes(manifest, route.id, routesByParentId),
  }));
}

// Convert the Remix ServerManifest into DataRouteObject's for use with
// createStaticHandler
export function createStaticHandlerDataRoutes(
  manifest: ServerRouteManifest,
  future: FutureConfig,
  parentId: string = "",
  routesByParentId: Record<
    string,
    Omit<ServerRoute, "children">[]
  > = groupRoutesByParentId(manifest)
): AgnosticDataRouteObject[] {
  return (routesByParentId[parentId] || []).map((route) => {
    let commonRoute = {
      // Always include root due to default boundaries
      hasErrorBoundary:
        route.id === "root" || route.module.ErrorBoundary != null,
      id: route.id,
      path: route.path,
      // Need to use RR's version in the param typed here to permit the optional
      // context even though we know it'll always be provided in remix
      loader: route.module.loader
        ? async (args: RRLoaderFunctionArgs) => {
            if (args.request.headers.has("X-React-Router-Prerender-Data")) {
              let encoded = args.request.headers.get(
                "X-React-Router-Prerender-Data"
              );
              invariant(encoded, "Missing prerendered data for route");
              let uint8array = new TextEncoder().encode(encoded);
              let stream = new ReadableStream({
                start(controller) {
                  controller.enqueue(uint8array);
                  controller.close();
                },
              });
              let decoded = await decodeViaTurboStream(stream, global);
              let data = decoded.value as SingleFetchResults;
              invariant(route.id in data, "Unable to decode prerendered data");
              return data[route.id];
            }
            let val = await callRouteHandler(
              route.module.loader!,
              args as LoaderFunctionArgs
            );
            return val;
          }
        : undefined,
      action: route.module.action
        ? (args: RRActionFunctionArgs) =>
            callRouteHandler(route.module.action!, args as ActionFunctionArgs)
        : undefined,
      handle: route.module.handle,
    };

    return route.index
      ? {
          index: true,
          ...commonRoute,
        }
      : {
          caseSensitive: route.caseSensitive,
          children: createStaticHandlerDataRoutes(
            manifest,
            future,
            route.id,
            routesByParentId
          ),
          ...commonRoute,
        };
  });
}
