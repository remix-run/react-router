import fs from "node:fs";
import path from "node:path";
import { type ConfigRoute, getAppDirectory } from "@react-router/dev/routes";

import { type RouteManifest, routeManifestToConfigRoutes } from "./manifest";
import { fileRoutes } from "./fileRoutes";
import { defineRoutes, type DefineRoutesFunction } from "./defineRoutes";

export async function remixRoutes({
  ignoredRouteFiles,
  rootDirectory = "routes",
  routes: customRoutes,
}: {
  ignoredRouteFiles?: string[];
  rootDirectory?: string;

  /**
   * A function for defining custom routes, in addition to those already defined
   * using the filesystem convention in `app/routes`. Both sets of routes will
   * be merged.
   */
  routes?: (
    defineRoutes: DefineRoutesFunction
  ) =>
    | ReturnType<DefineRoutesFunction>
    | Promise<ReturnType<DefineRoutesFunction>>;
} = {}): Promise<ConfigRoute[]> {
  let appDirectory = getAppDirectory();
  let routes: RouteManifest = {};

  if (fs.existsSync(path.resolve(appDirectory, rootDirectory))) {
    routes = {
      ...routes,
      ...fileRoutes(appDirectory, ignoredRouteFiles, rootDirectory),
    };
  }

  if (customRoutes) {
    routes = {
      ...routes,
      ...(await customRoutes(defineRoutes)),
    };
  }

  return routeManifestToConfigRoutes(routes);
}
