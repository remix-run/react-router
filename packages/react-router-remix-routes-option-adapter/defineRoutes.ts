import type { RouteManifest, RouteManifestEntry } from "./manifest";
import { normalizeSlashes } from "./normalizeSlashes";

export type DefineRoutesFunction = (
  callback: (defineRoute: DefineRouteFunction) => void
) => RouteManifest;

interface DefineRouteOptions {
  /**
   * Should be `true` if the route `path` is case-sensitive. Defaults to
   * `false`.
   */
  caseSensitive?: boolean;

  /**
   * Should be `true` if this is an index route that does not allow child routes.
   */
  index?: boolean;

  /**
   * An optional unique id string for this route. Use this if you need to aggregate
   * two or more routes with the same route file.
   */
  id?: string;
}

interface DefineRouteChildren {
  (): void;
}

interface DefineRouteFunction {
  (
    /**
     * The path this route uses to match the URL pathname.
     */
    path: string | undefined,

    /**
     * The path to the file that exports the React component rendered by this
     * route as its default export, relative to the `app` directory.
     */
    file: string,

    /**
     * Options for defining routes, or a function for defining child routes.
     */
    optionsOrChildren?: DefineRouteOptions | DefineRouteChildren,

    /**
     * A function for defining child routes.
     */
    children?: DefineRouteChildren
  ): void;
}

/**
 * A function for defining routes programmatically, instead of using the
 * filesystem convention.
 */
export const defineRoutes: DefineRoutesFunction = (callback) => {
  let routes: RouteManifest = Object.create(null);
  let parentRoutes: RouteManifestEntry[] = [];
  let alreadyReturned = false;

  let defineRoute: DefineRouteFunction = (
    path,
    file,
    optionsOrChildren,
    children
  ) => {
    if (alreadyReturned) {
      throw new Error(
        "You tried to define routes asynchronously but started defining " +
          "routes before the async work was done. Please await all async " +
          "data before calling `defineRoutes()`"
      );
    }

    let options: DefineRouteOptions;
    if (typeof optionsOrChildren === "function") {
      // route(path, file, children)
      options = {};
      children = optionsOrChildren;
    } else {
      // route(path, file, options, children)
      // route(path, file, options)
      options = optionsOrChildren || {};
    }

    let route: RouteManifestEntry = {
      path: path ? path : undefined,
      index: options.index ? true : undefined,
      caseSensitive: options.caseSensitive ? true : undefined,
      id: options.id || createRouteId(file),
      parentId:
        parentRoutes.length > 0
          ? parentRoutes[parentRoutes.length - 1].id
          : "root",
      file,
    };

    if (route.id in routes) {
      throw new Error(
        `Unable to define routes with duplicate route id: "${route.id}"`
      );
    }

    routes[route.id] = route;

    if (children) {
      parentRoutes.push(route);
      children();
      parentRoutes.pop();
    }
  };

  callback(defineRoute);

  alreadyReturned = true;

  return routes;
};

function createRouteId(file: string) {
  return normalizeSlashes(stripFileExtension(file));
}

function stripFileExtension(file: string) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}
