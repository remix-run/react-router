/**
 * Welcome future Michael and Ryan 👋, or anybody else reading this. We're doing
 * weird stuff here to help folks to migrate their React Router v5 apps to v6.
 *
 * So WTFlip is going on here?
 *
 * - We need to be able to run react-router-dom@v5 in parallel with
 *   react-router-dom@v6
 *
 * - npm/node/whoever doesn't let an app depend on two versions of the same
 *   package
 *
 * - Not only do we need to run two versions of the same package, we also need
 *   this `CompatRouter` to *itself* depend on both versions 😬
 *
 * - When this package depends on "history" and "react-router-dom", those need
 *   to be the `peerDependencies` that the application package.json declares.
 *
 * - That means this package can't depend on "react-router-dom" v6, but it needs to,
 *   therefore it must ~become~ react-router-dom v6 👻
 *
 * - We could import from "../../react-router-dom" and get rollup to bundle it as part
 *   of this package instead BUT ...
 *
 * - TSC needs to generate the types, and it has to derive the output paths from
 *   the import paths. If we have a weird require *outside of this package* to
 *   "../../react-router-dom" it's going to generate types from the common root
 *   of all module paths (Which makes sense because what else would it do? It
 *   needs to write the type files next to the source files so that typescript
 *   can resolve the types for tooling in the same location as the modules).
 *   Because tsc isn't as flexible as rollup, we have no control over this
 *   behavior.
 *
 * - Therefore, we simply copy the v6 modules into this package at build time.
 *   TSC won't come across any weird require paths (requiring outside of this
 *   package with "../../") and everybody puts the files where everybody else
 *   expects them to be.
 *
 * - The v6 `StaticRouter` found in `react-router-dom/server.ts` has a funny
 *   require to *itself* ("react-router-dom") so we had to duplicate it in this
 *   package because "react-router-dom" will point to the app's v5 version. We
 *   can't change that require to a normal internal require ("../index") because
 *   we generate two bundles (one for "react-router-dom" and one for
 *   "react-router-dom/server"). If it were an internal require then SSR router
 *   apps would have two copies of "react-router-dom", two contexts, and stuff
 *   would break. We could stop doing two bundles in v6 "react-router-dom" and
 *   deprecate the deep require if we wanted to avoid the duplication here.
 */
export type {
  ActionFunction,
  ActionFunctionArgs,
  AwaitProps,
  BrowserRouterProps,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  DataRouteMatch,
  DataRouteObject,
  ErrorResponse,
  Fetcher,
  FetcherWithComponents,
  FormEncType,
  FormMethod,
  FormProps,
  FutureConfig,
  GetScrollRestorationKeyFunction,
  Hash,
  HashRouterProps,
  HistoryRouterProps,
  IndexRouteObject,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LinkProps,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  MemoryRouterProps,
  NavLinkProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigation,
  Navigator,
  NonIndexRouteObject,
  OutletProps,
  ParamKeyValuePair,
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
  ScrollRestorationProps,
  Search,
  ShouldRevalidateFunction,
  ShouldRevalidateFunctionArgs,
  SubmitFunction,
  SubmitOptions,
  To,
  URLSearchParamsInit,
  UIMatch,
  Blocker,
  BlockerFunction,
  unstable_HandlerResult,
} from "./react-router-dom";
export {
  AbortedDeferredError,
  Await,
  BrowserRouter,
  Form,
  HashRouter,
  Link,
  MemoryRouter,
  NavLink,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  ScrollRestoration,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  UNSAFE_useRouteId,
  UNSAFE_useScrollRestoration,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  createPath,
  createRoutesFromChildren,
  createRoutesFromElements,
  createSearchParams,
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
  unstable_HistoryRouter,
  useBlocker,
  unstable_usePrompt,
  useActionData,
  useAsyncError,
  useAsyncValue,
  useBeforeUnload,
  useFetcher,
  useFetchers,
  useFormAction,
  useHref,
  useInRouterContext,
  useLinkClickHandler,
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
  useSearchParams,
  useSubmit,
} from "./react-router-dom";

export type { StaticRouterProps } from "./lib/components";
export { CompatRoute, CompatRouter, StaticRouter } from "./lib/components";
