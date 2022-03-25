import { createMemoryHistory, MemoryHistoryOptions } from "./history";
import type {
  HydrationState,
  NavigateOptions,
  Transition,
  Router,
  RouterState,
  RouteData,
  RouterInit,
} from "./router";
import { IDLE_TRANSITION, createRouter } from "./router";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  RouteMatch,
  RouteObject,
} from "./utils";
import {
  generatePath,
  getToPathname,
  invariant,
  joinPaths,
  matchPath,
  matchRoutes,
  normalizePathname,
  normalizeSearch,
  normalizeHash,
  resolvePath,
  resolveTo,
  stripBasename,
  warning,
  warningOnce,
} from "./utils";

export type { History, Location, InitialEntry, To } from "./history";
export { Action, createMemoryHistory, parsePath } from "./history";

// Re-exports for router usages
export type {
  RouterInit,
  HydrationState,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  NavigateOptions,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  RouteData,
  RouteMatch,
  RouteObject,
  Transition,
  Router,
  RouterState,
};
export {
  IDLE_TRANSITION,
  createRouter,
  generatePath,
  getToPathname,
  invariant,
  joinPaths,
  matchPath,
  matchRoutes,
  normalizeHash,
  normalizePathname,
  normalizeSearch,
  resolvePath,
  resolveTo,
  stripBasename,
  warning,
  warningOnce,
};

export type MemoryRouterInit = MemoryHistoryOptions &
  Omit<RouterInit, "history">;
export function createMemoryRouter({
  initialEntries,
  initialIndex,
  ...routerInit
}: MemoryRouterInit): Router {
  let history = createMemoryHistory({ initialEntries, initialIndex });
  return createRouter({ history, ...routerInit });
}
