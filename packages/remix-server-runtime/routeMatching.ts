import type { Params, RouteObject } from "react-router"; // TODO: export/import from react-router-dom
import { matchRoutes } from "react-router-dom";

import type { ServerRoute } from "./routes";

export interface RouteMatch<Route> {
  params: Params;
  pathname: string;
  route: Route;
}

export function matchServerRoutes(
  routes: ServerRoute[],
  pathname: string
): RouteMatch<ServerRoute>[] | null {
  let matches = matchRoutes((routes as unknown) as RouteObject[], pathname);
  if (!matches) return null;

  return matches.map(match => ({
    params: match.params,
    pathname: match.pathname,
    route: (match.route as unknown) as ServerRoute
  }));
}
