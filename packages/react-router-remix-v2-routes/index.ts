import fs from "node:fs";
import path from "node:path";
import {
  type RouteConfigEntry,
  getAppDirectory,
} from "@react-router/dev/routes";

import { type RouteManifest, routeManifestToRouteConfig } from "./manifest";
import { fileRoutes } from "./fileRoutes";
import { defineRoutes, type DefineRoutesFunction } from "./defineRoutes";
import { normalizeSlashes } from "./normalizeSlashes";

export type { RouteManifest, DefineRoutesFunction };

export async function remixRoutes({
  ignoredRouteFiles,
  rootDirectory: userRootDirectory = "./routes",
  routes: customRoutes,
}: {
  ignoredRouteFiles?: string[];

  /**
   * The directory containing file system routes, relative to the app directory.
   * Defaults to `./routes`.
   */
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
} = {}): Promise<RouteConfigEntry[]> {
  let appDirectory = getAppDirectory();
  let rootDirectory = path.resolve(appDirectory, userRootDirectory);
  let relativeRootDirectory = path.relative(appDirectory, rootDirectory);
  let prefix = normalizeSlashes(relativeRootDirectory);
  let routes: RouteManifest = {};

  if (fs.existsSync(rootDirectory)) {
    routes = {
      ...routes,
      ...fileRoutes(appDirectory, ignoredRouteFiles, prefix),
    };
  }

  if (customRoutes) {
    routes = {
      ...routes,
      ...(await customRoutes(defineRoutes)),
    };
  }

  return routeManifestToRouteConfig(routes);
}
