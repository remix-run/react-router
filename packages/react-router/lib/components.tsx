import * as React from "react";

import type {
  InitialEntry,
  Location,
  MemoryHistory,
  To,
} from "./router/history";
import {
  Action as NavigationType,
  createMemoryHistory,
  invariant,
  parsePath,
  warning,
} from "./router/history";
import type {
  FutureConfig,
  HydrationState,
  RelativeRoutingType,
  Router as DataRouter,
  RouterState,
  RouterSubscriber,
  RouterInit,
} from "./router/router";
import { createRouter } from "./router/router";
import type {
  DataStrategyFunction,
  LazyRouteFunction,
  Params,
  TrackedPromise,
} from "./router/utils";
import {
  getResolveToMatches,
  getRoutePattern,
  resolveTo,
  stripBasename,
} from "./router/utils";

import type {
  DataRouteObject,
  IndexRouteObject,
  Navigator,
  NonIndexRouteObject,
  PatchRoutesOnNavigationFunction,
  RouteMatch,
  RouteObject,
  ViewTransitionContextObject,
} from "./context";
import {
  AwaitContext,
  DataRouterContext,
  DataRouterStateContext,
  ENABLE_DEV_WARNINGS,
  FetchersContext,
  LocationContext,
  NavigationContext,
  RouteContext,
  ViewTransitionContext,
  useIsRSCRouterContext,
} from "./context";
import {
  _renderMatches,
  useActionData,
  useAsyncValue,
  useInRouterContext,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useOutlet,
  useParams,
  useRouteError,
  useRoutes,
  useRoutesImpl,
} from "./hooks";
import type { ViewTransition } from "./dom/global";
import { warnOnce } from "./server-runtime/warnings";
import type { unstable_ClientInstrumentation } from "./router/instrumentation";

/**
 * Webpack can fail to compile against react versions without this export -
 * it complains that `useOptimistic` doesn't exist in `React`.
 *
 * Using the string constant directly at runtime fixes the webpack build issue
 * but can result in terser stripping the actual call at minification time.
 *
 * Grabbing an exported reference once up front resolves that issue.
 *
 * See https://github.com/remix-run/react-router/issues/10579
 */
const USE_OPTIMISTIC = "useOptimistic";
// @ts-expect-error Needs React 19 types but we develop against 18
const useOptimisticImpl = React[USE_OPTIMISTIC];
const stableUseOptimisticSetter = () => undefined;

function useOptimisticSafe<T>(
  val: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  if (useOptimisticImpl) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useOptimisticImpl(val);
  } else {
    return [val, stableUseOptimisticSetter];
  }
}

export function mapRouteProperties(route: RouteObject) {
  let updates: Partial<RouteObject> & { hasErrorBoundary: boolean } = {
    // Note: this check also occurs in createRoutesFromChildren so update
    // there if you change this -- please and thank you!
    hasErrorBoundary:
      route.hasErrorBoundary ||
      route.ErrorBoundary != null ||
      route.errorElement != null,
  };

  if (route.Component) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.element) {
        warning(
          false,
          "You should not include both `Component` and `element` on your route - " +
            "`Component` will be used.",
        );
      }
    }
    Object.assign(updates, {
      element: React.createElement(route.Component),
      Component: undefined,
    });
  }

  if (route.HydrateFallback) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.hydrateFallbackElement) {
        warning(
          false,
          "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - " +
            "`HydrateFallback` will be used.",
        );
      }
    }
    Object.assign(updates, {
      hydrateFallbackElement: React.createElement(route.HydrateFallback),
      HydrateFallback: undefined,
    });
  }

  if (route.ErrorBoundary) {
    if (ENABLE_DEV_WARNINGS) {
      if (route.errorElement) {
        warning(
          false,
          "You should not include both `ErrorBoundary` and `errorElement` on your route - " +
            "`ErrorBoundary` will be used.",
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

export const hydrationRouteProperties: (keyof RouteObject)[] = [
  "HydrateFallback",
  "hydrateFallbackElement",
];

/**
 * @category Data Routers
 */
export interface MemoryRouterOpts {
  /**
   * Basename path for the application.
   */
  basename?: string;
  /**
   * A function that returns an {@link RouterContextProvider} instance
   * which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
   * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
   * This function is called to generate a fresh `context` instance on each
   * navigation or fetcher call.
   */
  getContext?: RouterInit["getContext"];
  /**
   * Future flags to enable for the router.
   */
  future?: Partial<FutureConfig>;
  /**
   * Hydration data to initialize the router with if you have already performed
   * data loading on the server.
   */
  hydrationData?: HydrationState;
  /**
   * Initial entries in the in-memory history stack
   */
  initialEntries?: InitialEntry[];
  /**
   * Index of `initialEntries` the application should initialize to
   */
  initialIndex?: number;
  /**
   * Array of instrumentation objects allowing you to instrument the router and
   * individual routes prior to router initialization (and on any subsequently
   * added routes via `route.lazy` or `patchRoutesOnNavigation`).  This is
   * mostly useful for observability such as wrapping navigations, fetches,
   * as well as route loaders/actions/middlewares with logging and/or performance
   * tracing.  See the [docs](../../how-to/instrumentation) for more information.
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   unstable_instrumentations: [logging]
   * });
   *
   *
   * let logging = {
   *   router({ instrument }) {
   *     instrument({
   *       navigate: (impl, info) => logExecution(`navigate ${info.to}`, impl),
   *       fetch: (impl, info) => logExecution(`fetch ${info.to}`, impl)
   *     });
   *   },
   *   route({ instrument, id }) {
   *     instrument({
   *       middleware: (impl, info) => logExecution(
   *         `middleware ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       loader: (impl, info) => logExecution(
   *         `loader ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       action: (impl, info) => logExecution(
   *         `action ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *     })
   *   }
   * };
   *
   * async function logExecution(label: string, impl: () => Promise<void>) {
   *   let start = performance.now();
   *   console.log(`start ${label}`);
   *   await impl();
   *   let duration = Math.round(performance.now() - start);
   *   console.log(`end ${label} (${duration}ms)`);
   * }
   * ```
   */
  unstable_instrumentations?: unstable_ClientInstrumentation[];
  /**
   * Override the default data strategy of running loaders in parallel -
   * see the [docs](../../how-to/data-strategy) for more information.
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   async dataStrategy({
   *     matches,
   *     request,
   *     runClientMiddleware,
   *   }) {
   *     const matchesToLoad = matches.filter((m) =>
   *       m.shouldCallHandler(),
   *     );
   *
   *     const results: Record<string, DataStrategyResult> = {};
   *     await runClientMiddleware(() =>
   *       Promise.all(
   *         matchesToLoad.map(async (match) => {
   *           results[match.route.id] = await match.resolve();
   *         }),
   *       ),
   *     );
   *     return results;
   *   },
   * });
   * ```
   */
  dataStrategy?: DataStrategyFunction;
  /**
   * Lazily define portions of the route tree on navigations.
   */
  patchRoutesOnNavigation?: PatchRoutesOnNavigationFunction;
}

/**
 * Create a new {@link DataRouter} that manages the application path using an
 * in-memory [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack. Useful for non-browser environments without a DOM API.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes Application routes
 * @param opts Options
 * @param {MemoryRouterOpts.basename} opts.basename n/a
 * @param {MemoryRouterOpts.dataStrategy} opts.dataStrategy n/a
 * @param {MemoryRouterOpts.future} opts.future n/a
 * @param {MemoryRouterOpts.getContext} opts.getContext n/a
 * @param {MemoryRouterOpts.hydrationData} opts.hydrationData n/a
 * @param {MemoryRouterOpts.initialEntries} opts.initialEntries n/a
 * @param {MemoryRouterOpts.initialIndex} opts.initialIndex n/a
 * @param {MemoryRouterOpts.unstable_instrumentations} opts.unstable_instrumentations n/a
 * @param {MemoryRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
 * @returns An initialized {@link DataRouter} to pass to {@link RouterProvider | `<RouterProvider>`}
 */
export function createMemoryRouter(
  routes: RouteObject[],
  opts?: MemoryRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    getContext: opts?.getContext,
    future: opts?.future,
    history: createMemoryHistory({
      initialEntries: opts?.initialEntries,
      initialIndex: opts?.initialIndex,
    }),
    hydrationData: opts?.hydrationData,
    routes,
    hydrationRouteProperties,
    mapRouteProperties,
    dataStrategy: opts?.dataStrategy,
    patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
    unstable_instrumentations: opts?.unstable_instrumentations,
  }).initialize();
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

/**
 * Function signature for client side error handling for loader/actions errors
 * and rendering errors via `componentDidCatch`
 */
export interface ClientOnErrorFunction {
  (
    error: unknown,
    info: {
      location: Location;
      params: Params;
      unstable_pattern: string;
      errorInfo?: React.ErrorInfo;
    },
  ): void;
}

/**
 * @category Types
 */
export interface RouterProviderProps {
  /**
   * The {@link DataRouter} instance to use for navigation and data fetching.
   */
  router: DataRouter;
  /**
   * The [`ReactDOM.flushSync`](https://react.dev/reference/react-dom/flushSync)
   * implementation to use for flushing updates.
   *
   * You usually don't have to worry about this:
   * - The `RouterProvider` exported from `react-router/dom` handles this internally for you
   * - If you are rendering in a non-DOM environment, you can import
   *   `RouterProvider` from `react-router` and ignore this prop
   */
  flushSync?: (fn: () => unknown) => undefined;
  /**
   * An error handler function that will be called for any middleware, loader, action,
   * or render errors that are encountered in your application.  This is useful for
   * logging or reporting errors instead of in the {@link ErrorBoundary} because it's not
   * subject to re-rendering and will only run one time per error.
   *
   * The `errorInfo` parameter is passed along from
   * [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
   * and is only present for render errors.
   *
   * ```tsx
   * <RouterProvider onError=(error, info) => {
   *   let { location, params, unstable_pattern, errorInfo } = info;
   *   console.error(error, location, errorInfo);
   *   reportToErrorService(error, location, errorInfo);
   * }} />
   * ```
   */
  onError?: ClientOnErrorFunction;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all state updates are wrapped in
   *   `React.startTransition`
   *   - This can lead to buggy behaviors if you are wrapping your own
   *     navigations/fetchers in `startTransition`.
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and router state changes will be wrapped in
   *   `React.startTransition` and also sent through
   *   [`useOptimistic`](https://react.dev/reference/react/useOptimistic) to
   *   surface mid-navigation router state changes to the UI.
   * - When set to `false`, the router will not leverage `React.startTransition` or
   *   `React.useOptimistic` on any navigations or state changes.
   *
   * For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).
   */
  unstable_useTransitions?: boolean;
}

/**
 * Render the UI for the given {@link DataRouter}. This component should
 * typically be at the top of an app's element tree.
 *
 * ```tsx
 * import { createBrowserRouter } from "react-router";
 * import { RouterProvider } from "react-router/dom";
 * import { createRoot } from "react-dom/client";
 *
 * const router = createBrowserRouter(routes);
 * createRoot(document.getElementById("root")).render(
 *   <RouterProvider router={router} />
 * );
 * ```
 *
 * <docs-info>Please note that this component is exported both from
 * `react-router` and `react-router/dom` with the only difference being that the
 * latter automatically wires up `react-dom`'s [`flushSync`](https://react.dev/reference/react-dom/flushSync)
 * implementation. You _almost always_ want to use the version from
 * `react-router/dom` unless you're running in a non-DOM environment.</docs-info>
 *
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param props Props
 * @param {RouterProviderProps.flushSync} props.flushSync n/a
 * @param {RouterProviderProps.onError} props.onError n/a
 * @param {RouterProviderProps.router} props.router n/a
 * @param {RouterProviderProps.unstable_useTransitions} props.unstable_useTransitions n/a
 * @returns React element for the rendered router
 */
export function RouterProvider({
  router,
  flushSync: reactDomFlushSyncImpl,
  onError,
  unstable_useTransitions,
}: RouterProviderProps): React.ReactElement {
  let unstable_rsc = useIsRSCRouterContext();
  unstable_useTransitions = unstable_rsc || unstable_useTransitions;

  let [_state, setStateImpl] = React.useState(router.state);
  let [state, setOptimisticState] = useOptimisticSafe(_state);
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

  let setState = React.useCallback<RouterSubscriber>(
    (
      newState: RouterState,
      { deletedFetchers, newErrors, flushSync, viewTransitionOpts },
    ) => {
      // Send router errors through onError
      if (newErrors && onError) {
        Object.values(newErrors).forEach((error) =>
          onError(error, {
            location: newState.location,
            params: newState.matches[0]?.params ?? {},
            unstable_pattern: getRoutePattern(newState.matches),
          }),
        );
      }

      newState.fetchers.forEach((fetcher, key) => {
        if (fetcher.data !== undefined) {
          fetcherData.current.set(key, fetcher.data);
        }
      });
      deletedFetchers.forEach((key) => fetcherData.current.delete(key));

      warnOnce(
        flushSync === false || reactDomFlushSyncImpl != null,
        "You provided the `flushSync` option to a router update, " +
          "but you are not using the `<RouterProvider>` from `react-router/dom` " +
          "so `ReactDOM.flushSync()` is unavailable.  Please update your app " +
          'to `import { RouterProvider } from "react-router/dom"` and ensure ' +
          "you have `react-dom` installed as a dependency to use the " +
          "`flushSync` option.",
      );

      let isViewTransitionAvailable =
        router.window != null &&
        router.window.document != null &&
        typeof router.window.document.startViewTransition === "function";

      warnOnce(
        viewTransitionOpts == null || isViewTransitionAvailable,
        "You provided the `viewTransition` option to a router update, " +
          "but you do not appear to be running in a DOM environment as " +
          "`window.startViewTransition` is not available.",
      );

      // If this isn't a view transition or it's not available in this browser,
      // just update and be done with it
      if (!viewTransitionOpts || !isViewTransitionAvailable) {
        if (reactDomFlushSyncImpl && flushSync) {
          reactDomFlushSyncImpl(() => setStateImpl(newState));
        } else if (unstable_useTransitions === false) {
          setStateImpl(newState);
        } else {
          React.startTransition(() => {
            if (unstable_useTransitions === true) {
              setOptimisticState((s) => getOptimisticRouterState(s, newState));
            }
            setStateImpl(newState);
          });
        }
        return;
      }

      // flushSync + startViewTransition
      if (reactDomFlushSyncImpl && flushSync) {
        // Flush through the context to mark DOM elements as transition=ing
        reactDomFlushSyncImpl(() => {
          // Cancel any pending transitions
          if (transition) {
            renderDfd?.resolve();
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
          reactDomFlushSyncImpl(() => setStateImpl(newState));
        });

        // Clean up after the animation completes
        t.finished.finally(() => {
          reactDomFlushSyncImpl(() => {
            setRenderDfd(undefined);
            setTransition(undefined);
            setPendingState(undefined);
            setVtContext({ isTransitioning: false });
          });
        });

        reactDomFlushSyncImpl(() => setTransition(t));
        return;
      }

      // startTransition + startViewTransition
      if (transition) {
        // Interrupting an in-progress transition, cancel and let everything flush
        // out, and then kick off a new transition from the interruption state
        renderDfd?.resolve();
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
    [
      router.window,
      reactDomFlushSyncImpl,
      transition,
      renderDfd,
      unstable_useTransitions,
      setOptimisticState,
      onError,
    ],
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
        if (unstable_useTransitions === false) {
          setStateImpl(newState);
        } else {
          React.startTransition(() => {
            if (unstable_useTransitions === true) {
              setOptimisticState((s) => getOptimisticRouterState(s, newState));
            }
            setStateImpl(newState);
          });
        }
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
  }, [
    pendingState,
    renderDfd,
    router.window,
    unstable_useTransitions,
    setOptimisticState,
  ]);

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
      onError,
    }),
    [router, navigator, basename, onError],
  );

  // The fragment and {null} here are important!  We need them to keep React 18's
  // useId happy when we are server-rendering since we may have a <script> here
  // containing the hydrated server-side staticContext (from StaticRouterProvider).
  // useId relies on the component tree structure to generate deterministic id's
  // so we need to ensure it remains the same on the client even though
  // we don't need the <script> tag
  return (
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
                unstable_useTransitions={unstable_useTransitions}
              >
                <MemoizedDataRoutes
                  routes={router.routes}
                  future={router.future}
                  state={state}
                  isStatic={false}
                  onError={onError}
                />
              </Router>
            </ViewTransitionContext.Provider>
          </FetchersContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>
      {null}
    </>
  );
}

function getOptimisticRouterState(
  currentState: RouterState,
  newState: RouterState,
): RouterState {
  return {
    // Don't surface "current location specific" stuff mid-navigation
    // (historyAction, location, matches, loaderData, errors, initialized,
    // restoreScroll, preventScrollReset, blockers, etc.)
    ...currentState,
    // Only surface "pending/in-flight stuff"
    // (navigation, revalidation, actionData, fetchers, )
    navigation:
      newState.navigation.state !== "idle"
        ? newState.navigation
        : currentState.navigation,
    revalidation:
      newState.revalidation !== "idle"
        ? newState.revalidation
        : currentState.revalidation,
    actionData:
      newState.navigation.state !== "submitting"
        ? newState.actionData
        : currentState.actionData,
    fetchers: newState.fetchers,
  };
}

// Memoize to avoid re-renders when updating `ViewTransitionContext`
const MemoizedDataRoutes = React.memo(DataRoutes);

export function DataRoutes({
  routes,
  future,
  state,
  isStatic,
  onError,
}: {
  routes: DataRouteObject[];
  future: DataRouter["future"];
  state: RouterState;
  isStatic: boolean;
  onError?: ClientOnErrorFunction;
}): React.ReactElement | null {
  return useRoutesImpl(routes, undefined, { state, isStatic, onError, future });
}

/**
 * @category Types
 */
export interface MemoryRouterProps {
  /**
   * Application basename
   */
  basename?: string;
  /**
   * Nested {@link Route} elements describing the route tree
   */
  children?: React.ReactNode;
  /**
   * Initial entries in the in-memory history stack
   */
  initialEntries?: InitialEntry[];
  /**
   * Index of `initialEntries` the application should initialize to
   */
  initialIndex?: number;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `false`, the router will not leverage `React.startTransition`
   *   on any navigations or state changes.
   *
   * For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).
   */
  unstable_useTransitions?: boolean;
}

/**
 * A declarative {@link Router | `<Router>`} that stores all entries in memory.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {MemoryRouterProps.basename} props.basename n/a
 * @param {MemoryRouterProps.children} props.children n/a
 * @param {MemoryRouterProps.initialEntries} props.initialEntries n/a
 * @param {MemoryRouterProps.initialIndex} props.initialIndex n/a
 * @param {MemoryRouterProps.unstable_useTransitions} props.unstable_useTransitions n/a
 * @returns A declarative in-memory {@link Router | `<Router>`} for client-side
 * routing.
 */
export function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
  unstable_useTransitions,
}: MemoryRouterProps): React.ReactElement {
  let historyRef = React.useRef<MemoryHistory>();
  if (historyRef.current == null) {
    historyRef.current = createMemoryHistory({
      initialEntries,
      initialIndex,
      v5Compat: true,
    });
  }

  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      if (unstable_useTransitions === false) {
        setStateImpl(newState);
      } else {
        React.startTransition(() => setStateImpl(newState));
      }
    },
    [unstable_useTransitions],
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
      unstable_useTransitions={unstable_useTransitions}
    />
  );
}

/**
 * @category Types
 */
export interface NavigateProps {
  /**
   * The path to navigate to. This can be a string or a {@link Path} object
   */
  to: To;
  /**
   * Whether to replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
   * stack
   */
  replace?: boolean;
  /**
   * State to pass to the new {@link Location} to store in [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state).
   */
  state?: any;
  /**
   * How to interpret relative routing in the `to` prop.
   * See {@link RelativeRoutingType}.
   */
  relative?: RelativeRoutingType;
}

/**
 * A component-based version of {@link useNavigate} to use in a
 * [`React.Component` class](https://react.dev/reference/react/Component) where
 * hooks cannot be used.
 *
 * It's recommended to avoid using this component in favor of {@link useNavigate}.
 *
 * @example
 * <Navigate to="/tasks" />
 *
 * @public
 * @category Components
 * @param props Props
 * @param {NavigateProps.relative} props.relative n/a
 * @param {NavigateProps.replace} props.replace n/a
 * @param {NavigateProps.state} props.state n/a
 * @param {NavigateProps.to} props.to n/a
 * @returns {void}
 *
 */
export function Navigate({
  to,
  replace,
  state,
  relative,
}: NavigateProps): null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    `<Navigate> may be used only in the context of a <Router> component.`,
  );

  let { static: isStatic } = React.useContext(NavigationContext);

  warning(
    !isStatic,
    `<Navigate> must not be used on the initial render in a <StaticRouter>. ` +
      `This is a no-op, but you should modify your code so the <Navigate> is ` +
      `only ever rendered in response to some user interaction or state change.`,
  );

  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let navigate = useNavigate();

  // Resolve the path outside of the effect so that when effects run twice in
  // StrictMode they navigate to the same place
  let path = resolveTo(
    to,
    getResolveToMatches(matches),
    locationPathname,
    relative === "path",
  );
  let jsonPath = JSON.stringify(path);

  React.useEffect(() => {
    navigate(JSON.parse(jsonPath), { replace, state, relative });
  }, [navigate, jsonPath, relative, replace, state]);

  return null;
}

/**
 * @category Types
 */
export interface OutletProps {
  /**
   * Provides a context value to the element tree below the outlet. Use when
   * the parent route needs to provide values to child routes.
   *
   * ```tsx
   * <Outlet context={myContextValue} />
   * ```
   *
   * Access the context with {@link useOutletContext}.
   */
  context?: unknown;
}

/**
 * Renders the matching child route of a parent route or nothing if no child
 * route matches.
 *
 * @example
 * import { Outlet } from "react-router";
 *
 * export default function SomeParent() {
 *   return (
 *     <div>
 *       <h1>Parent Content</h1>
 *       <Outlet />
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Components
 * @param props Props
 * @param {OutletProps.context} props.context n/a
 * @returns React element for the rendered outlet or `null` if no child route matches.
 */
export function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}

/**
 * @category Types
 */
export interface PathRouteProps {
  /**
   * Whether the path should be case-sensitive. Defaults to `false`.
   */
  caseSensitive?: NonIndexRouteObject["caseSensitive"];
  /**
   * The path pattern to match. If unspecified or empty, then this becomes a
   * layout route.
   */
  path?: NonIndexRouteObject["path"];
  /**
   * The unique identifier for this route (for use with {@link DataRouter}s)
   */
  id?: NonIndexRouteObject["id"];
  /**
   * A function that returns a promise that resolves to the route object.
   * Used for code-splitting routes.
   * See [`lazy`](../../start/data/route-object#lazy).
   */
  lazy?: LazyRouteFunction<NonIndexRouteObject>;
  /**
   * The route middleware.
   * See [`middleware`](../../start/data/route-object#middleware).
   */
  middleware?: NonIndexRouteObject["middleware"];
  /**
   * The route loader.
   * See [`loader`](../../start/data/route-object#loader).
   */
  loader?: NonIndexRouteObject["loader"];
  /**
   * The route action.
   * See [`action`](../../start/data/route-object#action).
   */
  action?: NonIndexRouteObject["action"];
  hasErrorBoundary?: NonIndexRouteObject["hasErrorBoundary"];
  /**
   * The route shouldRevalidate function.
   * See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).
   */
  shouldRevalidate?: NonIndexRouteObject["shouldRevalidate"];
  /**
   * The route handle.
   */
  handle?: NonIndexRouteObject["handle"];
  /**
   * Whether this is an index route.
   */
  index?: false;
  /**
   * Child Route components
   */
  children?: React.ReactNode;
  /**
   * The React element to render when this Route matches.
   * Mutually exclusive with `Component`.
   */
  element?: React.ReactNode | null;
  /**
   * The React element to render while this router is loading data.
   * Mutually exclusive with `HydrateFallback`.
   */
  hydrateFallbackElement?: React.ReactNode | null;
  /**
   * The React element to render at this route if an error occurs.
   * Mutually exclusive with `ErrorBoundary`.
   */
  errorElement?: React.ReactNode | null;
  /**
   * The React Component to render when this route matches.
   * Mutually exclusive with `element`.
   */
  Component?: React.ComponentType | null;
  /**
   * The React Component to render while this router is loading data.
   * Mutually exclusive with `hydrateFallbackElement`.
   */
  HydrateFallback?: React.ComponentType | null;
  /**
   * The React Component to render at this route if an error occurs.
   * Mutually exclusive with `errorElement`.
   */
  ErrorBoundary?: React.ComponentType | null;
}

/**
 * @category Types
 */
export interface LayoutRouteProps extends PathRouteProps {}

/**
 * @category Types
 */
export interface IndexRouteProps {
  /**
   * Whether the path should be case-sensitive. Defaults to `false`.
   */
  caseSensitive?: IndexRouteObject["caseSensitive"];
  /**
   * The path pattern to match. If unspecified or empty, then this becomes a
   * layout route.
   */
  path?: IndexRouteObject["path"];
  /**
   * The unique identifier for this route (for use with {@link DataRouter}s)
   */
  id?: IndexRouteObject["id"];
  /**
   * A function that returns a promise that resolves to the route object.
   * Used for code-splitting routes.
   * See [`lazy`](../../start/data/route-object#lazy).
   */
  lazy?: LazyRouteFunction<IndexRouteObject>;
  /**
   * The route middleware.
   * See [`middleware`](../../start/data/route-object#middleware).
   */
  middleware?: IndexRouteObject["middleware"];
  /**
   * The route loader.
   * See [`loader`](../../start/data/route-object#loader).
   */
  loader?: IndexRouteObject["loader"];
  /**
   * The route action.
   * See [`action`](../../start/data/route-object#action).
   */
  action?: IndexRouteObject["action"];
  hasErrorBoundary?: IndexRouteObject["hasErrorBoundary"];
  /**
   * The route shouldRevalidate function.
   * See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).
   */
  shouldRevalidate?: IndexRouteObject["shouldRevalidate"];
  /**
   * The route handle.
   */
  handle?: IndexRouteObject["handle"];
  /**
   * Whether this is an index route.
   */
  index: true;
  /**
   * Child Route components
   */
  children?: undefined;
  /**
   * The React element to render when this Route matches.
   * Mutually exclusive with `Component`.
   */
  element?: React.ReactNode | null;
  /**
   * The React element to render while this router is loading data.
   * Mutually exclusive with `HydrateFallback`.
   */
  hydrateFallbackElement?: React.ReactNode | null;
  /**
   * The React element to render at this route if an error occurs.
   * Mutually exclusive with `ErrorBoundary`.
   */
  errorElement?: React.ReactNode | null;
  /**
   * The React Component to render when this route matches.
   * Mutually exclusive with `element`.
   */
  Component?: React.ComponentType | null;
  /**
   * The React Component to render while this router is loading data.
   * Mutually exclusive with `hydrateFallbackElement`.
   */
  HydrateFallback?: React.ComponentType | null;
  /**
   * The React Component to render at this route if an error occurs.
   * Mutually exclusive with `errorElement`.
   */
  ErrorBoundary?: React.ComponentType | null;
}

export type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps;

/**
 * Configures an element to render when a pattern matches the current location.
 * It must be rendered within a {@link Routes} element. Note that these routes
 * do not participate in data loading, actions, code splitting, or any other
 * route module features.
 *
 * @example
 * // Usually used in a declarative router
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         <Route index element={<StepOne />} />
 *         <Route path="step-2" element={<StepTwo />} />
 *         <Route path="step-3" element={<StepThree />} />
 *       </Routes>
 *    </BrowserRouter>
 *   );
 * }
 *
 * // But can be used with a data router as well if you prefer the JSX notation
 * const routes = createRoutesFromElements(
 *   <>
 *     <Route index loader={step1Loader} Component={StepOne} />
 *     <Route path="step-2" loader={step2Loader} Component={StepTwo} />
 *     <Route path="step-3" loader={step3Loader} Component={StepThree} />
 *   </>
 * );
 *
 * const router = createBrowserRouter(routes);
 *
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 *
 * @public
 * @category Components
 * @param props Props
 * @param {PathRouteProps.action} props.action n/a
 * @param {PathRouteProps.caseSensitive} props.caseSensitive n/a
 * @param {PathRouteProps.Component} props.Component n/a
 * @param {PathRouteProps.children} props.children n/a
 * @param {PathRouteProps.element} props.element n/a
 * @param {PathRouteProps.ErrorBoundary} props.ErrorBoundary n/a
 * @param {PathRouteProps.errorElement} props.errorElement n/a
 * @param {PathRouteProps.handle} props.handle n/a
 * @param {PathRouteProps.HydrateFallback} props.HydrateFallback n/a
 * @param {PathRouteProps.hydrateFallbackElement} props.hydrateFallbackElement n/a
 * @param {PathRouteProps.id} props.id n/a
 * @param {PathRouteProps.index} props.index n/a
 * @param {PathRouteProps.lazy} props.lazy n/a
 * @param {PathRouteProps.loader} props.loader n/a
 * @param {PathRouteProps.path} props.path n/a
 * @param {PathRouteProps.shouldRevalidate} props.shouldRevalidate n/a
 * @returns {void}
 */
export function Route(props: RouteProps): React.ReactElement | null {
  invariant(
    false,
    `A <Route> is only ever to be used as the child of <Routes> element, ` +
      `never rendered directly. Please wrap your <Route> in a <Routes>.`,
  );
}

/**
 * @category Types
 */
export interface RouterProps {
  /**
   * The base path for the application. This is prepended to all locations
   */
  basename?: string;
  /**
   * Nested {@link Route} elements describing the route tree
   */
  children?: React.ReactNode;
  /**
   * The location to match against. Defaults to the current location.
   * This can be a string or a {@link Location} object.
   */
  location: Partial<Location> | string;
  /**
   * The type of navigation that triggered this `location` change.
   * Defaults to {@link NavigationType.Pop}.
   */
  navigationType?: NavigationType;
  /**
   * The navigator to use for navigation. This is usually a history object
   * or a custom navigator that implements the {@link Navigator} interface.
   */
  navigator: Navigator;
  /**
   * Whether this router is static or not (used for SSR). If `true`, the router
   * will not be reactive to location changes.
   */
  static?: boolean;
  /**
   * Control whether router state updates are internally wrapped in
   * [`React.startTransition`](https://react.dev/reference/react/startTransition).
   *
   * - When left `undefined`, all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
   *   in `React.startTransition` and all router state updates are wrapped in
   *   `React.startTransition`
   * - When set to `false`, the router will not leverage `React.startTransition`
   *   on any navigations or state changes.
   *
   * For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).
   */
  unstable_useTransitions?: boolean;
}

/**
 * Provides location context for the rest of the app.
 *
 * Note: You usually won't render a `<Router>` directly. Instead, you'll render a
 * router that is more specific to your environment such as a {@link BrowserRouter}
 * in web browsers or a {@link ServerRouter} for server rendering.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {RouterProps.basename} props.basename n/a
 * @param {RouterProps.children} props.children n/a
 * @param {RouterProps.location} props.location n/a
 * @param {RouterProps.navigationType} props.navigationType n/a
 * @param {RouterProps.navigator} props.navigator n/a
 * @param {RouterProps.static} props.static n/a
 * @param {RouterProps.unstable_useTransitions} props.unstable_useTransitions n/a
 * @returns React element for the rendered router or `null` if the location does
 * not match the {@link props.basename}
 */
export function Router({
  basename: basenameProp = "/",
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
  static: staticProp = false,
  unstable_useTransitions,
}: RouterProps): React.ReactElement | null {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You should never have more than one in your app.`,
  );

  // Preserve trailing slashes on basename, so we can let the user control
  // the enforcement of trailing slashes throughout the app
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = React.useMemo(
    () => ({
      basename,
      navigator,
      static: staticProp,
      unstable_useTransitions,
      future: {},
    }),
    [basename, navigator, staticProp, unstable_useTransitions],
  );

  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }

  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default",
  } = locationProp;

  let locationContext = React.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);

    if (trailingPathname == null) {
      return null;
    }

    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key,
      },
      navigationType,
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);

  warning(
    locationContext != null,
    `<Router basename="${basename}"> is not able to match the URL ` +
      `"${pathname}${search}${hash}" because it does not start with the ` +
      `basename, so the <Router> won't render anything.`,
  );

  if (locationContext == null) {
    return null;
  }

  return (
    <NavigationContext.Provider value={navigationContext}>
      <LocationContext.Provider children={children} value={locationContext} />
    </NavigationContext.Provider>
  );
}

/**
 * @category Types
 */
export interface RoutesProps {
  /**
   * Nested {@link Route} elements
   */
  children?: React.ReactNode;
  /**
   * The {@link Location} to match against. Defaults to the current location.
   */
  location?: Partial<Location> | string;
}

/**
 * Renders a branch of {@link Route | `<Route>`s} that best matches the current
 * location. Note that these routes do not participate in [data loading](../../start/framework/route-module#loader),
 * [`action`](../../start/framework/route-module#action), code splitting, or
 * any other [route module](../../start/framework/route-module) features.
 *
 * @example
 * import { Route, Routes } from "react-router";
 *
 * <Routes>
 *   <Route index element={<StepOne />} />
 *   <Route path="step-2" element={<StepTwo />} />
 *   <Route path="step-3" element={<StepThree />} />
 * </Routes>
 *
 * @public
 * @category Components
 * @param props Props
 * @param {RoutesProps.children} props.children n/a
 * @param {RoutesProps.location} props.location n/a
 * @returns React element for the rendered routes or `null` if no route matches
 */
export function Routes({
  children,
  location,
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children), location);
}

export interface AwaitResolveRenderFunction<Resolve = any> {
  (data: Awaited<Resolve>): React.ReactNode;
}

/**
 * @category Types
 */
export interface AwaitProps<Resolve> {
  /**
   * When using a function, the resolved value is provided as the parameter.
   *
   * ```tsx [2]
   * <Await resolve={reviewsPromise}>
   *   {(resolvedReviews) => <Reviews items={resolvedReviews} />}
   * </Await>
   * ```
   *
   * When using React elements, {@link useAsyncValue} will provide the
   * resolved value:
   *
   * ```tsx [2]
   * <Await resolve={reviewsPromise}>
   *   <Reviews />
   * </Await>
   *
   * function Reviews() {
   *   const resolvedReviews = useAsyncValue();
   *   return <div>...</div>;
   * }
   * ```
   */
  children: React.ReactNode | AwaitResolveRenderFunction<Resolve>;

  /**
   * The error element renders instead of the `children` when the [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   * rejects.
   *
   * ```tsx
   * <Await
   *   errorElement={<div>Oops</div>}
   *   resolve={reviewsPromise}
   * >
   *   <Reviews />
   * </Await>
   * ```
   *
   * To provide a more contextual error, you can use the {@link useAsyncError} in a
   * child component
   *
   * ```tsx
   * <Await
   *   errorElement={<ReviewsError />}
   *   resolve={reviewsPromise}
   * >
   *   <Reviews />
   * </Await>
   *
   * function ReviewsError() {
   *   const error = useAsyncError();
   *   return <div>Error loading reviews: {error.message}</div>;
   * }
   * ```
   *
   * If you do not provide an `errorElement`, the rejected value will bubble up
   * to the nearest route-level [`ErrorBoundary`](../../start/framework/route-module#errorboundary)
   * and be accessible via the {@link useRouteError} hook.
   */
  errorElement?: React.ReactNode;

  /**
   * Takes a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   * returned from a [`loader`](../../start/framework/route-module#loader) to be
   * resolved and rendered.
   *
   * ```tsx
   * import { Await, useLoaderData } from "react-router";
   *
   * export async function loader() {
   *   let reviews = getReviews(); // not awaited
   *   let book = await getBook();
   *   return {
   *     book,
   *     reviews, // this is a promise
   *   };
   * }
   *
   * export default function Book() {
   *   const {
   *     book,
   *     reviews, // this is the same promise
   *   } = useLoaderData();
   *
   *   return (
   *     <div>
   *       <h1>{book.title}</h1>
   *       <p>{book.description}</p>
   *       <React.Suspense fallback={<ReviewsSkeleton />}>
   *         <Await
   *           // and is the promise we pass to Await
   *           resolve={reviews}
   *         >
   *           <Reviews />
   *         </Await>
   *       </React.Suspense>
   *     </div>
   *   );
   * }
   * ```
   */
  resolve: Resolve;
}

/**
 * Used to render promise values with automatic error handling.
 *
 * **Note:** `<Await>` expects to be rendered inside a [`<React.Suspense>`](https://react.dev/reference/react/Suspense)
 *
 * @example
 * import { Await, useLoaderData } from "react-router";
 *
 * export async function loader() {
 *   // not awaited
 *   const reviews = getReviews();
 *   // awaited (blocks the transition)
 *   const book = await fetch("/api/book").then((res) => res.json());
 *   return { book, reviews };
 * }
 *
 * function Book() {
 *   const { book, reviews } = useLoaderData();
 *   return (
 *     <div>
 *       <h1>{book.title}</h1>
 *       <p>{book.description}</p>
 *       <React.Suspense fallback={<ReviewsSkeleton />}>
 *         <Await
 *           resolve={reviews}
 *           errorElement={
 *             <div>Could not load reviews 😬</div>
 *           }
 *           children={(resolvedReviews) => (
 *             <Reviews items={resolvedReviews} />
 *           )}
 *         />
 *       </React.Suspense>
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @mode data
 * @param props Props
 * @param {AwaitProps.children} props.children n/a
 * @param {AwaitProps.errorElement} props.errorElement n/a
 * @param {AwaitProps.resolve} props.resolve n/a
 * @returns React element for the rendered awaited value
 */
export function Await<Resolve>({
  children,
  errorElement,
  resolve,
}: AwaitProps<Resolve>) {
  let dataRouterContext = React.useContext(DataRouterContext);
  let dataRouterStateContext = React.useContext(DataRouterStateContext);

  let onError = React.useCallback(
    (error: unknown, errorInfo?: React.ErrorInfo) => {
      if (
        dataRouterContext &&
        dataRouterContext.onError &&
        dataRouterStateContext
      ) {
        dataRouterContext.onError(error, {
          location: dataRouterStateContext.location,
          params: dataRouterStateContext.matches[0]?.params || {},
          unstable_pattern: getRoutePattern(dataRouterStateContext.matches),
          errorInfo,
        });
      }
    },
    [dataRouterContext, dataRouterStateContext],
  );

  return (
    <AwaitErrorBoundary
      resolve={resolve}
      errorElement={errorElement}
      onError={onError}
    >
      <ResolveAwait>{children}</ResolveAwait>
    </AwaitErrorBoundary>
  );
}

type AwaitErrorBoundaryProps = React.PropsWithChildren<{
  errorElement?: React.ReactNode;
  resolve: TrackedPromise | any;
  onError?: (error: unknown, errorInfo?: React.ErrorInfo) => void;
}>;

type AwaitErrorBoundaryState = {
  error: any;
};

enum AwaitRenderStatus {
  pending,
  success,
  error,
}

class AwaitErrorBoundary extends React.Component<
  AwaitErrorBoundaryProps,
  AwaitErrorBoundaryState
> {
  constructor(props: AwaitErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      // Log render errors
      this.props.onError(error, errorInfo);
    } else {
      console.error(
        "<Await> caught the following error during render",
        error,
        errorInfo,
      );
    }
  }

  render() {
    let { children, errorElement, resolve } = this.props;

    let promise: TrackedPromise | null = null;
    let status: AwaitRenderStatus = AwaitRenderStatus.pending;

    if (!(resolve instanceof Promise)) {
      // Didn't get a promise - provide as a resolved promise
      status = AwaitRenderStatus.success;
      promise = Promise.resolve();
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_data", { get: () => resolve });
    } else if (this.state.error) {
      // Caught a render error, provide it as a rejected promise
      status = AwaitRenderStatus.error;
      let renderError = this.state.error;
      promise = Promise.reject().catch(() => {}); // Avoid unhandled rejection warnings
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_error", { get: () => renderError });
    } else if ((resolve as TrackedPromise)._tracked) {
      // Already tracked promise - check contents
      promise = resolve;
      status =
        "_error" in promise
          ? AwaitRenderStatus.error
          : "_data" in promise
            ? AwaitRenderStatus.success
            : AwaitRenderStatus.pending;
    } else {
      // Raw (untracked) promise - track it
      status = AwaitRenderStatus.pending;
      Object.defineProperty(resolve, "_tracked", { get: () => true });
      promise = resolve.then(
        (data: any) =>
          Object.defineProperty(resolve, "_data", { get: () => data }),
        (error: any) => {
          // Log promise rejections
          this.props.onError?.(error);
          Object.defineProperty(resolve, "_error", { get: () => error });
        },
      );
    }

    if (status === AwaitRenderStatus.error && !errorElement) {
      // No errorElement, throw to the nearest route-level error boundary
      throw promise._error;
    }

    if (status === AwaitRenderStatus.error) {
      // Render via our errorElement
      return <AwaitContext.Provider value={promise} children={errorElement} />;
    }

    if (status === AwaitRenderStatus.success) {
      // Render children with resolved value
      return <AwaitContext.Provider value={promise} children={children} />;
    }

    // Throw to the suspense boundary
    throw promise;
  }
}

// Indirection to leverage useAsyncValue for a render-prop API on `<Await>`
function ResolveAwait({
  children,
}: {
  children: React.ReactNode | AwaitResolveRenderFunction;
}) {
  let data = useAsyncValue();
  let toRender = typeof children === "function" ? children(data) : children;
  return <>{toRender}</>;
}

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @category Utils
 * @mode data
 * @param children The React children to convert into a route config
 * @param parentPath The path of the parent route, used to generate unique IDs.
 * @returns An array of {@link RouteObject}s that can be used with a {@link DataRouter}
 */
export function createRoutesFromChildren(
  children: React.ReactNode,
  parentPath: number[] = [],
): RouteObject[] {
  let routes: RouteObject[] = [];

  React.Children.forEach(children, (element, index) => {
    if (!React.isValidElement(element)) {
      // Ignore non-elements. This allows people to more easily inline
      // conditionals in their route config.
      return;
    }

    let treePath = [...parentPath, index];

    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children, treePath),
      );
      return;
    }

    invariant(
      element.type === Route,
      `[${
        typeof element.type === "string" ? element.type : element.type.name
      }] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`,
    );

    invariant(
      !element.props.index || !element.props.children,
      "An index route cannot have child routes.",
    );

    let route: RouteObject = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      Component: element.props.Component,
      index: element.props.index,
      path: element.props.path,
      middleware: element.props.middleware,
      loader: element.props.loader,
      action: element.props.action,
      hydrateFallbackElement: element.props.hydrateFallbackElement,
      HydrateFallback: element.props.HydrateFallback,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary:
        element.props.hasErrorBoundary === true ||
        element.props.ErrorBoundary != null ||
        element.props.errorElement != null,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
      lazy: element.props.lazy,
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(
        element.props.children,
        treePath,
      );
    }

    routes.push(route);
  });

  return routes;
}

/**
 * Create route objects from JSX elements instead of arrays of objects.
 *
 * @example
 * const routes = createRoutesFromElements(
 *   <>
 *     <Route index loader={step1Loader} Component={StepOne} />
 *     <Route path="step-2" loader={step2Loader} Component={StepTwo} />
 *     <Route path="step-3" loader={step3Loader} Component={StepThree} />
 *   </>
 * );
 *
 * const router = createBrowserRouter(routes);
 *
 * function App() {
 *   return <RouterProvider router={router} />;
 * }
 *
 * @name createRoutesFromElements
 * @public
 * @category Utils
 * @mode data
 * @param children The React children to convert into a route config
 * @param parentPath The path of the parent route, used to generate unique IDs.
 * This is used for internal recursion and is not intended to be used by the
 * application developer.
 * @returns An array of {@link RouteObject}s that can be used with a {@link DataRouter}
 */
export const createRoutesFromElements = createRoutesFromChildren;

/**
 * Renders the result of {@link matchRoutes} into a React element.
 *
 * @public
 * @category Utils
 * @param matches The array of {@link RouteMatch | route matches} to render
 * @returns A React element that renders the matched routes or `null` if no matches
 */
export function renderMatches(
  matches: RouteMatch[] | null,
): React.ReactElement | null {
  return _renderMatches(matches);
}

function useRouteComponentProps() {
  return {
    params: useParams(),
    loaderData: useLoaderData(),
    actionData: useActionData(),
    matches: useMatches(),
  };
}

export type RouteComponentProps = ReturnType<typeof useRouteComponentProps>;
export type RouteComponentType = React.ComponentType<RouteComponentProps>;

export function WithComponentProps({
  children,
}: {
  children: React.ReactElement;
}) {
  const props = useRouteComponentProps();
  return React.cloneElement(children, props);
}

export function withComponentProps(Component: RouteComponentType) {
  return function WithComponentProps() {
    const props = useRouteComponentProps();
    return React.createElement(Component, props);
  };
}

function useHydrateFallbackProps() {
  return {
    params: useParams(),
    loaderData: useLoaderData(),
    actionData: useActionData(),
  };
}

export type HydrateFallbackProps = ReturnType<typeof useHydrateFallbackProps>;
export type HydrateFallbackType = React.ComponentType<HydrateFallbackProps>;

export function WithHydrateFallbackProps({
  children,
}: {
  children: React.ReactElement;
}) {
  const props = useHydrateFallbackProps();
  return React.cloneElement(children, props);
}

export function withHydrateFallbackProps(HydrateFallback: HydrateFallbackType) {
  return function WithHydrateFallbackProps() {
    const props = useHydrateFallbackProps();
    return React.createElement(HydrateFallback, props);
  };
}

function useErrorBoundaryProps() {
  return {
    params: useParams(),
    loaderData: useLoaderData(),
    actionData: useActionData(),
    error: useRouteError(),
  };
}

export type ErrorBoundaryProps = ReturnType<typeof useErrorBoundaryProps>;
export type ErrorBoundaryType = React.ComponentType<ErrorBoundaryProps>;

export function WithErrorBoundaryProps({
  children,
}: {
  children: React.ReactElement;
}) {
  const props = useErrorBoundaryProps();
  return React.cloneElement(children, props);
}

export function withErrorBoundaryProps(ErrorBoundary: ErrorBoundaryType) {
  return function WithErrorBoundaryProps() {
    const props = useErrorBoundaryProps();
    return React.createElement(ErrorBoundary, props);
  };
}
