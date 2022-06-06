import type {
  BrowserHistoryOptions,
  HashHistoryOptions,
  MemoryHistoryOptions,
} from "./history";
import {
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
} from "./history";
import type { Router, RouterInit } from "./router";
import { createRouter } from "./router";

function createMemoryRouter({
  initialEntries,
  initialIndex,
  ...routerInit
}: MemoryHistoryOptions & Omit<RouterInit, "history">): Router {
  let history = createMemoryHistory({ initialEntries, initialIndex });
  return createRouter({ history, ...routerInit });
}

function createBrowserRouter({
  window,
  ...routerInit
}: BrowserHistoryOptions & Omit<RouterInit, "history">): Router {
  let history = createBrowserHistory({ window });
  return createRouter({ history, ...routerInit });
}

function createHashRouter({
  window,
  ...routerInit
}: HashHistoryOptions & Omit<RouterInit, "history">): Router {
  let history = createHashHistory({ window });
  return createRouter({ history, ...routerInit });
}

export * from "./router";

export type {
  ActionFunction,
  DataRouteObject,
  FormEncType,
  FormMethod,
  JsonFunction,
  LoaderFunction,
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  RedirectFunction,
  RouteMatch,
  RouteObject,
  ShouldRevalidateFunction,
  Submission,
} from "./utils";

export {
  generatePath,
  getToPathname,
  invariant,
  isRouteErrorResponse,
  joinPaths,
  json,
  matchPath,
  matchRoutes,
  normalizePathname,
  redirect,
  resolvePath,
  resolveTo,
  stripBasename,
  warning,
} from "./utils";

export type {
  BrowserHistory,
  HashHistory,
  History,
  InitialEntry,
  Location,
  MemoryHistory,
  Path,
  To,
} from "./history";

export {
  Action,
  createBrowserHistory,
  createPath,
  createHashHistory,
  createMemoryHistory,
  parsePath,
} from "./history";

export { createBrowserRouter, createHashRouter, createMemoryRouter };
