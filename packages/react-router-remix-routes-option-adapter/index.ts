import { type RouteConfigEntry } from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "./manifest";
import {
  defineRoutes,
  type DefineRoutesFunction,
  type DefineRouteFunction,
} from "./defineRoutes";

export type { DefineRoutesFunction, DefineRouteFunction };

/**
 * Adapts routes defined using [Remix's `routes` config
 * option](https://v2.remix.run/docs/file-conventions/vite-config#routes) to
 * React Router's config format, for use within `routes.ts`.
 */
export async function remixRoutesOptionAdapter(
  routes: (
    defineRoutes: DefineRoutesFunction,
  ) =>
    | ReturnType<DefineRoutesFunction>
    | Promise<ReturnType<DefineRoutesFunction>>,
): Promise<RouteConfigEntry[]> {
  let routeManifest = await routes(defineRoutes);
  return routeManifestToRouteConfig(routeManifest);
}
