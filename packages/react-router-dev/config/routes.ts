import { resolve, win32 } from "node:path";
import pick from "lodash/pick";
import invariant from "../invariant";

let appDirectory: string;

export function setAppDirectory(directory: string) {
  appDirectory = directory;
}

/**
 * Provides the absolute path to the app directory, for use within `routes.ts`.
 * This is designed to support resolving file system routes.
 */
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

/**
 * Route config to be exported via the `routes` export within `routes.ts`.
 */
export type RouteConfig = RouteConfigEntry[] | Promise<RouteConfigEntry[]>;

/**
 * Configuration for an individual route, for use within `routes.ts`. As a
 * convenience, route config entries can be created with the {@link route},
 * {@link index} and {@link layout} helper functions.
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

const createConfigRouteOptionKeys = [
  "id",
  "index",
  "caseSensitive",
] as const satisfies Array<keyof RouteConfigEntry>;
type CreateRouteOptions = Pick<
  RouteConfigEntry,
  (typeof createConfigRouteOptionKeys)[number]
>;
/**
 * Helper function for creating a route config entry, for use within
 * `routes.ts`.
 */
function createRoute(
  path: string | null | undefined,
  file: string,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createRoute(
  path: string | null | undefined,
  file: string,
  options: CreateRouteOptions,
  children?: RouteConfigEntry[]
): RouteConfigEntry;
function createRoute(
  path: string | null | undefined,
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
/**
 * Helper function for creating a route config entry for an index route, for use
 * within `routes.ts`.
 */
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
/**
 * Helper function for creating a route config entry for a layout route, for use
 * within `routes.ts`.
 */
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
/**
 * Creates a set of route config helpers that resolve file paths relative to the
 * given directory, for use within `routes.ts`. This is designed to support
 * splitting route config into multiple files within different directories.
 */
export function relative(directory: string): {
  route: typeof route;
  index: typeof index;
  layout: typeof layout;
} {
  return {
    /**
     * Helper function for creating a route config entry, for use within
     * `routes.ts`. Note that this helper has been scoped, meaning that file
     * path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
    route: (path, file, ...rest) => {
      return route(path, resolve(directory, file), ...(rest as any));
    },
    /**
     * Helper function for creating a route config entry for an index route, for
     * use within `routes.ts`. Note that this helper has been scoped, meaning
     * that file path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
    index: (file, ...rest) => {
      return index(resolve(directory, file), ...(rest as any));
    },
    /**
     * Helper function for creating a route config entry for a layout route, for
     * use within `routes.ts`. Note that this helper has been scoped, meaning
     * that file path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
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
