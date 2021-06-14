import type { ServerRouteModule } from "./routeModules";

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

export type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;

interface Route {
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path: string;
}

export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  module: string;
}

export interface ServerRoute extends Route {
  children: ServerRoute[];
  module: ServerRouteModule;
}

export function createRoutes(
  manifest: ServerRouteManifest,
  parentId?: string
): ServerRoute[] {
  return Object.keys(manifest)
    .filter(key => manifest[key].parentId === parentId)
    .map(id => ({
      ...manifest[id],
      children: createRoutes(manifest, id)
    }));
}
