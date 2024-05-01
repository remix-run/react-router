import type {
  ActionFunction,
  ActionFunctionArgs,
  Blocker,
  BlockerFunction,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  ErrorResponse,
  Fetcher,
  JsonFunction,
  LazyRouteFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  Navigation,
  ParamParseKey,
  Params,
  Path,
  PathMatch,
  PathParam,
  PathPattern,
  RedirectFunction,
  RelativeRoutingType,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
  To,
  UIMatch,
  unstable_HandlerResult,
} from "./lib/router";
import {
  AbortedDeferredError,
  Action as NavigationType,
  createPath,
  defer,
  generatePath,
  isRouteErrorResponse,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  redirectDocument,
  resolvePath,
  UNSAFE_ErrorResponseImpl,
} from "./lib/router";

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
  createMemoryRouter,
  mapRouteProperties,
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
  DataRouteMatch,
  DataRouteObject,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  ErrorResponse,
  Fetcher,
  FutureConfig,
  Hash,
  IndexRouteObject,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LazyRouteFunction,
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
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RouterProviderProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
  To,
  UIMatch,
  Blocker,
  BlockerFunction,
  unstable_HandlerResult,
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
  createMemoryRouter,
  createPath,
  createRoutesFromChildren,
  createRoutesFromChildren as createRoutesFromElements,
  defer,
  generatePath,
  isRouteErrorResponse,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  redirectDocument,
  renderMatches,
  resolvePath,
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
};

// Expose old @remix-run/router API
export type {
  // TODO: Stop exporting agnostic stuff in v7?
  AgnosticDataIndexRouteObject,
  AgnosticDataNonIndexRouteObject,
  AgnosticDataRouteMatch,
  AgnosticDataRouteObject,
  AgnosticIndexRouteObject,
  AgnosticNonIndexRouteObject,
  AgnosticRouteMatch,
  AgnosticRouteObject,
  HydrationState,
  InitialEntry,
  StaticHandler,
  TrackedPromise,
  UNSAFE_DeferredData,
} from "./lib/router";
export {
  getStaticContextFromError,
  stripBasename,
  UNSAFE_DEFERRED_SYMBOL,
  UNSAFE_convertRoutesToDataRoutes,
} from "./lib/router";

// Expose old RR DOM API
export type {
  FormEncType,
  FormMethod,
  GetScrollRestorationKeyFunction,
  StaticHandlerContext,
  V7_FormMethod,
} from "./lib/router";

export type {
  BrowserRouterProps,
  HashRouterProps,
  HistoryRouterProps,
  LinkProps,
  NavLinkProps,
  FetcherFormProps,
  FormProps,
  ScrollRestorationProps,
  SetURLSearchParams,
  SubmitFunction,
  FetcherSubmitFunction,
  FetcherWithComponents,
} from "./lib/dom/lib";
export {
  createBrowserRouter,
  createHashRouter,
  BrowserRouter,
  HashRouter,
  Link,
  // TODO: Collapse RouterProvider implementations
  // RouterProvider,
  UNSAFE_ViewTransitionContext,
  UNSAFE_FetchersContext,
  unstable_HistoryRouter,
  NavLink,
  Form,
  ScrollRestoration,
  useLinkClickHandler,
  useSearchParams,
  useSubmit,
  useFormAction,
  useFetcher,
  useFetchers,
  UNSAFE_useScrollRestoration,
  useBeforeUnload,
  unstable_usePrompt,
  unstable_useViewTransitionState,
} from "./lib/dom/lib";
export type {
  ParamKeyValuePair,
  SubmitOptions,
  URLSearchParamsInit,
} from "./lib/dom/dom";
export { createSearchParams } from "./lib/dom/dom";
export type {
  StaticRouterProps,
  StaticRouterProviderProps,
} from "./lib/dom/server";
export {
  createStaticHandler,
  createStaticRouter,
  StaticRouter,
  StaticRouterProvider,
} from "./lib/dom/server";
export { HydratedRouter } from "./lib/dom/ssr/browser";
export {
  Meta,
  Links,
  Scripts,
  PrefetchPageLinks,
} from "./lib/dom/ssr/components";
export type { HtmlLinkDescriptor } from "./lib/dom/ssr/links";
export type {
  ClientActionFunction,
  ClientActionFunctionArgs,
  ClientLoaderFunction,
  ClientLoaderFunctionArgs,
  MetaArgs,
  MetaDescriptor,
  MetaFunction,
} from "./lib/dom/ssr/routeModules";
export type { RemixServerProps } from "./lib/dom/ssr/server";
export { RemixServer } from "./lib/dom/ssr/server";
export type { RemixStubProps } from "./lib/dom/ssr/create-remix-stub";
export { createRemixStub } from "./lib/dom/ssr/create-remix-stub";

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
  UNSAFE_ErrorResponseImpl,
};

/** @internal */
export { RemixContext as UNSAFE_RemixContext } from "./lib/dom/ssr/components";

/** @internal */
export type { RouteModules as UNSAFE_RouteModules } from "./lib/dom/ssr/routeModules";

/** @internal */
export type {
  FutureConfig as UNSAFE_FutureConfig,
  AssetsManifest as UNSAFE_AssetsManifest,
  RemixContextObject as UNSAFE_RemixContextObject,
} from "./lib/dom/ssr/entry";

/** @internal */
export type {
  EntryRoute as UNSAFE_EntryRoute,
  RouteManifest as UNSAFE_RouteManifest,
} from "./lib/dom/ssr/routes";

/** @internal */
export type {
  SingleFetchRedirectResult as UNSAFE_SingleFetchRedirectResult,
  SingleFetchResult as UNSAFE_SingleFetchResult,
  SingleFetchResults as UNSAFE_SingleFetchResults,
} from "./lib/dom/ssr/single-fetch";
export {
  decodeViaTurboStream as UNSAFE_decodeViaTurboStream,
  SingleFetchRedirectSymbol as UNSAFE_SingleFetchRedirectSymbol,
} from "./lib/dom/ssr/single-fetch";
