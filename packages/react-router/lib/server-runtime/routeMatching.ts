import type { Params, AgnosticRouteObject } from "../router/utils";
import { matchRoutes } from "../router/utils";
import type { ServerRoute } from "./routes";

export interface RouteMatch<Route> {
  params: Params;
  pathname: string;
  route: Route;
}

export function matchServerRoutes(
  routes: ServerRoute[],
  pathname: string,
  basename?: string
): RouteMatch<ServerRoute>[] | null {
  let matches = matchRoutes(
    routes as unknown as AgnosticRouteObject[],
    pathname,
    basename
  );
  if (!matches) return null;

  return matches.map((match) => ({
    params: match.params,
    pathname: match.pathname,
    route: match.route as unknown as ServerRoute,
  }));
}
