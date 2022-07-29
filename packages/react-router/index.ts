import type {
  ActionFunction,
  ActionFunctionArgs,
  DataRouteMatch,
  Fetcher,
  JsonFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  Navigation,
  Params,
  ParamParseKey,
  Path,
  PathMatch,
  PathPattern,
  RedirectFunction,
  RouteMatch,
  RouteObject,
  ShouldRevalidateFunction,
  To,
} from "@remix-run/router";
import {
  Action as NavigationType,
  createPath,
  deferred,
  generatePath,
  isDeferredError,
  isRouteErrorResponse,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  resolvePath,
} from "@remix-run/router";

import {
  DataMemoryRouterProps,
  DeferredProps,
  MemoryRouterProps,
  NavigateProps,
  OutletProps,
  RouteProps,
  PathRouteProps,
  LayoutRouteProps,
  IndexRouteProps,
  RouterProps,
  RoutesProps,
  createComponents,
} from "./lib/components";
import { createRoutesFromChildren } from "./lib/components";
import {
  Navigator,
  NavigateOptions,
  createReactRouterContexts,
  ReactRouterContexts,
  reactRouterContexts,
} from "./lib/context";
import { DataStaticRouterContext } from "./lib/context";
import { createHooks, Hooks, NavigateFunction } from "./lib/hooks";

function createReactRouterEnvironment(contexts = reactRouterContexts) {
  const hooks = createHooks(contexts);
  const components = createComponents(contexts, hooks);

  return {
    hooks,
    components,
  };
}

export function createScopedMemoryRouterEnvironment(
  contexts?: ReactRouterContexts
) {
  if (!contexts) {
    contexts = createReactRouterContexts();
  }
  const { hooks, components } = createReactRouterEnvironment(contexts);

  const {
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
  } = hooks;
  const { MemoryRouter, Navigate, Outlet, Route, Routes, renderMatches } =
    components;

  return {
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
    MemoryRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    renderMatches,
    UNSAFE_NavigationContext: contexts.NavigationContext,
    UNSAFE_LocationContext: contexts.LocationContext,
    UNSAFE_RouteContext: contexts.RouteContext,
    UNSAFE_DataRouterContext: contexts.DataRouterContext,
    UNSAFE_DataRouterStateContext: contexts.DataRouterStateContext,
  };
}

// Exported for backwards compatibility, but not being used internally anymore
type Hash = string;
type Pathname = string;
type Search = string;

// Expose react-router public API
export type {
  ActionFunction,
  ActionFunctionArgs,
  DataMemoryRouterProps,
  DataRouteMatch,
  DeferredProps,
  Fetcher,
  Hash,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigation,
  Navigator,
  OutletProps,
  Params,
  ParamParseKey,
  Path,
  PathMatch,
  Pathname,
  PathPattern,
  PathRouteProps,
  RedirectFunction,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  To,
  Hooks,
};

const {
  hooks: {
    useActionData,
    useDeferredData,
    useHref,
    useInRouterContext,
    useLoaderData,
    useLocation,
    useMatch,
    useMatches,
    useNavigate,
    useNavigation,
    useNavigationType,
    useOutlet,
    useOutletContext,
    useParams,
    useResolvedPath,
    useRevalidator,
    useRouteError,
    useRouteLoaderData,
    useRoutes,
  },
  components: {
    DataMemoryRouter,
    Deferred,
    MemoryRouter,
    Navigate,
    Outlet,
    Route,
    Router,
    Routes,
    renderMatches,
    DataRouter,
    DataRouterProvider,
  },
} = createReactRouterEnvironment();

export {
  DataMemoryRouter,
  Deferred,
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  Routes,
  createPath,
  createRoutesFromChildren,
  deferred,
  isDeferredError,
  isRouteErrorResponse,
  generatePath,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  renderMatches,
  resolvePath,
  useActionData,
  useDeferredData,
  useHref,
  useInRouterContext,
  useLoaderData,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
  useNavigation,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRevalidator,
  useRouteError,
  useRouteLoaderData,
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
const {
  NavigationContext: DefaultNavigationContext,
  LocationContext: DefaultLocationContext,
  RouteContext: DefaultRouteContext,
  DataRouterContext: DefaultDataRouterContext,
  DataRouterStateContext: DefaultDataRouterStateContext,
} = reactRouterContexts;
export {
  DataRouter as UNSAFE_DataRouter,
  DataRouterProvider as UNSAFE_DataRouterProvider,
  DefaultNavigationContext as UNSAFE_NavigationContext,
  DefaultLocationContext as UNSAFE_LocationContext,
  DefaultRouteContext as UNSAFE_RouteContext,
  DefaultDataRouterContext as UNSAFE_DataRouterContext,
  DefaultDataRouterStateContext as UNSAFE_DataRouterStateContext,
  DataStaticRouterContext as UNSAFE_DataStaticRouterContext,
  createReactRouterEnvironment as UNSAFE_createReactRouterEnvironment,
  createReactRouterContexts as UNSAFE_createReactRouterContexts,
  reactRouterContexts as UNSAFE_reactRouterContexts,
};
