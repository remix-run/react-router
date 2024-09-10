import fs from "node:fs";
import path from "node:path";
import {
  type RouteConfigEntry,
  getAppDirectory,
} from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "./manifest";
import { flatRoutes as flatRoutesImpl } from "./flatRoutes";
import { normalizeSlashes } from "./normalizeSlashes";

export async function flatRoutes({
  ignoredRouteFiles,
  rootDirectory: userRootDirectory = "./routes",
}: {
  ignoredRouteFiles?: string[];

  /**
   * The directory containing file system routes, relative to the app directory.
   * Defaults to `./routes`.
   */
  rootDirectory?: string;
} = {}): Promise<RouteConfigEntry[]> {
  let appDirectory = getAppDirectory();
  let rootDirectory = path.resolve(appDirectory, userRootDirectory);
  let relativeRootDirectory = path.relative(appDirectory, rootDirectory);
  let prefix = normalizeSlashes(relativeRootDirectory);

  let routes = fs.existsSync(rootDirectory)
    ? flatRoutesImpl(appDirectory, ignoredRouteFiles, prefix)
    : {};

  return routeManifestToRouteConfig(routes);
}
