import type {
  HydrationState,
  NavigateOptions,
  Transition,
  Router,
  RouterState,
  RouteData,
} from "./router";
import { IDLE_TRANSITION, createRouter } from "./router";
import type {
  LoaderFunctionArgs,
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

// Re-exports for router usages
export type {
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
