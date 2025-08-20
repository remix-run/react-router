import * as React from "react";

import type {
  UNSAFE_AssetsManifest as AssetsManifest,
  UNSAFE_RouteModules as RouteModules,
  DataRouter,
  HydrationState,
  RouterInit,
  unstable_ClientOnErrorFunction,
} from "react-router";
import {
  UNSAFE_getHydrationData as getHydrationData,
  UNSAFE_invariant as invariant,
  UNSAFE_FrameworkContext as FrameworkContext,
  UNSAFE_decodeViaTurboStream as decodeViaTurboStream,
  UNSAFE_RemixErrorBoundary as RemixErrorBoundary,
  UNSAFE_createBrowserHistory as createBrowserHistory,
  UNSAFE_createClientRoutes as createClientRoutes,
  UNSAFE_createRouter as createRouter,
  UNSAFE_deserializeErrors as deserializeErrors,
  UNSAFE_getTurboStreamSingleFetchDataStrategy as getTurboStreamSingleFetchDataStrategy,
  UNSAFE_getPatchRoutesOnNavigationFunction as getPatchRoutesOnNavigationFunction,
  UNSAFE_useFogOFWarDiscovery as useFogOFWarDiscovery,
  UNSAFE_mapRouteProperties as mapRouteProperties,
  UNSAFE_hydrationRouteProperties as hydrationRouteProperties,
  UNSAFE_createClientRoutesWithHMRRevalidationOptOut as createClientRoutesWithHMRRevalidationOptOut,
} from "react-router";
import { CRITICAL_CSS_DATA_ATTRIBUTE } from "../dom/ssr/components";
import { RouterProvider } from "./dom-router-provider";

type SSRInfo = {
  context: NonNullable<(typeof window)["__reactRouterContext"]>;
  routeModules: RouteModules;
  manifest: AssetsManifest;
  stateDecodingPromise:
    | (Promise<void> & {
        value?: unknown;
        error?: unknown;
      })
    | undefined;
  router: DataRouter | undefined;
  routerInitialized: boolean;
};

let ssrInfo: SSRInfo | null = null;
let router: DataRouter | null = null;

function initSsrInfo(): void {
  if (
    !ssrInfo &&
    window.__reactRouterContext &&
    window.__reactRouterManifest &&
    window.__reactRouterRouteModules
  ) {
    if (window.__reactRouterManifest.sri === true) {
      const importMap = document.querySelector("script[rr-importmap]");
      if (importMap?.textContent) {
        try {
          window.__reactRouterManifest.sri = JSON.parse(
            importMap.textContent,
          ).integrity;
        } catch (err) {
          console.error("Failed to parse import map", err);
        }
      }
    }

    ssrInfo = {
      context: window.__reactRouterContext,
      manifest: window.__reactRouterManifest,
      routeModules: window.__reactRouterRouteModules,
      stateDecodingPromise: undefined,
      router: undefined,
      routerInitialized: false,
    };
  }
}

function createHydratedRouter({
  unstable_getContext,
}: {
  unstable_getContext?: RouterInit["unstable_getContext"];
}): DataRouter {
  initSsrInfo();

  if (!ssrInfo) {
    throw new Error(
      "You must be using the SSR features of React Router in order to skip " +
        "passing a `router` prop to `<RouterProvider>`",
    );
  }

  // We need to suspend until the initial state snapshot is decoded into
  // window.__reactRouterContext.state

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

  let routes = createClientRoutes(
    ssrInfo.manifest.routes,
    ssrInfo.routeModules,
    ssrInfo.context.state,
    ssrInfo.context.ssr,
    ssrInfo.context.isSpaMode,
  );

  let hydrationData: HydrationState | undefined = undefined;
  // In SPA mode we only hydrate build-time root loader data
  if (ssrInfo.context.isSpaMode) {
    let { loaderData } = ssrInfo.context.state;
    if (
      ssrInfo.manifest.routes.root?.hasLoader &&
      loaderData &&
      "root" in loaderData
    ) {
      hydrationData = {
        loaderData: {
          root: loaderData.root,
        },
      };
    }
  } else {
    hydrationData = getHydrationData(
      ssrInfo.context.state,
      routes,
      (routeId) => ({
        clientLoader: ssrInfo!.routeModules[routeId]?.clientLoader,
        hasLoader: ssrInfo!.manifest.routes[routeId]?.hasLoader === true,
        hasHydrateFallback:
          ssrInfo!.routeModules[routeId]?.HydrateFallback != null,
      }),
      window.location,
      window.__reactRouterContext?.basename,
      ssrInfo.context.isSpaMode,
    );

    if (hydrationData && hydrationData.errors) {
      // TODO: De-dup this or remove entirely in v7 where single fetch is the
      // only approach and we have already serialized or deserialized on the server
      hydrationData.errors = deserializeErrors(hydrationData.errors);
    }
  }

  // We don't use createBrowserRouter here because we need fine-grained control
  // over initialization to support synchronous `clientLoader` flows.
  let router = createRouter({
    routes,
    history: createBrowserHistory(),
    basename: ssrInfo.context.basename,
    unstable_getContext,
    hydrationData,
    hydrationRouteProperties,
    mapRouteProperties,
    future: {
      unstable_middleware: ssrInfo.context.future.unstable_middleware,
    },
    dataStrategy: getTurboStreamSingleFetchDataStrategy(
      () => router,
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.basename,
    ),
    patchRoutesOnNavigation: getPatchRoutesOnNavigationFunction(
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.routeDiscovery,
      ssrInfo.context.isSpaMode,
      ssrInfo.context.basename,
    ),
  });
  ssrInfo.router = router;

  // We can call initialize() immediately if the router doesn't have any
  // loaders to run on hydration
  if (router.state.initialized) {
    ssrInfo.routerInitialized = true;
    router.initialize();
  }

  // @ts-ignore
  router.createRoutesForHMR =
    /* spacer so ts-ignore does not affect the right hand of the assignment */
    createClientRoutesWithHMRRevalidationOptOut;
  window.__reactRouterDataRouter = router;

  return router;
}

/**
 * Props for the {@link dom.HydratedRouter} component.
 *
 * @category Types
 */
export interface HydratedRouterProps {
  /**
   * Context object to be passed through to {@link createBrowserRouter} and made
   * available to
   * [`clientAction`](../../start/framework/route-module#clientAction)/[`clientLoader`](../../start/framework/route-module#clientLoader)
   * functions
   */
  unstable_getContext?: RouterInit["unstable_getContext"];
  /**
   * An error handler function that will be called for any loader/action/render
   * errors that are encountered in your application.  This is useful for
   * logging or reporting errors instead of the `ErrorBoundary` because it's not
   * subject to re-rendering and will only run one time per error.
   *
   * The `errorInfo` parameter is passed along from
   * [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
   * and is only present for render errors.
   *
   * ```tsx
   * <HydratedRouter unstable_onError={(error, errorInfo) => {
   *   console.error(error, errorInfo);
   *   reportToErrorService(error, errorInfo);
   * }} />
   * ```
   */
  unstable_onError?: unstable_ClientOnErrorFunction;
}

/**
 * Framework-mode router component to be used to hydrate a router from a
 * {@link ServerRouter}. See [`entry.client.tsx`](../framework-conventions/entry.client.tsx).
 *
 * @public
 * @category Framework Routers
 * @mode framework
 * @param props Props
 * @param {dom.HydratedRouterProps.unstable_getContext} props.unstable_getContext n/a
 * @param {dom.HydratedRouterProps.unstable_onError} props.unstable_onError n/a
 * @returns A React element that represents the hydrated application.
 */
export function HydratedRouter(props: HydratedRouterProps) {
  if (!router) {
    router = createHydratedRouter({
      unstable_getContext: props.unstable_getContext,
    });
  }

  // We only want to show critical CSS in dev for the initial server render to
  // avoid a flash of unstyled content. Once the client-side JS kicks in, we can
  // clear it to avoid duplicate styles.
  let [criticalCss, setCriticalCss] = React.useState(
    process.env.NODE_ENV === "development"
      ? ssrInfo?.context.criticalCss
      : undefined,
  );
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setCriticalCss(undefined);
    }
  }, []);
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && criticalCss === undefined) {
      // When there's a hydration mismatch, React 19 ignores the server HTML and
      // re-renders from the root, but it doesn't remove any head tags that
      // aren't present in the virtual DOM. This means that the original
      // critical CSS elements are still in the document even though we cleared
      // them in the effect above. To fix this, this effect is designed to clean
      // up any leftover elements. If `criticalCss` is undefined in this effect,
      // this means that React is no longer managing the critical CSS elements,
      // so if there are any left in the document, these are stale elements from
      // the original SSR pass and we can safely remove them.
      document
        .querySelectorAll(`[${CRITICAL_CSS_DATA_ATTRIBUTE}]`)
        .forEach((element) => element.remove());
    }
  }, [criticalCss]);

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

  invariant(ssrInfo, "ssrInfo unavailable for HydratedRouter");

  useFogOFWarDiscovery(
    router,
    ssrInfo.manifest,
    ssrInfo.routeModules,
    ssrInfo.context.ssr,
    ssrInfo.context.routeDiscovery,
    ssrInfo.context.isSpaMode,
  );

  // We need to include a wrapper RemixErrorBoundary here in case the root error
  // boundary also throws and we need to bubble up outside of the router entirely.
  // Then we need a stateful location here so the user can back-button navigate
  // out of there
  return (
    // This fragment is important to ensure we match the <ServerRouter> JSX
    // structure so that useId values hydrate correctly
    <>
      <FrameworkContext.Provider
        value={{
          manifest: ssrInfo.manifest,
          routeModules: ssrInfo.routeModules,
          future: ssrInfo.context.future,
          criticalCss,
          ssr: ssrInfo.context.ssr,
          isSpaMode: ssrInfo.context.isSpaMode,
          routeDiscovery: ssrInfo.context.routeDiscovery,
        }}
      >
        <RemixErrorBoundary location={location}>
          <RouterProvider
            router={router}
            unstable_onError={props.unstable_onError}
          />
        </RemixErrorBoundary>
      </FrameworkContext.Provider>
      {/*
          This fragment is important to ensure we match the <ServerRouter> JSX
          structure so that useId values hydrate correctly
        */}
      <></>
    </>
  );
}
