import * as path from "node:path";
import * as fs from "node:fs";
import pick from "lodash/pick";
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

type CreateRoutePath = string | null | undefined;

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

const createRouteOptionKeys = [
  "id",
  "index",
  "caseSensitive",
] as const satisfies Array<keyof DataRoute>;
type CreateRouteOptions = Pick<
  DataRoute,
  (typeof createRouteOptionKeys)[number]
>;
function createRoute(
  path: CreateRoutePath,
  file: string,
  children?: DataRoute[]
): DataRoute;
function createRoute(
  path: CreateRoutePath,
  file: string,
  options: RequireAtLeastOne<CreateRouteOptions>,
  children?: DataRoute[]
): DataRoute;
function createRoute(
  path: CreateRoutePath,
  file: string,
  optionsOrChildren: CreateRouteOptions | DataRoute[] | undefined,
  children?: DataRoute[]
): DataRoute {
  let options: CreateRouteOptions = {};

  if (Array.isArray(optionsOrChildren) || !optionsOrChildren) {
    children = optionsOrChildren;
  } else {
    options = optionsOrChildren;
  }

  return {
    file,
    children,
    path: path ?? undefined,
    ...pick(options, createRouteOptionKeys),
  };
}

const createIndexOptionKeys = ["id"] as const satisfies Array<keyof DataRoute>;
type CreateIndexOptions = Pick<
  DataRoute,
  (typeof createIndexOptionKeys)[number]
>;
function createIndex(
  file: string,
  options?: RequireAtLeastOne<CreateIndexOptions>
): DataRoute {
  return {
    file,
    index: true,
    ...pick(options, createIndexOptionKeys),
  };
}

const createLayoutOptionKeys = ["id"] as const satisfies Array<keyof DataRoute>;
type CreateLayoutOptions = Pick<
  DataRoute,
  (typeof createLayoutOptionKeys)[number]
>;
function createLayout(file: string, children?: DataRoute[]): DataRoute;
function createLayout(
  file: string,
  options: RequireAtLeastOne<CreateLayoutOptions>,
  children?: DataRoute[]
): DataRoute;
function createLayout(
  file: string,
  optionsOrChildren: CreateLayoutOptions | DataRoute[] | undefined,
  children?: DataRoute[]
): DataRoute {
  let options: CreateLayoutOptions = {};

  if (Array.isArray(optionsOrChildren) || !optionsOrChildren) {
    children = optionsOrChildren;
  } else {
    options = optionsOrChildren;
  }

  return {
    file,
    children,
    ...pick(options, createLayoutOptionKeys),
  };
}

export const dataRouteHelpers = {
  route: createRoute,
  index: createIndex,
  layout: createLayout,
};

type DataRoutesFunction = (r: typeof dataRouteHelpers) => DataRoute[];

export function dataRoutes(
  dataRoutes: DataRoute[] | DataRoutesFunction
): RouteManifest {
  return dataRoutesToRouteManifest(
    typeof dataRoutes === "function" ? dataRoutes(dataRouteHelpers) : dataRoutes
  );
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

    if (routeManifest.hasOwnProperty(id)) {
      throw new Error(
        `Unable to define routes with duplicate route id: "${id}"`
      );
    }
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
