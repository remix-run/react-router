import type { StaticHandler } from "../router/router";
import type { Params } from "../router/utils";
import invariant from "./invariant";
import type { ServerRoute, ServerRouteManifest } from "./routes";

export interface RouteMatch<Route> {
  params: Params;
  pathname: string;
  route: Route;
}

export function matchServerRoutes(
  manifest: ServerRouteManifest,
  staticHandler: StaticHandler,
  pathname: string,
): RouteMatch<Omit<ServerRoute, "children">>[] | null {
  let matches = staticHandler.match(pathname);
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
