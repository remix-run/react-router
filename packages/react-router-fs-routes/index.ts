import fs from "node:fs";
import path from "node:path";
import {
  type RouteConfigEntry,
  getAppDirectory,
} from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "./manifest";
import { flatRoutes as flatRoutesImpl } from "./flatRoutes";
import { normalizeSlashes } from "./normalizeSlashes";

/**
 * Creates route config from the file system using a convention that matches
 * [Remix v2's route file
 * naming](https://remix.run/docs/en/v2/file-conventions/routes-files), for use
 * within `routes.ts`.
 */
export async function flatRoutes(
  options: {
    /**
     * An array of [minimatch](https://www.npmjs.com/package/minimatch) globs that match files to ignore.
     * Defaults to `[]`.
     */
    ignoredRouteFiles?: string[] | undefined;

    /**
     * The directory containing file system routes, relative to the app directory.
     * Defaults to `"./routes"`.
     */
    rootDirectory?: string | undefined;
  } = {}
): Promise<RouteConfigEntry[]> {
  let { ignoredRouteFiles = [], rootDirectory: userRootDirectory = "routes" } =
    options;
  const appDirectory = getAppDirectory();
  const rootDirectory = path.resolve(appDirectory, userRootDirectory);
  const relativeRootDirectory = path.relative(appDirectory, rootDirectory);
  const prefix = normalizeSlashes(relativeRootDirectory);

  const routes = fs.existsSync(rootDirectory)
    ? flatRoutesImpl(appDirectory, ignoredRouteFiles, prefix)
    : {};

  return routeManifestToRouteConfig(routes);
}
