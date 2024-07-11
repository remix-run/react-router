import * as path from "node:path";
import * as fs from "node:fs";
import { flatRoutes } from "./flatRoutes";

export type RouteConfig =
  | RouteManifest
  | DynamicRouteManifest
  | Array<RouteManifest | DynamicRouteManifest>;

export function defineRoutes(routeConfig: RouteConfig) {
  return routeConfig;
}

/**
 * A route manifest entry
 */
export interface ConfigRoute {
  /**
   * The path this route uses to match on the URL pathname.
   */
  path?: string;

  /**
   * Should be `true` if it is an index route. This disallows child routes.
   */
  index?: boolean;

  /**
   * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
   */
  caseSensitive?: boolean;

  /**
   * The unique id for this route, named like its `file` but without the
   * extension. So `app/routes/gists/$username.tsx` will have an `id` of
   * `routes/gists/$username`.
   */
  id: string;

  /**
   * The unique `id` for this route's parent route, if there is one.
   */
  parentId?: string;

  /**
   * The path to the entry point for this route, relative to
   * `config.appDirectory`.
   */
  file: string;
}

export interface RouteManifest {
  [routeId: string]: ConfigRoute;
}

type DynamicRouteManifest = (args: {
  appDirectory: string;
}) => RouteManifest | Promise<RouteManifest>;

/**
 * A route exported from the routes config file
 */
export interface DataRoute {
  /**
   * The unique id for this route.
   */
  id?: string;

  /**
   * The path this route uses to match on the URL pathname.
   */
  path?: string;

  /**
   * Should be `true` if it is an index route. This disallows child routes.
   */
  index?: boolean;

  /**
   * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
   */
  caseSensitive?: boolean;

  /**
   * The path to the entry point for this route, relative to
   * `config.appDirectory`.
   */
  file: string;

  /**
   * The child routes.
   */
  children?: DataRoute[];
}

export function dataRoutes(dataRoutes: DataRoute[]): RouteManifest {
  return dataRoutesToRouteManifest(dataRoutes);
}

function dataRoutesToRouteManifest(
  routes: DataRoute[],
  rootId = "root"
): RouteManifest {
  let routeManifest: RouteManifest = {};

  function walk(route: DataRoute, parentId: string) {
    let id = route.id || createRouteId(route.file);
    let manifestItem: ConfigRoute = {
      id,
      parentId,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    };

    routeManifest[id] = manifestItem;

    if (route.children) {
      for (let child of route.children) {
        walk(child, id);
      }
    }
  }

  for (let route of routes) {
    walk(route, rootId);
  }

  return routeManifest;
}

export function fsRoutes({
  ignoredRouteFiles,
  rootDirectory = "routes",
}: {
  ignoredRouteFiles?: string[];
  rootDirectory?: string;
} = {}): DynamicRouteManifest {
  return ({ appDirectory }) => {
    if (!fs.existsSync(path.resolve(appDirectory, rootDirectory))) {
      return {};
    }

    return flatRoutes(appDirectory, ignoredRouteFiles, rootDirectory);
  };
}

export function createRouteId(file: string) {
  return normalizeSlashes(stripFileExtension(file));
}

export function normalizeSlashes(file: string) {
  return file.split(path.win32.sep).join("/");
}

function stripFileExtension(file: string) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}
