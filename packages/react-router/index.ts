import type {
  ActionFunction,
  ActionFunctionArgs,
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
  Router as RemixRouter,
  ShouldRevalidateFunction,
  To,
  InitialEntry,
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
import { createComponents } from "./lib/components";
import {
  enhanceManualRouteObjects,
  createRoutesFromChildren,
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
  RelativeRoutingType,
  ReactRouterContexts,
} from "./lib/context";
import { reactRouterContexts, createReactRouterContexts } from "./lib/context";
import { DataStaticRouterContext } from "./lib/context";
import type { Hooks, NavigateFunction } from "./lib/hooks";
import { createHooks } from "./lib/hooks";

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
    useLoaderData,
    useMatches,
    useNavigation,
    useRevalidator,
    useRouteError,
    useRouteLoaderData,
  } = hooks;

  const {
    renderMatches,
    Await,
    MemoryRouter,
    Navigate,
    Outlet,
    Route,
    Router,
    RouterProvider,
    Routes,
  } = components;

  return {
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
    useLoaderData,
    useMatches,
    useNavigation,
    useRevalidator,
    useRouteError,
    useRouteLoaderData,
    renderMatches,
    Await,
    MemoryRouter,
    Navigate,
    Outlet,
    Route,
    Router,
    RouterProvider,
    Routes,
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
  AwaitProps,
  DataRouteMatch,
  DataRouteObject,
  Fetcher,
  Hash,
  IndexRouteObject,
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
  Hooks,
};

const {
  hooks: {
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
  },
  components: {
    Await,
    MemoryRouter,
    Navigate,
    Outlet,
    Route,
    Router,
    RouterProvider,
    Routes,
    renderMatches,
  },
} = createReactRouterEnvironment();

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

export function createMemoryRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    hydrationData?: HydrationState;
    initialEntries?: InitialEntry[];
    initialIndex?: number;
  }
): RemixRouter {
  return createRouter({
    basename: opts?.basename,
    history: createMemoryHistory({
      initialEntries: opts?.initialEntries,
      initialIndex: opts?.initialIndex,
    }),
    hydrationData: opts?.hydrationData,
    routes: enhanceManualRouteObjects(routes),
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
const {
  NavigationContext: DefaultNavigationContext,
  LocationContext: DefaultLocationContext,
  RouteContext: DefaultRouteContext,
  DataRouterContext: DefaultDataRouterContext,
  DataRouterStateContext: DefaultDataRouterStateContext,
} = reactRouterContexts;
export {
  DefaultNavigationContext as UNSAFE_NavigationContext,
  DefaultLocationContext as UNSAFE_LocationContext,
  DefaultRouteContext as UNSAFE_RouteContext,
  DefaultDataRouterContext as UNSAFE_DataRouterContext,
  DefaultDataRouterStateContext as UNSAFE_DataRouterStateContext,
  DataStaticRouterContext as UNSAFE_DataStaticRouterContext,
  enhanceManualRouteObjects as UNSAFE_enhanceManualRouteObjects,
  createReactRouterEnvironment as UNSAFE_createReactRouterEnvironment,
  createReactRouterContexts as UNSAFE_createReactRouterContexts,
  reactRouterContexts as UNSAFE_reactRouterContexts,
};
