import type { RouteModules } from "../dom/ssr/routeModules";
import { setRouteDataValue } from "../router/utils";
import type { ServerRouteManifest } from "./routes";

export function createEntryRouteModules(
  manifest: ServerRouteManifest,
): RouteModules {
  return Object.keys(manifest).reduce((memo, routeId) => {
    let route = manifest[routeId];
    if (route) {
      setRouteDataValue(memo, routeId, route.module);
    }
    return memo;
  }, {} as RouteModules);
}
