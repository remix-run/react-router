import { type RouteConfigEntry } from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "./manifest";
import { defineRoutes, type DefineRoutesFunction } from "./defineRoutes";

export type { DefineRoutesFunction };

export async function remixConfigRoutes(
  customRoutes: (
    defineRoutes: DefineRoutesFunction
  ) =>
    | ReturnType<DefineRoutesFunction>
    | Promise<ReturnType<DefineRoutesFunction>>
): Promise<RouteConfigEntry[]> {
  let routeManifest = await customRoutes(defineRoutes);
  return routeManifestToRouteConfig(routeManifest);
}
