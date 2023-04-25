import * as React from "react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  Blocker,
  BlockerFunction,
  Fetcher,
  HydrationState,
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
  RelativeRoutingType,
  Router as RemixRouter,
  ShouldRevalidateFunction,
  To,
  InitialEntry,
  LazyRouteFunction,
  FutureConfig,
} from "@remix-run/router";
import {
  AbortedDeferredError,
  Action as NavigationType,
  createMemoryHistory,
  createPath,
  createRouter,
  defer,
  generatePath,
  isRouteErrorResponse,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  resolvePath,
  UNSAFE_warning as warning,
} from "@remix-run/router";

import type {
  AwaitProps,
  MemoryRouterProps,
  NavigateProps,
  OutletProps,
  RouteProps,
  PathRouteProps,
  LayoutRouteProps,
  IndexRouteProps,
  RouterProps,
  RoutesProps,
  RouterProviderProps,
} from "./lib/components";
import {
  createRoutesFromChildren,
  renderMatches,
  Await,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
} from "./lib/components";
import type {
  DataRouteMatch,
  DataRouteObject,
  IndexRouteObject,
  Navigator,
  NavigateOptions,
  NonIndexRouteObject,
  RouteMatch,
  RouteObject,
} from "./lib/context";
import {
  DataRouterContext,
  DataRouterStateContext,
  LocationContext,
  NavigationContext,
  RouteContext,
} from "./lib/context";
import type { NavigateFunction } from "./lib/hooks";
import {
  useBlocker,
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
  useActionData,
  useAsyncError,
  useAsyncValue,
  useRouteId,
  useLoaderData,
  useMatches,
  useNavigation,
  useRevalidator,
  useRouteError,
  useRouteLoaderData,
  useRoutesImpl,
} from "./lib/hooks";

// Exported for backwards compatibility, but not being used internally anymore
type Hash = string;
type Pathname = string;
type Search = string;

// Expose react-router public API
export type {
  ActionFunction,
  ActionFunctionArgs,
  AwaitProps,
  Blocker as unstable_Blocker,
  BlockerFunction as unstable_BlockerFunction,
  DataRouteMatch,
  DataRouteObject,
  Fetcher,
  Hash,
  IndexRouteObject,
  IndexRouteProps,
  JsonFunction,
  LazyRouteFunction,
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
  NonIndexRouteObject,
  OutletProps,
  Params,
  ParamParseKey,
  Path,
  PathMatch,
  Pathname,
  PathPattern,
  PathRouteProps,
  RedirectFunction,
  RelativeRoutingType,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RouterProviderProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  To,
};
export {
  AbortedDeferredError,
  Await,
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  createPath,
  createRoutesFromChildren,
  createRoutesFromChildren as createRoutesFromElements,
  defer,
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
  useAsyncError,
  useAsyncValue,
  useBlocker as unstable_useBlocker,
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

function mapRouteProperties(route: RouteObject) {
  let updates: Partial<RouteObject> & { hasErrorBoundary: boolean } = {
    // Note: this check also occurs in createRoutesFromChildren so update
    // there if you change this -- please and thank you!
    hasErrorBoundary: route.ErrorBoundary != null || route.errorElement != null,
  };

  if (route.Component) {
    if (__DEV__) {
      if (route.element) {
        warning(
          false,
          "You should not include both `Component` and `element` on your route - " +
            "`Component` will be used."
        );
      }
    }
    Object.assign(updates, {
      element: React.createElement(route.Component),
      Component: undefined,
    });
  }

  if (route.ErrorBoundary) {
    if (__DEV__) {
      if (route.errorElement) {
        warning(
          false,
          "You should not include both `ErrorBoundary` and `errorElement` on your route - " +
            "`ErrorBoundary` will be used."
        );
      }
    }
    Object.assign(updates, {
      errorElement: React.createElement(route.ErrorBoundary),
      ErrorBoundary: undefined,
    });
  }

  return updates;
}

export function createMemoryRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    future?: Partial<Omit<FutureConfig, "v7_prependBasename">>;
    hydrationData?: HydrationState;
    initialEntries?: InitialEntry[];
    initialIndex?: number;
  }
): RemixRouter {
  return createRouter({
    basename: opts?.basename,
    future: {
      ...opts?.future,
      v7_prependBasename: true,
    },
    history: createMemoryHistory({
      initialEntries: opts?.initialEntries,
      initialIndex: opts?.initialIndex,
    }),
    hydrationData: opts?.hydrationData,
    routes,
    mapRouteProperties,
  }).initialize();
}

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
  DataRouterContext as UNSAFE_DataRouterContext,
  DataRouterStateContext as UNSAFE_DataRouterStateContext,
  mapRouteProperties as UNSAFE_mapRouteProperties,
  useRouteId as UNSAFE_useRouteId,
  useRoutesImpl as UNSAFE_useRoutesImpl,
};
