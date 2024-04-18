/**
 * NOTE: If you refactor this to split up the modules into separate files,
 * you'll need to update the rollup config for react-router-dom-v5-compat.
 */
export type {
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  FormEncType,
  FormMethod,
  GetScrollRestorationKeyFunction,
  V7_FormMethod,
} from "@remix-run/router";
export { UNSAFE_ErrorResponseImpl } from "@remix-run/router";

// Note: Keep in sync with react-router exports!
export type {
  ActionFunction,
  ActionFunctionArgs,
  AwaitProps,
  Blocker,
  BlockerFunction,
  DataRouteMatch,
  DataRouteObject,
  ErrorResponse,
  Fetcher,
  FutureConfig,
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
  PathParam,
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
  ShouldRevalidateFunctionArgs,
  To,
  UIMatch,
  unstable_HandlerResult,
} from "react-router";
export {
  AbortedDeferredError,
  Await,
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  Routes,
  createMemoryRouter,
  createPath,
  createRoutesFromChildren,
  createRoutesFromElements,
  defer,
  isRouteErrorResponse,
  generatePath,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  redirectDocument,
  renderMatches,
  resolvePath,
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
  useRouteLoaderData,
  useRoutes,
} from "react-router";

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
} from "./lib";
export {
  createBrowserRouter,
  createHashRouter,
  BrowserRouter,
  HashRouter,
  Link,
  RouterProvider,
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
} from "./lib";
export type {
  ParamKeyValuePair,
  SubmitOptions,
  URLSearchParamsInit,
} from "./dom";
export { createSearchParams } from "./dom";
export { HydratedRouter } from "./ssr/browser";
export { Meta, Links, Scripts, PrefetchPageLinks } from "./ssr/components";
export type { HtmlLinkDescriptor } from "./ssr/links";
export type {
  ClientActionFunction,
  ClientActionFunctionArgs,
  ClientLoaderFunction,
  ClientLoaderFunctionArgs,
  MetaArgs,
  MetaDescriptor,
  MetaFunction,
} from "./ssr/routeModules";
export type { RemixServerProps } from "./ssr/server";
export { RemixServer } from "./ssr/server";

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
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_NavigationContext,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
  UNSAFE_useRouteId,
} from "react-router";
export { RemixContext as UNSAFE_RemixContext } from "./ssr/components";
export type { RouteModules as UNSAFE_RouteModules } from "./ssr/routeModules";
export type {
  FutureConfig as UNSAFE_FutureConfig,
  AssetsManifest as UNSAFE_AssetsManifest,
  RemixContextObject as UNSAFE_RemixContextObject,
} from "./ssr/entry";
export type {
  EntryRoute as UNSAFE_EntryRoute,
  RouteManifest as UNSAFE_RouteManifest,
} from "./ssr/routes";
export { decodeViaTurboStream as UNSAFE_decodeViaTurboStream } from "./ssr/single-fetch";
