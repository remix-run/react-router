import { type RouteConfigEntry } from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "./manifest";
import { defineRoutes, type DefineRoutesFunction } from "./defineRoutes";

export type { DefineRoutesFunction };

/**
 * Adapts routes defined using [Remix's `routes` config
 * option](https://remix.run/docs/en/v2/file-conventions/vite-config#routes) to
 * React Router's config format, for use within `routes.ts`.
 */
export async function remixRoutesOptionAdapter(
  routes: (
    defineRoutes: DefineRoutesFunction
  ) =>
    | ReturnType<DefineRoutesFunction>
    | Promise<ReturnType<DefineRoutesFunction>>
): Promise<RouteConfigEntry[]> {
  let routeManifest = await routes(defineRoutes);
  return routeManifestToRouteConfig(routeManifest);
}
