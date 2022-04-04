import type {
  BrowserHistory,
  BrowserHistoryOptions,
  HashHistory,
  HashHistoryOptions,
  History,
  InitialEntry,
  Location,
  MemoryHistory,
  MemoryHistoryOptions,
  Path,
  To,
} from "./history";
import {
  Action,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  createPath,
  parsePath,
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

type MemoryRouterInit = MemoryHistoryOptions & Omit<RouterInit, "history">;
function createMemoryRouter({
  initialEntries,
  initialIndex,
  ...routerInit
}: MemoryRouterInit): Router {
  let history = createMemoryHistory({ initialEntries, initialIndex });
  return createRouter({ history, ...routerInit });
}

type BrowserRouterInit = BrowserHistoryOptions & Omit<RouterInit, "history">;
function createBrowserRouter({
  window,
  ...routerInit
}: BrowserRouterInit): Router {
  let history = createBrowserHistory({ window });
  return createRouter({ history, ...routerInit });
}

type HashRouterInit = HashHistoryOptions & Omit<RouterInit, "history">;
function createHashRouter({ window, ...routerInit }: HashRouterInit): Router {
  let history = createHashHistory({ window });
  return createRouter({ history, ...routerInit });
}

// @remix-run/router public Type API
export type {
  ActionFunctionArgs,
  BrowserHistory,
  BrowserRouterInit,
  FormEncType,
  FormMethod,
  HashHistory,
  HashRouterInit,
  History,
  HydrationState,
  InitialEntry,
  LoaderFunctionArgs,
  Location,
  MemoryHistory,
  MemoryRouterInit,
  NavigateOptions,
  ParamParseKey,
  Params,
  Path,
  PathMatch,
  PathPattern,
  RouteData,
  RouteMatch,
  RouteObject,
  Router,
  RouterInit,
  RouterState,
  Submission,
  To,
  Transition,
};

// @remix-run/router public API
export {
  Action,
  IDLE_TRANSITION,
  createBrowserHistory,
  createBrowserRouter,
  createHashHistory,
  createHashRouter,
  createMemoryRouter,
  createMemoryHistory,
  createPath,
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
  parsePath,
  resolvePath,
  resolveTo,
  stripBasename,
  warning,
  warningOnce,
};
