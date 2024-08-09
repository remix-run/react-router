import fs from "node:fs";
import path from "node:path";
import type { RouteManifest, RouteConfig } from "@react-router/dev/config";

import { fileRoutes } from "./fileRoutes";
import { defineRoutes, type DefineRoutesFunction } from "./defineRoutes";

export function remixRoutes({
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
} = {}): RouteConfig {
  return async ({ appDirectory }) => {
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

    return { routes };
  };
}
