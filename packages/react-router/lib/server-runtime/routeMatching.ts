import type { DataRouteObject, Params, RouteObject } from "../router/utils";
import type { RouteBranch } from "../router/utils";
import { matchRoutesImpl } from "../router/utils";
import invariant from "./invariant";
import type { ServerRoute, ServerRouteManifest } from "./routes";

export interface RouteMatch<Route> {
  params: Params;
  pathname: string;
  route: Route;
}

export function matchServerRoutes(
  manifest: ServerRouteManifest,
  dataRoutes: DataRouteObject[],
  branches: RouteBranch<DataRouteObject>[],
  pathname: string,
  basename?: string,
): RouteMatch<Omit<ServerRoute, "children">>[] | null {
  let matches = matchRoutesImpl(
    dataRoutes,
    pathname,
    basename ?? "/",
    false,
    branches,
  );
  if (!matches) return null;

  return matches.map((match) => {
    let route = manifest[match.route.id];
    invariant(
      route,
      `Route with id "${match.route.id}" not found in manifest.`,
    );
    return {
      params: match.params,
      pathname: match.pathname,
      route,
    };
  });
}
