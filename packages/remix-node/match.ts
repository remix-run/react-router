import type { RouteObject, Params } from "react-router";
import { matchRoutes as match } from "react-router";

import type { ServerRoute, ServerRouteManifest } from "./routes";

export interface RouteMatch<Route> {
  params: Params;
  pathname: string;
  route: Route;
}

export type ServerRouteMatch = RouteMatch<ServerRoute>;

export function createRoutes(
  routeManifest: ServerRouteManifest,
  parentId?: string
): ServerRoute[] {
  return Object.keys(routeManifest)
    .filter(key => routeManifest[key].parentId === parentId)
    .map(id => ({
      ...routeManifest[id],
      children: createRoutes(routeManifest, id)
    }));
}

export function matchRoutes(
  routes: ServerRoute[],
  pathname: string
): ServerRouteMatch[] | null {
  let matches = match((routes as unknown) as RouteObject[], pathname);

  if (!matches) return null;

  return matches.map(match => ({
    params: match.params,
    pathname: match.pathname,
    route: (match.route as unknown) as ServerRoute
  }));
}
