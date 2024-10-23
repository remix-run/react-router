import type { ServerRouteManifest } from "./routes";
import type { RouteModules, EntryRouteModule } from "./routeModules";

export function createEntryRouteModules(
  manifest: ServerRouteManifest
): RouteModules<EntryRouteModule> {
  return Object.keys(manifest).reduce((memo, routeId) => {
    let route = manifest[routeId];
    if (route) {
      memo[routeId] = route.module;
    }
    return memo;
  }, {} as RouteModules<EntryRouteModule>);
}
