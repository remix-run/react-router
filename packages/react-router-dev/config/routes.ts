import { resolve, win32 } from "node:path";
import pick from "lodash/pick";
import invariant from "../invariant";

let appDirectory: string;

export function setAppDirectory(directory: string) {
  appDirectory = directory;
}

export function getAppDirectory() {
  invariant(appDirectory);
  return appDirectory;
}

export interface RouteManifestEntry {
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
  [routeId: string]: RouteManifestEntry;
}

export type RouteConfig = RouteConfigEntry[] | Promise<RouteConfigEntry[]>;

/**
 * A route exported from the routes config file
 */
export interface RouteConfigEntry {
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
  children?: RouteConfigEntry[];
}

type CreateRoutePath = string | null | undefined;

const createConfigRouteOptionKeys = [
  "id",
  "index",
  "caseSensitive",
] as const satisfies Array<keyof RouteConfigEntry>;
type CreateRouteOptions = Pick<
  RouteConfigEntry,
  (typeof createConfigRouteOptionKeys)[number]
>;
function createRoute(
  path: CreateRoutePath,
  file: string,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createRoute(
  path: CreateRoutePath,
  file: string,
  options: CreateRouteOptions,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createRoute(
  path: CreateRoutePath,
  file: string,
  optionsOrChildren: CreateRouteOptions | RouteConfigEntry[] | undefined,
  children?: RouteConfigEntry[]
): RouteConfigEntry {
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
    ...pick(options, createConfigRouteOptionKeys),
  };
}

const createIndexOptionKeys = ["id"] as const satisfies Array<
  keyof RouteConfigEntry
>;
type CreateIndexOptions = Pick<
  RouteConfigEntry,
  (typeof createIndexOptionKeys)[number]
>;
function createIndex(
  file: string,
  options?: CreateIndexOptions
): RouteConfigEntry {
  return {
    file,
    index: true,
    ...pick(options, createIndexOptionKeys),
  };
}

const createLayoutOptionKeys = ["id"] as const satisfies Array<
  keyof RouteConfigEntry
>;
type CreateLayoutOptions = Pick<
  RouteConfigEntry,
  (typeof createLayoutOptionKeys)[number]
>;
function createLayout(
  file: string,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createLayout(
  file: string,
  options: CreateLayoutOptions,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createLayout(
  file: string,
  optionsOrChildren: CreateLayoutOptions | RouteConfigEntry[] | undefined,
  children?: RouteConfigEntry[]
): RouteConfigEntry {
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

export const route = createRoute;
export const index = createIndex;
export const layout = createLayout;
type RouteHelpers = {
  route: typeof route;
  index: typeof index;
  layout: typeof layout;
};
export function relative(directory: string): RouteHelpers {
  return {
    route: (path, file, ...rest) => {
      return route(path, resolve(directory, file), ...(rest as any));
    },
    index: (file, ...rest) => {
      return index(resolve(directory, file), ...(rest as any));
    },
    layout: (file, ...rest) => {
      return layout(resolve(directory, file), ...(rest as any));
    },
  };
}

export function configRoutesToRouteManifest(
  routes: RouteConfigEntry[],
  rootId = "root"
): RouteManifest {
  let routeManifest: RouteManifest = {};

  function walk(route: RouteConfigEntry, parentId: string) {
    let id = route.id || createRouteId(route.file);
    let manifestItem: RouteManifestEntry = {
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

function createRouteId(file: string) {
  return normalizeSlashes(stripFileExtension(file));
}

function normalizeSlashes(file: string) {
  return file.split(win32.sep).join("/");
}

function stripFileExtension(file: string) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}
