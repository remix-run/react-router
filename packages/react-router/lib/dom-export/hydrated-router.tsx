import * as React from "react";

import type {
  UNSAFE_AssetsManifest as AssetsManifest,
  UNSAFE_RouteModules as RouteModules,
  DataRouter,
  HydrationState,
  RouterInit,
} from "react-router";
import {
  UNSAFE_invariant as invariant,
  UNSAFE_FrameworkContext as FrameworkContext,
  UNSAFE_decodeViaTurboStream as decodeViaTurboStream,
  UNSAFE_RemixErrorBoundary as RemixErrorBoundary,
  UNSAFE_createBrowserHistory as createBrowserHistory,
  UNSAFE_createClientRoutes as createClientRoutes,
  UNSAFE_createRouter as createRouter,
  UNSAFE_deserializeErrors as deserializeErrors,
  UNSAFE_getSingleFetchDataStrategy as getSingleFetchDataStrategy,
  UNSAFE_getPatchRoutesOnNavigationFunction as getPatchRoutesOnNavigationFunction,
  UNSAFE_shouldHydrateRouteLoader as shouldHydrateRouteLoader,
  UNSAFE_useFogOFWarDiscovery as useFogOFWarDiscovery,
  UNSAFE_mapRouteProperties as mapRouteProperties,
  UNSAFE_createClientRoutesWithHMRRevalidationOptOut as createClientRoutesWithHMRRevalidationOptOut,
  matchRoutes,
} from "react-router";
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
        "passing a `router` prop to `<RouterProvider>`"
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
    ssrInfo.context.isSpaMode
  );

  let hydrationData: HydrationState | undefined = undefined;
  let loaderData = ssrInfo.context.state.loaderData;
  // In SPA mode we only hydrate build-time root loader data
  if (ssrInfo.context.isSpaMode) {
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
    // Create a shallow clone of `loaderData` we can mutate for partial hydration.
    // When a route exports a `clientLoader` and a `HydrateFallback`, the SSR will
    // render the fallback so we need the client to do the same for hydration.
    // The server loader data has already been exposed to these route `clientLoader`'s
    // in `createClientRoutes` above, so we need to clear out the version we pass to
    // `createBrowserRouter` so it initializes and runs the client loaders.
    hydrationData = {
      ...ssrInfo.context.state,
      loaderData: { ...loaderData },
    };
    let initialMatches = matchRoutes(
      routes,
      window.location,
      window.__reactRouterContext?.basename
    );
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
          manifestRoute &&
          shouldHydrateRouteLoader(
            manifestRoute,
            route,
            ssrInfo.context.isSpaMode
          ) &&
          (route.HydrateFallback || !manifestRoute.hasLoader)
        ) {
          delete hydrationData.loaderData![routeId];
        } else if (manifestRoute && !manifestRoute.hasLoader) {
          // Since every Remix route gets a `loader` on the client side to load
          // the route JS module, we need to add a `null` value to `loaderData`
          // for any routes that don't have server loaders so our partial
          // hydration logic doesn't kick off the route module loaders during
          // hydration
          hydrationData.loaderData![routeId] = null;
        }
      }
    }

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
    mapRouteProperties,
    future: {
      unstable_middleware: ssrInfo.context.future.unstable_middleware,
    },
    dataStrategy: getSingleFetchDataStrategy(
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.basename,
      () => router
    ),
    patchRoutesOnNavigation: getPatchRoutesOnNavigationFunction(
      ssrInfo.manifest,
      ssrInfo.routeModules,
      ssrInfo.context.ssr,
      ssrInfo.context.isSpaMode,
      ssrInfo.context.basename
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

interface HydratedRouterProps {
  /**
   * Context object to passed through to `createBrowserRouter` and made available
   * to `clientLoader`/`clientActon` functions
   */
  unstable_getContext?: RouterInit["unstable_getContext"];
}

/**
 * Framework-mode router component to be used in `entry.client.tsx` to hydrate a
 * router from a `ServerRouter`
 *
 * @category Component Routers
 */
export function HydratedRouter(props: HydratedRouterProps) {
  if (!router) {
    router = createHydratedRouter({
      unstable_getContext: props.unstable_getContext,
    });
  }

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
      window.__reactRouterClearCriticalCss = () => setCriticalCss(undefined);
    }
  }

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
    ssrInfo.context.isSpaMode
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
        }}
      >
        <RemixErrorBoundary location={location}>
          <RouterProvider router={router} />
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
