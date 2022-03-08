import type {
  HydrationState,
  NavigateOptions,
  Transition,
  RemixRouter,
  RemixRouterState,
  RouteData,
} from "./router";
import { IDLE_TRANSITION, createRemixRouter } from "./router";
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
  RemixRouter,
  RemixRouterState,
};
export {
  IDLE_TRANSITION,
  createRemixRouter,
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
