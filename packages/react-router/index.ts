import * as React from "react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  AgnosticRouteObject,
  Blocker,
  BlockerFunction,
  BrowserHistory,
  BrowserHistoryOptions,
  CreateStaticHandlerOptions,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  ErrorResponse,
  Fetcher,
  FormEncType,
  FormMethod,
  V7_FormMethod,
  GetScrollRestorationKeyFunction,
  History,
  HashHistory,
  HashHistoryOptions,
  HTMLFormMethod,
  HydrationState,
  InitialEntry,
  JsonFunction,
  LazyRouteFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  MemoryHistory,
  MemoryHistoryOptions,
  Navigation,
  ParamParseKey,
  Params,
  Path,
  PathMatch,
  PathParam,
  PathPattern,
  RedirectFunction,
  RelativeRoutingType,
  RevalidationState,
  Router as RemixRouter,
  RouterState,
  RouterSubscriber,
  FutureConfig as RouterFutureConfig,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
  StaticHandlerContext,
  To,
  UIMatch,
  UNSAFE_RouteManifest,
  unstable_HandlerResult,
} from "./router";
import {
  AbortedDeferredError,
  Action as NavigationType,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  createPath,
  createRouter,
  createStaticHandler,
  defer,
  generatePath,
  IDLE_BLOCKER,
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  isRouteErrorResponse,
  joinPaths,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  redirectDocument,
  resolvePath,
  resolveTo,
  stripBasename,
  UNSAFE_convertRoutesToDataRoutes,
  UNSAFE_ErrorResponseImpl,
  UNSAFE_invariant,
  UNSAFE_warning as warning,
} from "./router";

import type {
  AwaitProps,
  FutureConfig,
  IndexRouteProps,
  LayoutRouteProps,
  MemoryRouterProps,
  NavigateProps,
  OutletProps,
  PathRouteProps,
  RouteProps,
  RouterProps,
  RouterProviderProps,
  RoutesProps,
} from "./lib/components";
import {
  Await,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  createRoutesFromChildren,
  renderMatches,
} from "./lib/components";
import type {
  DataRouteMatch,
  DataRouteObject,
  IndexRouteObject,
  NavigateOptions,
  Navigator,
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
  useActionData,
  useAsyncError,
  useAsyncValue,
  useBlocker,
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
  useRouteId,
  useRouteLoaderData,
  useRoutes,
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
  BrowserHistory,
  BrowserHistoryOptions,
  CreateStaticHandlerOptions,
  DataRouteMatch,
  DataRouteObject,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  ErrorResponse,
  Fetcher,
  FormEncType,
  FormMethod,
  V7_FormMethod,
  FutureConfig,
  GetScrollRestorationKeyFunction,
  Hash,
  HashHistory,
  HashHistoryOptions,
  History,
  HTMLFormMethod,
  HydrationState,
  IndexRouteObject,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LazyRouteFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  MemoryHistory,
  MemoryHistoryOptions,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigation,
  Navigator,
  NonIndexRouteObject,
  OutletProps,
  ParamParseKey,
  Params,
  Path,
  PathMatch,
  PathParam,
  PathPattern,
  PathRouteProps,
  Pathname,
  RedirectFunction,
  RelativeRoutingType,
  RemixRouter,
  RevalidationState,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterState,
  RouterSubscriber,
  RouterProps,
  RouterProviderProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
  StaticHandlerContext,
  To,
  UIMatch,
  Blocker,
  BlockerFunction,
  UNSAFE_RouteManifest,
  unstable_HandlerResult,
};
export {
  AbortedDeferredError,
  NavigationType as Action,
  Await,
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  createPath,
  createRouter,
  createRoutesFromChildren,
  createRoutesFromChildren as createRoutesFromElements,
  createStaticHandler,
  defer,
  generatePath,
  IDLE_BLOCKER,
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  isRouteErrorResponse,
  joinPaths,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  redirectDocument,
  renderMatches,
  resolvePath,
  resolveTo,
  stripBasename,
  UNSAFE_convertRoutesToDataRoutes,
  UNSAFE_ErrorResponseImpl,
  UNSAFE_invariant,
  useBlocker,
  useActionData,
  useAsyncError,
  useAsyncValue,
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
  warning as UNSAFE_warning,
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

  if (route.HydrateFallback) {
    if (__DEV__) {
      if (route.hydrateFallbackElement) {
        warning(
          false,
          "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - " +
            "`HydrateFallback` will be used."
        );
      }
    }
    Object.assign(updates, {
      hydrateFallbackElement: React.createElement(route.HydrateFallback),
      HydrateFallback: undefined,
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
  routes: AgnosticRouteObject[],
  opts?: {
    basename?: string;
    future?: Partial<Omit<RouterFutureConfig, "v7_prependBasename">>;
    hydrationData?: HydrationState;
    initialEntries?: InitialEntry[];
    initialIndex?: number;
    unstable_dataStrategy?: unstable_DataStrategyFunction;
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
    unstable_dataStrategy: opts?.unstable_dataStrategy,
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
  DataRouterContext as UNSAFE_DataRouterContext,
  DataRouterStateContext as UNSAFE_DataRouterStateContext,
  LocationContext as UNSAFE_LocationContext,
  NavigationContext as UNSAFE_NavigationContext,
  RouteContext as UNSAFE_RouteContext,
  mapRouteProperties as UNSAFE_mapRouteProperties,
  useRouteId as UNSAFE_useRouteId,
  useRoutesImpl as UNSAFE_useRoutesImpl,
};
