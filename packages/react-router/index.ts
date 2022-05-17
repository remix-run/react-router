import type { Hash, Location, Path, Pathname, Search, To } from "history";
import { Action as NavigationType, parsePath, createPath } from "history";

import type {
  MemoryRouterProps,
  NavigateProps,
  OutletProps,
  RouteProps,
  PathRouteProps,
  LayoutRouteProps,
  IndexRouteProps,
  RouterProps,
  RoutesProps,
} from "./lib/components";
import {
  createRoutesFromChildren,
  renderMatches,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
} from "./lib/components";
import type { Navigator } from "./lib/context";
import {
  LocationContext,
  NavigationContext,
  RouteContext,
} from "./lib/context";
import type { NavigateFunction, NavigateOptions } from "./lib/hooks";
import {
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigationType,
  useNavigate,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRoutes,
} from "./lib/hooks";
import type {
  Params,
  PathMatch,
  PathPattern,
  RouteMatch,
  RouteObject,
} from "./lib/router";
import {
  generatePath,
  matchPath,
  matchRoutes,
  resolvePath,
} from "./lib/router";

// Expose react-router public API
export type {
  Hash,
  IndexRouteProps,
  LayoutRouteProps,
  Location,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  OutletProps,
  PathMatch,
  PathPattern,
  PathRouteProps,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RoutesProps,
  Navigator,
  Params,
  Path,
  Pathname,
  Search,
  To,
};
export {
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  Routes,
  createPath,
  createRoutesFromChildren,
  generatePath,
  matchPath,
  matchRoutes,
  parsePath,
  renderMatches,
  resolvePath,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRoutes,
};

///////////////////////////////////////////////////////////////////////////////
// DANGER! PLEASE READ ME!
// We provide these exports as an escape hatch in the event that you need any
// routing data that we don't provide an explicit API for. With that said, we
// want to cover your use case if we can, so if you feel the need to use these
// we want to hear from you. Let us know what you're building and we'll do our
// best to make sure we can support you!
//
// We consider these exports an implementation detail and do not guarantee
// against any breaking changes, regardless of the semver release. Use with
// extreme caution and only if you understand the consequences. Godspeed.
///////////////////////////////////////////////////////////////////////////////

/** @internal */
export {
  NavigationContext as UNSAFE_NavigationContext,
  LocationContext as UNSAFE_LocationContext,
  RouteContext as UNSAFE_RouteContext,
};
