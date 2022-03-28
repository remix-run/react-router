import {
  BrowserHistoryOptions,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  HashHistoryOptions,
  MemoryHistoryOptions,
} from "./history";
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
  ActionFunctionArgs,
  FormEncType,
  FormMethod,
  LoaderFunctionArgs,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  RouteMatch,
  RouteObject,
  Submission,
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
  ActionFunctionArgs,
  FormEncType,
  FormMethod,
  HydrationState,
  LoaderFunctionArgs,
  NavigateOptions,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  RouteData,
  RouteMatch,
  RouteObject,
  Router,
  RouterInit,
  RouterState,
  Submission,
  Transition,
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

export type BrowserRouterInit = BrowserHistoryOptions &
  Omit<RouterInit, "history">;
export function createBrowserRouter({
  window,
  ...routerInit
}: BrowserRouterInit): Router {
  let history = createBrowserHistory({ window });
  return createRouter({ history, ...routerInit });
}

export type HashRouterInit = HashHistoryOptions & Omit<RouterInit, "history">;
export function createHashRouter({
  window,
  ...routerInit
}: HashRouterInit): Router {
  let history = createHashHistory({ window });
  return createRouter({ history, ...routerInit });
}
