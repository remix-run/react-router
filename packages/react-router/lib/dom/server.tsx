import { Action as NavigationType } from "../router/history";
import type {
  FutureConfig,
  Router as DataRouter,
  RevalidationState,
  CreateStaticHandlerOptions as RouterCreateStaticHandlerOptions,
  StaticHandlerContext,
} from "../router/router";
import {
  IDLE_BLOCKER,
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  createStaticHandler as routerCreateStaticHandler,
} from "../router/router";
import type { RouteManifest } from "../router/utils";
import { convertRoutesToDataRoutes } from "../router/utils";
import { mapRouteProperties } from "./shared";
import type { RouteObject } from "../context";
import { createHref, encodeLocation } from "./shared";

type CreateStaticHandlerOptions = Omit<
  RouterCreateStaticHandlerOptions,
  "mapRouteProperties"
>;

/**
 * @category Utils
 */
export function createStaticHandler(
  routes: RouteObject[],
  opts?: CreateStaticHandlerOptions
) {
  return routerCreateStaticHandler(routes, {
    ...opts,
    mapRouteProperties,
  });
}

/**
 * @category Routers
 */
export function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext,
  opts: {
    future?: Partial<FutureConfig>;
  } = {}
): DataRouter {
  let manifest: RouteManifest = {};
  let dataRoutes = convertRoutesToDataRoutes(
    routes,
    mapRouteProperties,
    undefined,
    manifest
  );

  // Because our context matches may be from a framework-agnostic set of
  // routes passed to createStaticHandler(), we update them here with our
  // newly created/enhanced data routes
  let matches = context.matches.map((match) => {
    let route = manifest[match.route.id] || match.route;
    return {
      ...match,
      route,
    };
  });

  let msg = (method: string) =>
    `You cannot use router.${method}() on the server because it is a stateless environment`;

  return {
    get basename() {
      return context.basename;
    },
    get future() {
      return {
        ...opts?.future,
      };
    },
    get state() {
      return {
        historyAction: NavigationType.Pop,
        location: context.location,
        matches,
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: context.errors,
        initialized: true,
        navigation: IDLE_NAVIGATION,
        restoreScrollPosition: null,
        preventScrollReset: false,
        revalidation: "idle" as RevalidationState,
        fetchers: new Map(),
        blockers: new Map(),
      };
    },
    get routes() {
      return dataRoutes;
    },
    get window() {
      return undefined;
    },
    initialize() {
      throw msg("initialize");
    },
    subscribe() {
      throw msg("subscribe");
    },
    enableScrollRestoration() {
      throw msg("enableScrollRestoration");
    },
    navigate() {
      throw msg("navigate");
    },
    fetch() {
      throw msg("fetch");
    },
    revalidate() {
      throw msg("revalidate");
    },
    createHref,
    encodeLocation,
    getFetcher() {
      return IDLE_FETCHER;
    },
    deleteFetcher() {
      throw msg("deleteFetcher");
    },
    dispose() {
      throw msg("dispose");
    },
    getBlocker() {
      return IDLE_BLOCKER;
    },
    deleteBlocker() {
      throw msg("deleteBlocker");
    },
    patchRoutes() {
      throw msg("patchRoutes");
    },
    _internalFetchControllers: new Map(),
    _internalSetRoutes() {
      throw msg("_internalSetRoutes");
    },
  };
}
