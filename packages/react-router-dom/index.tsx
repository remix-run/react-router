/**
 * NOTE: If you refactor this to split up the modules into separate files,
 * you'll need to update the rollup config for react-router-dom-v5-compat.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";
import type {
  DataRouteObject,
  FutureConfig as RenderFutureConfig,
  Location,
  NavigateOptions,
  NavigationType,
  Navigator,
  RelativeRoutingType,
  RouteObject,
  RouterProviderProps as MemoryRouterProviderProps,
  To,
} from "react-router";
import {
  Router,
  createPath,
  useHref,
  useLocation,
  useMatches,
  useNavigate,
  useNavigation,
  useResolvedPath,
  useBlocker,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_NavigationContext as NavigationContext,
  UNSAFE_RouteContext as RouteContext,
  UNSAFE_mapRouteProperties as mapRouteProperties,
  UNSAFE_useRouteId as useRouteId,
  UNSAFE_useRoutesImpl as useRoutesImpl,
} from "react-router";
import type {
  BrowserHistory,
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  Fetcher,
  FormEncType,
  FormMethod,
  FutureConfig as RouterFutureConfig,
  GetScrollRestorationKeyFunction,
  HashHistory,
  History,
  HTMLFormMethod,
  HydrationState,
  Router as RemixRouter,
  V7_FormMethod,
  RouterState,
  RouterSubscriber,
  BlockerFunction,
} from "@remix-run/router";
import {
  createRouter,
  createBrowserHistory,
  createHashHistory,
  joinPaths,
  stripBasename,
  UNSAFE_ErrorResponseImpl as ErrorResponseImpl,
  UNSAFE_invariant as invariant,
  UNSAFE_warning as warning,
  matchPath,
  IDLE_FETCHER,
  matchRoutes,
} from "@remix-run/router";

import type {
  SubmitOptions,
  ParamKeyValuePair,
  URLSearchParamsInit,
  SubmitTarget,
} from "./dom";
import {
  createSearchParams,
  defaultMethod,
  getFormSubmissionInfo,
  getSearchParamsForLocation,
  shouldProcessLinkClick,
} from "./dom";

import type { PrefetchBehavior, ScriptProps, UIMatch } from "./ssr/components";
import {
  PrefetchPageLinks,
  RemixContext,
  mergeRefs,
  usePrefetchBehavior,
} from "./ssr/components";
import type {
  AssetsManifest,
  FutureConfig as RemixFutureConfig,
} from "./ssr/entry";
import { RemixErrorBoundary } from "./ssr/errorBoundaries";
import type { RouteModules } from "./ssr/routeModules";
import {
  createClientRoutes,
  createClientRoutesWithHMRRevalidationOptOut,
  shouldHydrateRouteLoader,
} from "./ssr/routes";
import {
  decodeViaTurboStream,
  getSingleFetchDataStrategy,
} from "./ssr/single-fetch";

////////////////////////////////////////////////////////////////////////////////
//#region Re-exports
////////////////////////////////////////////////////////////////////////////////

export type {
  unstable_DataStrategyFunction,
  unstable_DataStrategyFunctionArgs,
  unstable_DataStrategyMatch,
  FormEncType,
  FormMethod,
  GetScrollRestorationKeyFunction,
  ParamKeyValuePair,
  SubmitOptions,
  URLSearchParamsInit,
  V7_FormMethod,
};
export { createSearchParams, ErrorResponseImpl as UNSAFE_ErrorResponseImpl };

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
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Global Stuff
////////////////////////////////////////////////////////////////////////////////

type WindowRemixContext = {
  url: string;
  basename?: string;
  state: HydrationState;
  criticalCss?: string;
  future: RemixFutureConfig;
  isSpaMode: boolean;
  stream: ReadableStream<Uint8Array> | undefined;
  streamController: ReadableStreamDefaultController<Uint8Array>;
  // The number of active deferred keys rendered on the server
  a?: number;
  dev?: {
    port?: number;
    hmrRuntime?: string;
  };
};

declare global {
  interface Document {
    startViewTransition(cb: () => Promise<void> | void): ViewTransition;
  }

  // v6 SPA info
  var __reactRouterVersion: string;
  // TODO: v7 - Can this go away in favor of "just use remix"?
  var __staticRouterHydrationData: HydrationState | undefined;

  // v7 SSR Info
  // TODO: v7 - Once this is all working, rename these global variables to __reactRouter*
  var __remixContext: WindowRemixContext | undefined;
  var __remixManifest: AssetsManifest | undefined;
  var __remixRouteModules: RouteModules | undefined;
  var __remixRouter: RemixRouter | undefined;
  var __remixRevalidation: number | undefined;
  var __remixClearCriticalCss: (() => void) | undefined;
  var $RefreshRuntime$:
    | {
        performReactRefresh: () => void;
      }
    | undefined;
}

// HEY YOU! DON'T TOUCH THIS VARIABLE!
//
// It is replaced with the proper version at build time via a babel plugin in
// the rollup config.
//
// Export a global property onto the window for React Router detection by the
// Core Web Vitals Technology Report.  This way they can configure the `wappalyzer`
// to detect and properly classify live websites as being built with React Router:
// https://github.com/HTTPArchive/wappalyzer/blob/main/src/technologies/r.json
const REACT_ROUTER_VERSION = "0";
try {
  window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e) {
  // no-op
}

type SSRInfo = {
  context: WindowRemixContext;
  routeModules: RouteModules;
  manifest: AssetsManifest;
  stateDecodingPromise:
    | (Promise<void> & {
        value?: unknown;
        error?: unknown;
      })
    | undefined;
  router: RemixRouter | undefined;
  routerInitialized: boolean;
};

let ssrInfo: SSRInfo | null = null;

function initSsrInfo(): void {
  if (
    !ssrInfo &&
    window.__remixContext &&
    window.__remixManifest &&
    window.__remixRouteModules
  ) {
    ssrInfo = {
      context: window.__remixContext,
      manifest: window.__remixManifest,
      routeModules: window.__remixRouteModules,
      stateDecodingPromise: undefined,
      router: undefined,
      routerInitialized: false,
    };
  }
}

export type HmrInfo = {
  abortController: AbortController | undefined;
  routerReadyResolve: (router: RemixRouter) => void;
  routerReadyPromise: Promise<RemixRouter>;
};

let hmrInfo: HmrInfo | null = null;

if (
  import.meta &&
  // @ts-expect-error
  import.meta.hot &&
  window.__remixManifest
) {
  let resolve: (router: RemixRouter) => void;
  let routerReadyPromise = new Promise((r) => {
    resolve = r;
  }).catch(() => {
    // This is a noop catch handler to avoid unhandled promise rejection warnings
    // in the console. The promise is never rejected.
    return undefined;
  }) as Promise<RemixRouter>;

  hmrInfo = {
    abortController: undefined,
    routerReadyResolve: resolve!,
    // There's a race condition with HMR where the remix:manifest is signaled before
    // the router is assigned in the RemixBrowser component. This promise gates the
    // HMR handler until the router is ready
    routerReadyPromise,
  };

  // @ts-expect-error
  import.meta.hot.accept(
    "remix:manifest",
    async ({
      assetsManifest,
      needsRevalidation,
    }: {
      assetsManifest: AssetsManifest;
      needsRevalidation: Set<string>;
    }) => {
      let router = await hmrInfo!.routerReadyPromise;
      // This should never happen, but just in case...
      if (!router || !ssrInfo || !hmrInfo) {
        console.error(
          "Failed to accept HMR update because the router/ssrInfo was not ready."
        );
        return;
      }

      let routeIds = [
        ...new Set(
          router.state.matches
            .map((m) => m.route.id)
            .concat(Object.keys(ssrInfo!.routeModules))
        ),
      ];

      hmrInfo.abortController?.abort();
      hmrInfo.abortController = new AbortController();
      let signal = hmrInfo.abortController.signal;

      // Load new route modules that we've seen.
      let newRouteModules = Object.assign(
        {},
        ssrInfo.routeModules,
        Object.fromEntries(
          (
            await Promise.all(
              routeIds.map(async (id) => {
                if (!assetsManifest.routes[id]) {
                  return null;
                }
                let imported = await import(
                  assetsManifest.routes[id].module +
                    `?t=${assetsManifest.hmr?.timestamp}`
                );
                invariant(ssrInfo, "ssrInfo unavailable for HMR update");
                return [
                  id,
                  {
                    ...imported,
                    // react-refresh takes care of updating these in-place,
                    // if we don't preserve existing values we'll loose state.
                    default: imported.default
                      ? ssrInfo.routeModules[id]?.default || imported.default
                      : imported.default,
                    ErrorBoundary: imported.ErrorBoundary
                      ? ssrInfo.routeModules[id]?.ErrorBoundary ||
                        imported.ErrorBoundary
                      : imported.ErrorBoundary,
                    HydrateFallback: imported.HydrateFallback
                      ? ssrInfo.routeModules[id]?.HydrateFallback ||
                        imported.HydrateFallback
                      : imported.HydrateFallback,
                  },
                ];
              })
            )
          ).filter(Boolean) as [string, RouteModules[string]][]
        )
      );

      Object.assign(ssrInfo.routeModules, newRouteModules);
      // Create new routes
      let routes = createClientRoutesWithHMRRevalidationOptOut(
        needsRevalidation,
        assetsManifest.routes,
        ssrInfo.routeModules,
        ssrInfo.context.state,
        ssrInfo.context.future,
        ssrInfo.context.isSpaMode
      );

      // This is temporary API and will be more granular before release
      router._internalSetRoutes(routes);

      // Wait for router to be idle before updating the manifest and route modules
      // and triggering a react-refresh
      let unsub = router.subscribe((state) => {
        if (state.revalidation === "idle") {
          unsub();
          // Abort if a new update comes in while we're waiting for the
          // router to be idle.
          if (signal.aborted) return;
          // Ensure RouterProvider setState has flushed before re-rendering
          setTimeout(() => {
            Object.assign(ssrInfo!.manifest, assetsManifest);
            window.$RefreshRuntime$!.performReactRefresh();
          }, 1);
        }
      });
      window.__remixRevalidation = (window.__remixRevalidation || 0) + 1;
      router.revalidate();
    }
  );
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Routers
////////////////////////////////////////////////////////////////////////////////

interface DOMRouterOpts {
  basename?: string;
  future?: Partial<Omit<RouterFutureConfig, "v7_prependBasename">>;
  hydrationData?: HydrationState;
  unstable_dataStrategy?: unstable_DataStrategyFunction;
  window?: Window;
}

export function createBrowserRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts
): RemixRouter {
  return createRouter({
    basename: opts?.basename,
    future: {
      ...opts?.future,
      v7_prependBasename: true,
    },
    history: createBrowserHistory({ window: opts?.window }),
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    unstable_dataStrategy: opts?.unstable_dataStrategy,
    window: opts?.window,
  }).initialize();
}

export function createHashRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts
): RemixRouter {
  return createRouter({
    basename: opts?.basename,
    future: {
      ...opts?.future,
      v7_prependBasename: true,
    },
    history: createHashHistory({ window: opts?.window }),
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    unstable_dataStrategy: opts?.unstable_dataStrategy,
    window: opts?.window,
  }).initialize();
}

function parseHydrationData(): HydrationState | undefined {
  let state = window?.__staticRouterHydrationData;
  if (state && state.errors) {
    state = {
      ...state,
      errors: deserializeErrors(state.errors),
    };
  }
  return state;
}

function deserializeErrors(
  errors: RemixRouter["state"]["errors"]
): RemixRouter["state"]["errors"] {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized: RemixRouter["state"]["errors"] = {};
  for (let [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // serializeErrors in react-router-dom/server.tsx :)
    if (val && val.__type === "RouteErrorResponse") {
      serialized[key] = new ErrorResponseImpl(
        val.status,
        val.statusText,
        val.data,
        val.internal === true
      );
    } else if (val && val.__type === "Error") {
      // Attempt to reconstruct the right type of Error (i.e., ReferenceError)
      if (val.__subType) {
        let ErrorConstructor = window[val.__subType];
        if (typeof ErrorConstructor === "function") {
          try {
            // @ts-expect-error
            let error = new ErrorConstructor(val.message);
            // Wipe away the client-side stack trace.  Nothing to fill it in with
            // because we don't serialize SSR stack traces for security reasons
            error.stack = "";
            serialized[key] = error;
          } catch (e) {
            // no-op - fall through and create a normal Error
          }
        }
      }

      if (serialized[key] == null) {
        let error = new Error(val.message);
        // Wipe away the client-side stack trace.  Nothing to fill it in with
        // because we don't serialize SSR stack traces for security reasons
        error.stack = "";
        serialized[key] = error;
      }
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Contexts
////////////////////////////////////////////////////////////////////////////////

type ViewTransitionContextObject =
  | {
      isTransitioning: false;
    }
  | {
      isTransitioning: true;
      flushSync: boolean;
      currentLocation: Location;
      nextLocation: Location;
    };

const ViewTransitionContext = React.createContext<ViewTransitionContextObject>({
  isTransitioning: false,
});
if (__DEV__) {
  ViewTransitionContext.displayName = "ViewTransition";
}

export { ViewTransitionContext as UNSAFE_ViewTransitionContext };

// TODO: (v7) Change the useFetcher data from `any` to `unknown`
type FetchersContextObject = Map<string, any>;

const FetchersContext = React.createContext<FetchersContextObject>(new Map());
if (__DEV__) {
  FetchersContext.displayName = "Fetchers";
}

export { FetchersContext as UNSAFE_FetchersContext };

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Components
////////////////////////////////////////////////////////////////////////////////

/**
  Webpack + React 17 fails to compile on any of the following because webpack
  complains that `startTransition` doesn't exist in `React`:
  * import { startTransition } from "react"
  * import * as React from from "react";
    "startTransition" in React ? React.startTransition(() => setState()) : setState()
  * import * as React from from "react";
    "startTransition" in React ? React["startTransition"](() => setState()) : setState()

  Moving it to a constant such as the following solves the Webpack/React 17 issue:
  * import * as React from from "react";
    const START_TRANSITION = "startTransition";
    START_TRANSITION in React ? React[START_TRANSITION](() => setState()) : setState()

  However, that introduces webpack/terser minification issues in production builds
  in React 18 where minification/obfuscation ends up removing the call of
  React.startTransition entirely from the first half of the ternary.  Grabbing
  this exported reference once up front resolves that issue.

  See https://github.com/remix-run/react-router/issues/10579
*/
const START_TRANSITION = "startTransition";
const startTransitionImpl = React[START_TRANSITION];
const FLUSH_SYNC = "flushSync";
const flushSyncImpl = ReactDOM[FLUSH_SYNC];
const USE_ID = "useId";
const useIdImpl = React[USE_ID];

function startTransitionSafe(cb: () => void) {
  if (startTransitionImpl) {
    startTransitionImpl(cb);
  } else {
    cb();
  }
}

function flushSyncSafe(cb: () => void) {
  if (flushSyncImpl) {
    flushSyncImpl(cb);
  } else {
    cb();
  }
}

interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

class Deferred<T> {
  status: "pending" | "resolved" | "rejected" = "pending";
  promise: Promise<T>;
  // @ts-expect-error - no initializer
  resolve: (value: T) => void;
  // @ts-expect-error - no initializer
  reject: (reason?: unknown) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value) => {
        if (this.status === "pending") {
          this.status = "resolved";
          resolve(value);
        }
      };
      this.reject = (reason) => {
        if (this.status === "pending") {
          this.status = "rejected";
          reject(reason);
        }
      };
    });
  }
}

// When using a DOM RouterProvider with SSR you don't have to specify a router
// and it can be constructed via `__remixManifest`/`__remixContext` etc.
export type RouterProviderProps = MemoryRouterProviderProps & {
  router?: RemixRouter;
};

/**
 * Given a Remix Router instance, render the appropriate UI
 */
export function RouterProvider({
  fallbackElement,
  router: propRouter,
  future,
}: RouterProviderProps): React.ReactElement {
  let router = propRouter || ssrInfo?.router;

  if (!router) {
    initSsrInfo();

    if (!ssrInfo) {
      throw new Error(
        "You must be using the SSR features of React Router in order to skip " +
          "passing a `router` prop to `<RouterProvider>`"
      );
    }

    // TODO: Do some testing to confirm it's OK to skip the hard reload check
    // now that all route.lazy stuff is wired up

    // When single fetch is enabled, we need to suspend until the initial state
    // snapshot is decoded into window.__remixContext.state
    if (ssrInfo.context.future.unstable_singleFetch) {
      let localSsrInfo = ssrInfo;
      // Note: `stateDecodingPromise` is not coupled to `router` - we'll reach this
      // code potentially many times waiting for our state to arrive, but we'll
      // then only get past here and create the `router` one time
      if (!ssrInfo.stateDecodingPromise) {
        let stream = ssrInfo.context.stream;
        invariant(stream, "No stream found for single fetch decoding");
        ssrInfo.context.stream = undefined;
        ssrInfo.stateDecodingPromise = decodeViaTurboStream(stream, window)
          .then((value) => {
            ssrInfo!.context.state =
              value.value as typeof localSsrInfo.context.state;
            localSsrInfo.stateDecodingPromise!.value = true;
          })
          .catch((e) => {
            localSsrInfo.stateDecodingPromise!.error = e;
          });
      }
      if (ssrInfo.stateDecodingPromise.error) {
        throw ssrInfo.stateDecodingPromise.error;
      }
      if (!ssrInfo.stateDecodingPromise.value) {
        throw ssrInfo.stateDecodingPromise;
      }
    }

    let routes = createClientRoutes(
      ssrInfo.manifest.routes,
      ssrInfo.routeModules,
      ssrInfo.context.state,
      ssrInfo.context.future,
      ssrInfo.context.isSpaMode
    );

    let hydrationData = undefined;
    if (!ssrInfo.context.isSpaMode) {
      // Create a shallow clone of `loaderData` we can mutate for partial hydration.
      // When a route exports a `clientLoader` and a `HydrateFallback`, the SSR will
      // render the fallback so we need the client to do the same for hydration.
      // The server loader data has already been exposed to these route `clientLoader`'s
      // in `createClientRoutes` above, so we need to clear out the version we pass to
      // `createBrowserRouter` so it initializes and runs the client loaders.
      hydrationData = {
        ...ssrInfo.context.state,
        loaderData: { ...ssrInfo.context.state.loaderData },
      };
      let initialMatches = matchRoutes(routes, window.location);
      if (initialMatches) {
        for (let match of initialMatches) {
          let routeId = match.route.id;
          let route = ssrInfo.routeModules[routeId];
          let manifestRoute = ssrInfo.manifest.routes[routeId];
          // Clear out the loaderData to avoid rendering the route component when the
          // route opted into clientLoader hydration and either:
          // * gave us a HydrateFallback
          // * or doesn't have a server loader and we have no data to render
          if (
            route &&
            shouldHydrateRouteLoader(
              manifestRoute,
              route,
              ssrInfo.context.isSpaMode
            ) &&
            (route.HydrateFallback || !manifestRoute.hasLoader)
          ) {
            hydrationData.loaderData[routeId] = undefined;
          } else if (manifestRoute && !manifestRoute.hasLoader) {
            // Since every Remix route gets a `loader` on the client side to load
            // the route JS module, we need to add a `null` value to `loaderData`
            // for any routes that don't have server loaders so our partial
            // hydration logic doesn't kick off the route module loaders during
            // hydration
            hydrationData.loaderData[routeId] = null;
          }
        }
      }

      if (hydrationData && hydrationData.errors) {
        hydrationData.errors = deserializeErrors(hydrationData.errors);
      }
    }

    // We don't use createBrowserRouter here because we need fine-grained control
    // over initialization to support synchronous `clientLoader` flows.
    ssrInfo.router = router = createRouter({
      routes,
      history: createBrowserHistory(),
      basename: ssrInfo.context.basename,
      future: {
        v7_normalizeFormMethod: true,
        v7_fetcherPersist: ssrInfo.context.future.v3_fetcherPersist,
        v7_partialHydration: true,
        v7_prependBasename: true,
        v7_relativeSplatPath: ssrInfo.context.future.v3_relativeSplatPath,
        // Single fetch enables this underlying behavior
        unstable_skipActionErrorRevalidation:
          ssrInfo.context.future.unstable_singleFetch === true,
      },
      hydrationData,
      mapRouteProperties,
      unstable_dataStrategy: ssrInfo.context.future.unstable_singleFetch
        ? getSingleFetchDataStrategy(ssrInfo.manifest, ssrInfo.routeModules)
        : undefined,
    });

    // We can call initialize() immediately if the router doesn't have any
    // loaders to run on hydration
    if (router.state.initialized) {
      ssrInfo.routerInitialized = true;
      router.initialize();
    }

    // @ts-ignore
    router.createRoutesForHMR = createClientRoutesWithHMRRevalidationOptOut;
    window.__remixRouter = router;

    // Notify that the router is ready for HMR
    hmrInfo?.routerReadyResolve(router);
  }

  // SSR State

  // Critical CSS can become stale after code changes, e.g. styles might be
  // removed from a component, but the styles will still be present in the
  // server HTML. This allows our HMR logic to clear the critical CSS state.
  let [criticalCss, setCriticalCss] = React.useState(
    process.env.NODE_ENV === "development"
      ? ssrInfo?.context.criticalCss
      : undefined
  );
  if (process.env.NODE_ENV === "development") {
    if (ssrInfo) {
      window.__remixClearCriticalCss = () => setCriticalCss(undefined);
    }
  }

  // This is due to the short circuit return above when the pathname doesn't
  // match and we force a hard reload.  This is an exceptional scenario in which
  // we can't hydrate anyway.
  let [location, setLocation] = React.useState(router.state.location);

  React.useLayoutEffect(() => {
    // If we had to run clientLoaders on hydration, we delay initialization until
    // after we've hydrated to avoid hydration issues from synchronous client loaders
    if (ssrInfo && ssrInfo.router && !ssrInfo.routerInitialized) {
      ssrInfo.routerInitialized = true;
      ssrInfo.router.initialize();
    }
  }, []);

  React.useLayoutEffect(() => {
    if (ssrInfo && ssrInfo.router) {
      return ssrInfo.router.subscribe((newState) => {
        if (newState.location !== location) {
          setLocation(newState.location);
        }
      });
    }
  }, [location]);

  // SPA State
  let [state, setStateImpl] = React.useState(router.state);
  let [pendingState, setPendingState] = React.useState<RouterState>();
  let [vtContext, setVtContext] = React.useState<ViewTransitionContextObject>({
    isTransitioning: false,
  });
  let [renderDfd, setRenderDfd] = React.useState<Deferred<void>>();
  let [transition, setTransition] = React.useState<ViewTransition>();
  let [interruption, setInterruption] = React.useState<{
    state: RouterState;
    currentLocation: Location;
    nextLocation: Location;
  }>();
  let fetcherData = React.useRef<Map<string, any>>(new Map());
  let { v7_startTransition } = future || {};

  let optInStartTransition = React.useCallback(
    (cb: () => void) => {
      if (v7_startTransition) {
        startTransitionSafe(cb);
      } else {
        cb();
      }
    },
    [v7_startTransition]
  );

  let setState = React.useCallback<RouterSubscriber>(
    (
      newState: RouterState,
      {
        deletedFetchers,
        unstable_flushSync: flushSync,
        unstable_viewTransitionOpts: viewTransitionOpts,
      }
    ) => {
      deletedFetchers.forEach((key) => fetcherData.current.delete(key));
      newState.fetchers.forEach((fetcher, key) => {
        if (fetcher.data !== undefined) {
          fetcherData.current.set(key, fetcher.data);
        }
      });

      let isViewTransitionUnavailable =
        router.window == null ||
        typeof router.window.document.startViewTransition !== "function";

      // If this isn't a view transition or it's not available in this browser,
      // just update and be done with it
      if (!viewTransitionOpts || isViewTransitionUnavailable) {
        if (flushSync) {
          flushSyncSafe(() => setStateImpl(newState));
        } else {
          optInStartTransition(() => setStateImpl(newState));
        }
        return;
      }

      // flushSync + startViewTransition
      if (flushSync) {
        // Flush through the context to mark DOM elements as transition=ing
        flushSyncSafe(() => {
          // Cancel any pending transitions
          if (transition) {
            renderDfd && renderDfd.resolve();
            transition.skipTransition();
          }
          setVtContext({
            isTransitioning: true,
            flushSync: true,
            currentLocation: viewTransitionOpts.currentLocation,
            nextLocation: viewTransitionOpts.nextLocation,
          });
        });

        // Update the DOM
        let t = router.window!.document.startViewTransition(() => {
          flushSyncSafe(() => setStateImpl(newState));
        });

        // Clean up after the animation completes
        t.finished.finally(() => {
          flushSyncSafe(() => {
            setRenderDfd(undefined);
            setTransition(undefined);
            setPendingState(undefined);
            setVtContext({ isTransitioning: false });
          });
        });

        flushSyncSafe(() => setTransition(t));
        return;
      }

      // startTransition + startViewTransition
      if (transition) {
        // Interrupting an in-progress transition, cancel and let everything flush
        // out, and then kick off a new transition from the interruption state
        renderDfd && renderDfd.resolve();
        transition.skipTransition();
        setInterruption({
          state: newState,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      } else {
        // Completed navigation update with opted-in view transitions, let 'er rip
        setPendingState(newState);
        setVtContext({
          isTransitioning: true,
          flushSync: false,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      }
    },
    [router.window, transition, renderDfd, fetcherData, optInStartTransition]
  );

  // Need to use a layout effect here so we are subscribed early enough to
  // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
  React.useLayoutEffect(() => router.subscribe(setState), [router, setState]);

  // When we start a view transition, create a Deferred we can use for the
  // eventual "completed" render
  React.useEffect(() => {
    if (vtContext.isTransitioning && !vtContext.flushSync) {
      setRenderDfd(new Deferred<void>());
    }
  }, [vtContext]);

  // Once the deferred is created, kick off startViewTransition() to update the
  // DOM and then wait on the Deferred to resolve (indicating the DOM update has
  // happened)
  React.useEffect(() => {
    if (renderDfd && pendingState && router.window) {
      let newState = pendingState;
      let renderPromise = renderDfd.promise;
      let transition = router.window.document.startViewTransition(async () => {
        optInStartTransition(() => setStateImpl(newState));
        await renderPromise;
      });
      transition.finished.finally(() => {
        setRenderDfd(undefined);
        setTransition(undefined);
        setPendingState(undefined);
        setVtContext({ isTransitioning: false });
      });
      setTransition(transition);
    }
  }, [optInStartTransition, pendingState, renderDfd, router.window]);

  // When the new location finally renders and is committed to the DOM, this
  // effect will run to resolve the transition
  React.useEffect(() => {
    if (
      renderDfd &&
      pendingState &&
      state.location.key === pendingState.location.key
    ) {
      renderDfd.resolve();
    }
  }, [renderDfd, transition, state.location, pendingState]);

  // If we get interrupted with a new navigation during a transition, we skip
  // the active transition, let it cleanup, then kick it off again here
  React.useEffect(() => {
    if (!vtContext.isTransitioning && interruption) {
      setPendingState(interruption.state);
      setVtContext({
        isTransitioning: true,
        flushSync: false,
        currentLocation: interruption.currentLocation,
        nextLocation: interruption.nextLocation,
      });
      setInterruption(undefined);
    }
  }, [vtContext.isTransitioning, interruption]);

  React.useEffect(() => {
    warning(
      fallbackElement == null || !router.future.v7_partialHydration,
      "`<RouterProvider fallbackElement>` is deprecated when using " +
        "`v7_partialHydration`, use a `HydrateFallback` component instead"
    );
    // Only log this once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let navigator = React.useMemo((): Navigator => {
    return {
      createHref: router.createHref,
      encodeLocation: router.encodeLocation,
      go: (n) => router.navigate(n),
      push: (to, state, opts) =>
        router.navigate(to, {
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
      replace: (to, state, opts) =>
        router.navigate(to, {
          replace: true,
          state,
          preventScrollReset: opts?.preventScrollReset,
        }),
    };
  }, [router]);

  let basename = router.basename || "/";

  let dataRouterContext = React.useMemo(
    () => ({
      router,
      navigator,
      static: false,
      basename,
    }),
    [router, navigator, basename]
  );

  // The fragment and {null} here are important!  We need them to keep React 18's
  // useId happy when we are server-rendering since we may have a <script> here
  // containing the hydrated server-side staticContext (from StaticRouterProvider).
  // useId relies on the component tree structure to generate deterministic id's
  // so we need to ensure it remains the same on the client even though
  // we don't need the <script> tag
  let app = (
    <>
      <DataRouterContext.Provider value={dataRouterContext}>
        <DataRouterStateContext.Provider value={state}>
          <FetchersContext.Provider value={fetcherData.current}>
            <ViewTransitionContext.Provider value={vtContext}>
              <Router
                basename={basename}
                location={state.location}
                navigationType={state.historyAction}
                navigator={navigator}
                future={{
                  v7_relativeSplatPath: router.future.v7_relativeSplatPath,
                }}
              >
                {state.initialized || router.future.v7_partialHydration ? (
                  <DataRoutes
                    routes={router.routes}
                    future={router.future}
                    state={state}
                  />
                ) : (
                  fallbackElement
                )}
              </Router>
            </ViewTransitionContext.Provider>
          </FetchersContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>
      {null}
    </>
  );

  if (ssrInfo && !propRouter) {
    // We need to include a wrapper RemixErrorBoundary here in case the root error
    // boundary also throws and we need to bubble up outside of the router entirely.
    // Then we need a stateful location here so the user can back-button navigate
    // out of there
    return (
      // This fragment is important to ensure we match the <RemixServer> JSX
      // structure so that useId values hydrate correctly
      <>
        <RemixContext.Provider
          value={{
            manifest: ssrInfo.manifest,
            routeModules: ssrInfo.routeModules,
            future: ssrInfo.context.future,
            criticalCss,
            isSpaMode: ssrInfo.context.isSpaMode,
          }}
        >
          <RemixErrorBoundary location={location}>{app}</RemixErrorBoundary>
        </RemixContext.Provider>
        {/*
          This fragment is important to ensure we match the <RemixServer> JSX
          structure so that useId values hydrate correctly
        */}
        {ssrInfo.context.future.unstable_singleFetch ? <></> : null}
      </>
    );
  } else {
    return app;
  }
}

function DataRoutes({
  routes,
  future,
  state,
}: {
  routes: DataRouteObject[];
  future: RemixRouter["future"];
  state: RouterState;
}): React.ReactElement | null {
  return useRoutesImpl(routes, undefined, state, future);
}

export interface BrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  future?: Partial<RenderFutureConfig>;
  window?: Window;
}

/**
 * A `<Router>` for use in web browsers. Provides the cleanest URLs.
 */
export function BrowserRouter({
  basename,
  children,
  future,
  window,
}: BrowserRouterProps) {
  let historyRef = React.useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let { v7_startTransition } = future || {};
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      v7_startTransition && startTransitionImpl
        ? startTransitionImpl(() => setStateImpl(newState))
        : setStateImpl(newState);
    },
    [setStateImpl, v7_startTransition]
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
      future={future}
    />
  );
}

export interface HashRouterProps {
  basename?: string;
  children?: React.ReactNode;
  future?: Partial<RenderFutureConfig>;
  window?: Window;
}

/**
 * A `<Router>` for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */
export function HashRouter({
  basename,
  children,
  future,
  window,
}: HashRouterProps) {
  let historyRef = React.useRef<HashHistory>();
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let { v7_startTransition } = future || {};
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      v7_startTransition && startTransitionImpl
        ? startTransitionImpl(() => setStateImpl(newState))
        : setStateImpl(newState);
    },
    [setStateImpl, v7_startTransition]
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
      future={future}
    />
  );
}

export interface HistoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  future?: RenderFutureConfig;
  history: History;
}

/**
 * A `<Router>` that accepts a pre-instantiated history object. It's important
 * to note that using your own history object is highly discouraged and may add
 * two versions of the history library to your bundles unless you use the same
 * version of the history library that React Router uses internally.
 */
function HistoryRouter({
  basename,
  children,
  future,
  history,
}: HistoryRouterProps) {
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let { v7_startTransition } = future || {};
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      v7_startTransition && startTransitionImpl
        ? startTransitionImpl(() => setStateImpl(newState))
        : setStateImpl(newState);
    },
    [setStateImpl, v7_startTransition]
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
      future={future}
    />
  );
}

if (__DEV__) {
  HistoryRouter.displayName = "unstable_HistoryRouter";
}

export { HistoryRouter as unstable_HistoryRouter };

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  prefetch?: PrefetchBehavior;
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
  relative?: RelativeRoutingType;
  to: To;
  unstable_viewTransition?: boolean;
}

const isBrowser =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined";

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * The public API for rendering a history-aware `<a>`.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    {
      onClick,
      prefetch = "none",
      relative,
      reloadDocument,
      replace,
      state,
      target,
      to,
      preventScrollReset,
      unstable_viewTransition,
      ...rest
    },
    forwardedRef
  ) {
    let { basename } = React.useContext(NavigationContext);
    let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX.test(to);

    // Rendered into <a href> for absolute URLs
    let absoluteHref;
    let isExternal = false;

    if (typeof to === "string" && isAbsolute) {
      // Render the absolute href server- and client-side
      absoluteHref = to;

      // Only check for external origins client-side
      if (isBrowser) {
        try {
          let currentUrl = new URL(window.location.href);
          let targetUrl = to.startsWith("//")
            ? new URL(currentUrl.protocol + to)
            : new URL(to);
          let path = stripBasename(targetUrl.pathname, basename);

          if (targetUrl.origin === currentUrl.origin && path != null) {
            // Strip the protocol/origin/basename for same-origin absolute URLs
            to = path + targetUrl.search + targetUrl.hash;
          } else {
            isExternal = true;
          }
        } catch (e) {
          // We can't do external URL detection without a valid URL
          warning(
            false,
            `<Link to="${to}"> contains an invalid URL which will probably break ` +
              `when clicked - please update to a valid URL path.`
          );
        }
      }
    }

    // Rendered into <a href> for relative URLs
    let href = useHref(to, { relative });
    let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(
      prefetch,
      rest
    );

    let internalOnClick = useLinkClickHandler(to, {
      replace,
      state,
      target,
      preventScrollReset,
      relative,
      unstable_viewTransition,
    });
    function handleClick(
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        internalOnClick(event);
      }
    }

    let link = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        {...rest}
        {...prefetchHandlers}
        href={absoluteHref || href}
        onClick={isExternal || reloadDocument ? onClick : handleClick}
        ref={mergeRefs(forwardedRef, prefetchRef)}
        target={target}
      />
    );

    return shouldPrefetch && !isAbsolute ? (
      <>
        {link}
        <PrefetchPageLinks page={href} />
      </>
    ) : (
      link
    );
  }
);

if (__DEV__) {
  Link.displayName = "Link";
}

type NavLinkRenderProps = {
  isActive: boolean;
  isPending: boolean;
  isTransitioning: boolean;
};

export interface NavLinkProps
  extends Omit<LinkProps, "className" | "style" | "children"> {
  children?: React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode);
  caseSensitive?: boolean;
  className?: string | ((props: NavLinkRenderProps) => string | undefined);
  end?: boolean;
  style?:
    | React.CSSProperties
    | ((props: NavLinkRenderProps) => React.CSSProperties | undefined);
}

/**
 * A `<Link>` wrapper that knows if it's "active" or not.
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLinkWithRef(
    {
      "aria-current": ariaCurrentProp = "page",
      caseSensitive = false,
      className: classNameProp = "",
      end = false,
      style: styleProp,
      to,
      unstable_viewTransition,
      children,
      ...rest
    },
    ref
  ) {
    let path = useResolvedPath(to, { relative: rest.relative });
    let location = useLocation();
    let routerState = React.useContext(DataRouterStateContext);
    let { navigator, basename } = React.useContext(NavigationContext);
    let isTransitioning =
      routerState != null &&
      // Conditional usage is OK here because the usage of a data router is static
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useViewTransitionState(path) &&
      unstable_viewTransition === true;

    let toPathname = navigator.encodeLocation
      ? navigator.encodeLocation(path).pathname
      : path.pathname;
    let locationPathname = location.pathname;
    let nextLocationPathname =
      routerState && routerState.navigation && routerState.navigation.location
        ? routerState.navigation.location.pathname
        : null;

    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      nextLocationPathname = nextLocationPathname
        ? nextLocationPathname.toLowerCase()
        : null;
      toPathname = toPathname.toLowerCase();
    }

    if (nextLocationPathname && basename) {
      nextLocationPathname =
        stripBasename(nextLocationPathname, basename) || nextLocationPathname;
    }

    // If the `to` has a trailing slash, look at that exact spot.  Otherwise,
    // we're looking for a slash _after_ what's in `to`.  For example:
    //
    // <NavLink to="/users"> and <NavLink to="/users/">
    // both want to look for a / at index 6 to match URL `/users/matt`
    const endSlashPosition =
      toPathname !== "/" && toPathname.endsWith("/")
        ? toPathname.length - 1
        : toPathname.length;
    let isActive =
      locationPathname === toPathname ||
      (!end &&
        locationPathname.startsWith(toPathname) &&
        locationPathname.charAt(endSlashPosition) === "/");

    let isPending =
      nextLocationPathname != null &&
      (nextLocationPathname === toPathname ||
        (!end &&
          nextLocationPathname.startsWith(toPathname) &&
          nextLocationPathname.charAt(toPathname.length) === "/"));

    let renderProps = {
      isActive,
      isPending,
      isTransitioning,
    };

    let ariaCurrent = isActive ? ariaCurrentProp : undefined;

    let className: string | undefined;
    if (typeof classNameProp === "function") {
      className = classNameProp(renderProps);
    } else {
      // If the className prop is not a function, we use a default `active`
      // class for <NavLink />s that are active. In v5 `active` was the default
      // value for `activeClassName`, but we are removing that API and can still
      // use the old default behavior for a cleaner upgrade path and keep the
      // simple styling rules working as they currently do.
      className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
        isTransitioning ? "transitioning" : null,
      ]
        .filter(Boolean)
        .join(" ");
    }

    let style =
      typeof styleProp === "function" ? styleProp(renderProps) : styleProp;

    return (
      <Link
        {...rest}
        aria-current={ariaCurrent}
        className={className}
        ref={ref}
        style={style}
        to={to}
        unstable_viewTransition={unstable_viewTransition}
      >
        {typeof children === "function" ? children(renderProps) : children}
      </Link>
    );
  }
);

if (__DEV__) {
  NavLink.displayName = "NavLink";
}

export interface FetcherFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * The HTTP verb to use when the form is submit. Supports "get", "post",
   * "put", "delete", "patch".
   */
  method?: HTMLFormMethod;

  /**
   * `<form encType>` - enhancing beyond the normal string type and limiting
   * to the built-in browser supported values
   */
  encType?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";

  /**
   * Normal `<form action>` but supports React Router's relative paths.
   */
  action?: string;

  /**
   * Determines whether the form action is relative to the route hierarchy or
   * the pathname.  Use this if you want to opt out of navigating the route
   * hierarchy and want to instead route based on /-delimited URL segments
   */
  relative?: RelativeRoutingType;

  /**
   * Prevent the scroll position from resetting to the top of the viewport on
   * completion of the navigation when using the <ScrollRestoration> component
   */
  preventScrollReset?: boolean;

  /**
   * A function to call when the form is submitted. If you call
   * `event.preventDefault()` then this form will not do anything.
   */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

export interface FormProps extends FetcherFormProps {
  /**
   * Indicate a specific fetcherKey to use when using navigate=false
   */
  fetcherKey?: string;

  /**
   * navigate=false will use a fetcher instead of a navigation
   */
  navigate?: boolean;

  /**
   * Forces a full document navigation instead of a fetch.
   */
  reloadDocument?: boolean;

  /**
   * Replaces the current entry in the browser history stack when the form
   * navigates. Use this if you don't want the user to be able to click "back"
   * to the page with the form on it.
   */
  replace?: boolean;

  /**
   * State object to add to the history stack entry for this navigation
   */
  state?: any;

  /**
   * Enable view transitions on this Form navigation
   */
  unstable_viewTransition?: boolean;
}

type HTMLSubmitEvent = React.BaseSyntheticEvent<
  SubmitEvent,
  Event,
  HTMLFormElement
>;

type HTMLFormSubmitter = HTMLButtonElement | HTMLInputElement;

/**
 * A `@remix-run/router`-aware `<form>`. It behaves like a normal form except
 * that the interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      fetcherKey,
      navigate,
      reloadDocument,
      replace,
      state,
      method = defaultMethod,
      action,
      onSubmit,
      relative,
      preventScrollReset,
      unstable_viewTransition,
      ...props
    },
    forwardedRef
  ) => {
    let submit = useSubmit();
    let formAction = useFormAction(action, { relative });
    let formMethod: HTMLFormMethod =
      method.toLowerCase() === "get" ? "get" : "post";

    let submitHandler: React.FormEventHandler<HTMLFormElement> = (event) => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();

      let submitter = (event as unknown as HTMLSubmitEvent).nativeEvent
        .submitter as HTMLFormSubmitter | null;

      let submitMethod =
        (submitter?.getAttribute("formmethod") as HTMLFormMethod | undefined) ||
        method;

      submit(submitter || event.currentTarget, {
        fetcherKey,
        method: submitMethod,
        navigate,
        replace,
        state,
        relative,
        preventScrollReset,
        unstable_viewTransition,
      });
    };

    return (
      <form
        ref={forwardedRef}
        method={formMethod}
        action={formAction}
        onSubmit={reloadDocument ? onSubmit : submitHandler}
        {...props}
      />
    );
  }
);

if (__DEV__) {
  Form.displayName = "Form";
}

export type ScrollRestorationProps = ScriptProps & {
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
};

/**
 * This component will emulate the browser's scroll restoration on location
 * changes.
 */
export function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}: ScrollRestorationProps) {
  let remixContext = React.useContext(RemixContext);
  let { basename } = React.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  useScrollRestoration({ getKey, storageKey });

  // In order to support `getKey`, we need to compute a "key" here so we can
  // hydrate that up so that SSR scroll restoration isn't waiting on React to
  // hydrate. *However*, our key on the server is not the same as our key on
  // the client!  So if the user's getKey implementation returns the SSR
  // location key, then let's ignore it and let our inline <script> below pick
  // up the client side history state key
  let ssrKey = React.useMemo(
    () => {
      if (!remixContext || !getKey) return null;
      let userKey = getScrollRestorationKey(
        location,
        matches,
        basename,
        getKey
      );
      return userKey !== location.key ? userKey : null;
    },
    // Nah, we only need this the first time for the SSR render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // In SPA Mode, there's nothing to restore on initial render since we didn't
  // render anything on the server
  if (!remixContext || remixContext.isSpaMode) {
    return null;
  }

  let restoreScroll = ((storageKey: string, restoreKey: string) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error: unknown) {
      console.error(error);
      sessionStorage.removeItem(storageKey);
    }
  }).toString();

  return (
    <script
      {...props}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${restoreScroll})(${JSON.stringify(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY
        )}, ${JSON.stringify(ssrKey)})`,
      }}
    />
  );
}

if (__DEV__) {
  ScrollRestoration.displayName = "ScrollRestoration";
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Hooks
////////////////////////////////////////////////////////////////////////////////

enum DataRouterHook {
  UseScrollRestoration = "useScrollRestoration",
  UseSubmit = "useSubmit",
  UseSubmitFetcher = "useSubmitFetcher",
  UseFetcher = "useFetcher",
  useViewTransitionState = "useViewTransitionState",
}

enum DataRouterStateHook {
  UseFetcher = "useFetcher",
  UseFetchers = "useFetchers",
  UseScrollRestoration = "useScrollRestoration",
}

// Internal hooks

function getDataRouterConsoleError(
  hookName: DataRouterHook | DataRouterStateHook
) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/routers/picking-a-router.`;
}

function useDataRouterContext(hookName: DataRouterHook) {
  let ctx = React.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError(hookName));
  return ctx;
}

function useDataRouterState(hookName: DataRouterStateHook) {
  let state = React.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError(hookName));
  return state;
}

// External hooks

/**
 * Handles the click behavior for router `<Link>` components. This is useful if
 * you need to create custom `<Link>` components with the same click behavior we
 * use in our exported `<Link>`.
 */
export function useLinkClickHandler<E extends Element = HTMLAnchorElement>(
  to: To,
  {
    target,
    replace: replaceProp,
    state,
    preventScrollReset,
    relative,
    unstable_viewTransition,
  }: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: any;
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    unstable_viewTransition?: boolean;
  } = {}
): (event: React.MouseEvent<E, MouseEvent>) => void {
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to, { relative });

  return React.useCallback(
    (event: React.MouseEvent<E, MouseEvent>) => {
      if (shouldProcessLinkClick(event, target)) {
        event.preventDefault();

        // If the URL hasn't changed, a regular <a> will do a replace instead of
        // a push, so do the same here unless the replace prop is explicitly set
        let replace =
          replaceProp !== undefined
            ? replaceProp
            : createPath(location) === createPath(path);

        navigate(to, {
          replace,
          state,
          preventScrollReset,
          relative,
          unstable_viewTransition,
        });
      }
    },
    [
      location,
      navigate,
      path,
      replaceProp,
      state,
      target,
      to,
      preventScrollReset,
      relative,
      unstable_viewTransition,
    ]
  );
}

/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(
  defaultInit?: URLSearchParamsInit
): [URLSearchParams, SetURLSearchParams] {
  warning(
    typeof URLSearchParams !== "undefined",
    `You cannot use the \`useSearchParams\` hook in a browser that does not ` +
      `support the URLSearchParams API. If you need to support Internet ` +
      `Explorer 11, we recommend you load a polyfill such as ` +
      `https://github.com/ungap/url-search-params\n\n` +
      `If you're unsure how to load polyfills, we recommend you check out ` +
      `https://polyfill.io/v3/ which provides some recommendations about how ` +
      `to load polyfills only for users that need them, instead of for every ` +
      `user.`
  );

  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));
  let hasSetSearchParamsRef = React.useRef(false);

  let location = useLocation();
  let searchParams = React.useMemo(
    () =>
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      getSearchParamsForLocation(
        location.search,
        hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current
      ),
    [location.search]
  );

  let navigate = useNavigate();
  let setSearchParams = React.useCallback<SetURLSearchParams>(
    (nextInit, navigateOptions) => {
      const newSearchParams = createSearchParams(
        typeof nextInit === "function" ? nextInit(searchParams) : nextInit
      );
      hasSetSearchParamsRef.current = true;
      navigate("?" + newSearchParams, navigateOptions);
    },
    [navigate, searchParams]
  );

  return [searchParams, setSearchParams];
}

export type SetURLSearchParams = (
  nextInit?:
    | URLSearchParamsInit
    | ((prev: URLSearchParams) => URLSearchParamsInit),
  navigateOpts?: NavigateOptions
) => void;

/**
 * Submits a HTML `<form>` to the server without reloading the page.
 */
export interface SubmitFunction {
  (
    /**
     * Specifies the `<form>` to be submitted to the server, a specific
     * `<button>` or `<input type="submit">` to use to submit the form, or some
     * arbitrary data to submit.
     *
     * Note: When using a `<button>` its `name` and `value` will also be
     * included in the form data that is submitted.
     */
    target: SubmitTarget,

    /**
     * Options that override the `<form>`'s own attributes. Required when
     * submitting arbitrary data without a backing `<form>`.
     */
    options?: SubmitOptions
  ): void;
}

/**
 * Submits a fetcher `<form>` to the server without reloading the page.
 */
export interface FetcherSubmitFunction {
  (
    target: SubmitTarget,
    // Fetchers cannot replace or set state because they are not navigation events
    options?: Omit<SubmitOptions, "replace" | "state">
  ): void;
}

function validateClientSideSubmission() {
  if (typeof document === "undefined") {
    throw new Error(
      "You are calling submit during the server render. " +
        "Try calling submit within a `useEffect` or callback instead."
    );
  }
}

let fetcherId = 0;
let getUniqueFetcherId = () => `__${String(++fetcherId)}__`;

/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 */
export function useSubmit(): SubmitFunction {
  let { router } = useDataRouterContext(DataRouterHook.UseSubmit);
  let { basename } = React.useContext(NavigationContext);
  let currentRouteId = useRouteId();

  return React.useCallback<SubmitFunction>(
    (target, options = {}) => {
      validateClientSideSubmission();

      let { action, method, encType, formData, body } = getFormSubmissionInfo(
        target,
        basename
      );

      if (options.navigate === false) {
        let key = options.fetcherKey || getUniqueFetcherId();
        router.fetch(key, currentRouteId, options.action || action, {
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || (method as HTMLFormMethod),
          formEncType: options.encType || (encType as FormEncType),
          unstable_flushSync: options.unstable_flushSync,
        });
      } else {
        router.navigate(options.action || action, {
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || (method as HTMLFormMethod),
          formEncType: options.encType || (encType as FormEncType),
          replace: options.replace,
          state: options.state,
          fromRouteId: currentRouteId,
          unstable_flushSync: options.unstable_flushSync,
          unstable_viewTransition: options.unstable_viewTransition,
        });
      }
    },
    [router, basename, currentRouteId]
  );
}

// v7: Eventually we should deprecate this entirely in favor of using the
// router method directly?
export function useFormAction(
  action?: string,
  { relative }: { relative?: RelativeRoutingType } = {}
): string {
  let { basename } = React.useContext(NavigationContext);
  let routeContext = React.useContext(RouteContext);
  invariant(routeContext, "useFormAction must be used inside a RouteContext");

  let [match] = routeContext.matches.slice(-1);
  // Shallow clone path so we can modify it below, otherwise we modify the
  // object referenced by useMemo inside useResolvedPath
  let path = { ...useResolvedPath(action ? action : ".", { relative }) };

  // If no action was specified, browsers will persist current search params
  // when determining the path, so match that behavior
  // https://github.com/remix-run/remix/issues/927
  let location = useLocation();
  if (action == null) {
    // Safe to write to this directly here since if action was undefined, we
    // would have called useResolvedPath(".") which will never include a search
    path.search = location.search;

    // When grabbing search params from the URL, remove any included ?index param
    // since it might not apply to our contextual route.  We add it back based
    // on match.route.index below
    let params = new URLSearchParams(path.search);
    if (params.has("index") && params.get("index") === "") {
      params.delete("index");
      path.search = params.toString() ? `?${params.toString()}` : "";
    }
  }

  if ((!action || action === ".") && match.route.index) {
    path.search = path.search
      ? path.search.replace(/^\?/, "?index&")
      : "?index";
  }

  // If we're operating within a basename, prepend it to the pathname prior
  // to creating the form action.  If this is a root navigation, then just use
  // the raw basename which allows the basename to have full control over the
  // presence of a trailing slash on root actions
  if (basename !== "/") {
    path.pathname =
      path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }

  return createPath(path);
}

export type FetcherWithComponents<TData> = Fetcher<TData> & {
  Form: React.ForwardRefExoticComponent<
    FetcherFormProps & React.RefAttributes<HTMLFormElement>
  >;
  submit: FetcherSubmitFunction;
  load: (href: string, opts?: { unstable_flushSync?: boolean }) => void;
};

// TODO: (v7) Change the useFetcher generic default from `any` to `unknown`

/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 */
export function useFetcher<TData = any>({
  key,
}: { key?: string } = {}): FetcherWithComponents<TData> {
  let { router } = useDataRouterContext(DataRouterHook.UseFetcher);
  let state = useDataRouterState(DataRouterStateHook.UseFetcher);
  let fetcherData = React.useContext(FetchersContext);
  let route = React.useContext(RouteContext);
  let routeId = route.matches[route.matches.length - 1]?.route.id;

  invariant(fetcherData, `useFetcher must be used inside a FetchersContext`);
  invariant(route, `useFetcher must be used inside a RouteContext`);
  invariant(
    routeId != null,
    `useFetcher can only be used on routes that contain a unique "id"`
  );

  // Fetcher key handling
  // OK to call conditionally to feature detect `useId`
  // eslint-disable-next-line react-hooks/rules-of-hooks
  let defaultKey = useIdImpl ? useIdImpl() : "";
  let [fetcherKey, setFetcherKey] = React.useState<string>(key || defaultKey);
  if (key && key !== fetcherKey) {
    setFetcherKey(key);
  } else if (!fetcherKey) {
    // We will only fall through here when `useId` is not available
    setFetcherKey(getUniqueFetcherId());
  }

  // Registration/cleanup
  React.useEffect(() => {
    router.getFetcher(fetcherKey);
    return () => {
      // Tell the router we've unmounted - if v7_fetcherPersist is enabled this
      // will not delete immediately but instead queue up a delete after the
      // fetcher returns to an `idle` state
      router.deleteFetcher(fetcherKey);
    };
  }, [router, fetcherKey]);

  // Fetcher additions
  let load = React.useCallback(
    (href: string, opts?: { unstable_flushSync?: boolean }) => {
      invariant(routeId, "No routeId available for fetcher.load()");
      router.fetch(fetcherKey, routeId, href, opts);
    },
    [fetcherKey, routeId, router]
  );

  let submitImpl = useSubmit();
  let submit = React.useCallback<FetcherSubmitFunction>(
    (target, opts) => {
      submitImpl(target, {
        ...opts,
        navigate: false,
        fetcherKey,
      });
    },
    [fetcherKey, submitImpl]
  );

  let FetcherForm = React.useMemo(() => {
    let FetcherForm = React.forwardRef<HTMLFormElement, FetcherFormProps>(
      (props, ref) => {
        return (
          <Form {...props} navigate={false} fetcherKey={fetcherKey} ref={ref} />
        );
      }
    );
    if (__DEV__) {
      FetcherForm.displayName = "fetcher.Form";
    }
    return FetcherForm;
  }, [fetcherKey]);

  // Exposed FetcherWithComponents
  let fetcher = state.fetchers.get(fetcherKey) || IDLE_FETCHER;
  let data = fetcherData.get(fetcherKey);
  let fetcherWithComponents = React.useMemo(
    () => ({
      Form: FetcherForm,
      submit,
      load,
      ...fetcher,
      data,
    }),
    [FetcherForm, submit, load, fetcher, data]
  );

  return fetcherWithComponents;
}

/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 */
export function useFetchers(): (Fetcher & { key: string })[] {
  let state = useDataRouterState(DataRouterStateHook.UseFetchers);
  return Array.from(state.fetchers.entries()).map(([key, fetcher]) => ({
    ...fetcher,
    key,
  }));
}

const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
let savedScrollPositions: Record<string, number> = {};

function getScrollRestorationKey(
  location: Location,
  matches: UIMatch[],
  basename: string,
  getKey?: GetScrollRestorationKeyFunction
) {
  let key: string | null = null;
  if (getKey) {
    if (basename !== "/") {
      key = getKey(
        {
          ...location,
          pathname:
            stripBasename(location.pathname, basename) || location.pathname,
        },
        matches
      );
    } else {
      key = getKey(location, matches);
    }
  }
  if (key == null) {
    key = location.key;
  }
  return key;
}

/**
 * When rendered inside a RouterProvider, will restore scroll positions on navigations
 */
function useScrollRestoration({
  getKey,
  storageKey,
}: {
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
} = {}) {
  let { router } = useDataRouterContext(DataRouterHook.UseScrollRestoration);
  let { restoreScrollPosition, preventScrollReset } = useDataRouterState(
    DataRouterStateHook.UseScrollRestoration
  );
  let { basename } = React.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  let navigation = useNavigation();

  // Trigger manual scroll restoration while we're active
  React.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);

  // Save positions on pagehide
  usePageHide(
    React.useCallback(() => {
      if (navigation.state === "idle") {
        let key = getScrollRestorationKey(location, matches, basename, getKey);
        savedScrollPositions[key] = window.scrollY;
      }
      try {
        sessionStorage.setItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
          JSON.stringify(savedScrollPositions)
        );
      } catch (error) {
        warning(
          false,
          `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`
        );
      }
      window.history.scrollRestoration = "auto";
    }, [navigation.state, getKey, basename, location, matches, storageKey])
  );

  // Read in any saved scroll locations
  if (typeof document !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY
        );
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {
        // no-op, use default empty object
      }
    }, [storageKey]);

    // Enable scroll restoration in the router
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      let disableScrollRestoration = router?.enableScrollRestoration(
        savedScrollPositions,
        () => window.scrollY,
        getKey
          ? (location, matches) =>
              getScrollRestorationKey(location, matches, basename, getKey)
          : undefined
      );
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);

    // Restore scrolling when state.restoreScrollPosition changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      // Explicit false means don't do anything (used for submissions)
      if (restoreScrollPosition === false) {
        return;
      }

      // been here before, scroll to it
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }

      // try to scroll to the hash
      if (location.hash) {
        let el = document.getElementById(
          decodeURIComponent(location.hash.slice(1))
        );
        if (el) {
          el.scrollIntoView();
          return;
        }
      }

      // Don't reset if this navigation opted out
      if (preventScrollReset === true) {
        return;
      }

      // otherwise go to the top on new locations
      window.scrollTo(0, 0);
    }, [location, restoreScrollPosition, preventScrollReset]);
  }
}

export { useScrollRestoration as UNSAFE_useScrollRestoration };

/**
 * Setup a callback to be fired on the window's `beforeunload` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 */
export function useBeforeUnload(
  callback: (event: BeforeUnloadEvent) => any,
  options?: { capture?: boolean }
): void {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : undefined;
    window.addEventListener("beforeunload", callback, opts);
    return () => {
      window.removeEventListener("beforeunload", callback, opts);
    };
  }, [callback, capture]);
}

/**
 * Setup a callback to be fired on the window's `pagehide` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes.  This event is better supported than beforeunload across browsers.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 */
function usePageHide(
  callback: (event: PageTransitionEvent) => any,
  options?: { capture?: boolean }
): void {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : undefined;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}

/**
 * Wrapper around useBlocker to show a window.confirm prompt to users instead
 * of building a custom UI with useBlocker.
 *
 * Warning: This has *a lot of rough edges* and behaves very differently (and
 * very incorrectly in some cases) across browsers if user click addition
 * back/forward navigations while the confirm is open.  Use at your own risk.
 */
function usePrompt({
  when,
  message,
}: {
  when: boolean | BlockerFunction;
  message: string;
}) {
  let blocker = useBlocker(when);

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      let proceed = window.confirm(message);
      if (proceed) {
        // This timeout is needed to avoid a weird "race" on POP navigations
        // between the `window.history` revert navigation and the result of
        // `window.confirm`
        setTimeout(blocker.proceed, 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  React.useEffect(() => {
    if (blocker.state === "blocked" && !when) {
      blocker.reset();
    }
  }, [blocker, when]);
}

export { usePrompt as unstable_usePrompt };

/**
 * Return a boolean indicating if there is an active view transition to the
 * given href.  You can use this value to render CSS classes or viewTransitionName
 * styles onto your elements
 *
 * @param href The destination href
 * @param [opts.relative] Relative routing type ("route" | "path")
 */
function useViewTransitionState(
  to: To,
  opts: { relative?: RelativeRoutingType } = {}
) {
  let vtContext = React.useContext(ViewTransitionContext);

  invariant(
    vtContext != null,
    "`unstable_useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  " +
      "Did you accidentally import `RouterProvider` from `react-router`?"
  );

  let { basename } = useDataRouterContext(
    DataRouterHook.useViewTransitionState
  );
  let path = useResolvedPath(to, { relative: opts.relative });
  if (!vtContext.isTransitioning) {
    return false;
  }

  let currentPath =
    stripBasename(vtContext.currentLocation.pathname, basename) ||
    vtContext.currentLocation.pathname;
  let nextPath =
    stripBasename(vtContext.nextLocation.pathname, basename) ||
    vtContext.nextLocation.pathname;

  // Transition is active if we're going to or coming from the indicated
  // destination.  This ensures that other PUSH navigations that reverse
  // an indicated transition apply.  I.e., on the list view you have:
  //
  //   <NavLink to="/details/1" unstable_viewTransition>
  //
  // If you click the breadcrumb back to the list view:
  //
  //   <NavLink to="/list" unstable_viewTransition>
  //
  // We should apply the transition because it's indicated as active going
  // from /list -> /details/1 and therefore should be active on the reverse
  // (even though this isn't strictly a POP reverse)
  return (
    matchPath(path.pathname, nextPath) != null ||
    matchPath(path.pathname, currentPath) != null
  );
}

export { useViewTransitionState as unstable_useViewTransitionState };

//#endregion
