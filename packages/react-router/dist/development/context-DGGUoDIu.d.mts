import { m as HTMLFormMethod, n as FormEncType, o as LoaderFunctionArgs, p as MiddlewareEnabled, c as RouterContextProvider, q as AppLoadContext, r as RouteObject, s as History, t as MaybePromise, u as MapRoutePropertiesFunction, v as Action, L as Location, w as DataRouteMatch, x as Submission, y as RouteData, z as DataStrategyFunction, B as PatchRoutesOnNavigationFunction, E as DataRouteObject, U as UIMatch, T as To, I as Path, P as Params, J as InitialEntry, K as NonIndexRouteObject, O as LazyRouteFunction, Q as IndexRouteObject, V as RouteMatch, W as TrackedPromise } from './routeModules-BW4a8k3I.mjs';
import * as React from 'react';

type unstable_ServerInstrumentation = {
    handler?: unstable_InstrumentRequestHandlerFunction;
    route?: unstable_InstrumentRouteFunction;
};
type unstable_ClientInstrumentation = {
    router?: unstable_InstrumentRouterFunction;
    route?: unstable_InstrumentRouteFunction;
};
type unstable_InstrumentRequestHandlerFunction = (handler: InstrumentableRequestHandler) => void;
type unstable_InstrumentRouterFunction = (router: InstrumentableRouter) => void;
type unstable_InstrumentRouteFunction = (route: InstrumentableRoute) => void;
type unstable_InstrumentationHandlerResult = {
    status: "success";
    error: undefined;
} | {
    status: "error";
    error: Error;
};
type InstrumentFunction<T> = (handler: () => Promise<unstable_InstrumentationHandlerResult>, info: T) => Promise<void>;
type ReadonlyRequest = {
    method: string;
    url: string;
    headers: Pick<Headers, "get">;
};
type ReadonlyContext = MiddlewareEnabled extends true ? Pick<RouterContextProvider, "get"> : Readonly<AppLoadContext>;
type InstrumentableRoute = {
    id: string;
    index: boolean | undefined;
    path: string | undefined;
    instrument(instrumentations: RouteInstrumentations): void;
};
type RouteInstrumentations = {
    lazy?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.loader"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.action"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    "lazy.middleware"?: InstrumentFunction<RouteLazyInstrumentationInfo>;
    middleware?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
    loader?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
    action?: InstrumentFunction<RouteHandlerInstrumentationInfo>;
};
type RouteLazyInstrumentationInfo = undefined;
type RouteHandlerInstrumentationInfo = Readonly<{
    request: ReadonlyRequest;
    params: LoaderFunctionArgs["params"];
    unstable_pattern: string;
    context: ReadonlyContext;
}>;
type InstrumentableRouter = {
    instrument(instrumentations: RouterInstrumentations): void;
};
type RouterInstrumentations = {
    navigate?: InstrumentFunction<RouterNavigationInstrumentationInfo>;
    fetch?: InstrumentFunction<RouterFetchInstrumentationInfo>;
};
type RouterNavigationInstrumentationInfo = Readonly<{
    to: string | number;
    currentUrl: string;
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
    formData?: FormData;
    body?: any;
}>;
type RouterFetchInstrumentationInfo = Readonly<{
    href: string;
    currentUrl: string;
    fetcherKey: string;
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
    formData?: FormData;
    body?: any;
}>;
type InstrumentableRequestHandler = {
    instrument(instrumentations: RequestHandlerInstrumentations): void;
};
type RequestHandlerInstrumentations = {
    request?: InstrumentFunction<RequestHandlerInstrumentationInfo>;
};
type RequestHandlerInstrumentationInfo = Readonly<{
    request: ReadonlyRequest;
    context: ReadonlyContext | undefined;
}>;

/**
 * A Router instance manages all navigation and data loading/mutations
 */
interface Router$1 {
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the basename for the router
     */
    get basename(): RouterInit["basename"];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the future config for the router
     */
    get future(): FutureConfig;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the current state of the router
     */
    get state(): RouterState;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the routes for this router instance
     */
    get routes(): DataRouteObject[];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Return the window associated with the router
     */
    get window(): RouterInit["window"];
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Initialize the router, including adding history listeners and kicking off
     * initial data fetches.  Returns a function to cleanup listeners and abort
     * any in-progress loads
     */
    initialize(): Router$1;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Subscribe to router.state updates
     *
     * @param fn function to call with the new state
     */
    subscribe(fn: RouterSubscriber): () => void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Enable scroll restoration behavior in the router
     *
     * @param savedScrollPositions Object that will manage positions, in case
     *                             it's being restored from sessionStorage
     * @param getScrollPosition    Function to get the active Y scroll position
     * @param getKey               Function to get the key to use for restoration
     */
    enableScrollRestoration(savedScrollPositions: Record<string, number>, getScrollPosition: GetScrollPositionFunction, getKey?: GetScrollRestorationKeyFunction): () => void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Navigate forward/backward in the history stack
     * @param to Delta to move in the history stack
     */
    navigate(to: number): Promise<void>;
    /**
     * Navigate to the given path
     * @param to Path to navigate to
     * @param opts Navigation options (method, submission, etc.)
     */
    navigate(to: To | null, opts?: RouterNavigateOptions): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Trigger a fetcher load/submission
     *
     * @param key     Fetcher key
     * @param routeId Route that owns the fetcher
     * @param href    href to fetch
     * @param opts    Fetcher options, (method, submission, etc.)
     */
    fetch(key: string, routeId: string, href: string | null, opts?: RouterFetchOptions): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Trigger a revalidation of all current route loaders and fetcher loads
     */
    revalidate(): Promise<void>;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Utility function to create an href for the given location
     * @param location
     */
    createHref(location: Location | URL): string;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Utility function to URL encode a destination path according to the internal
     * history implementation
     * @param to
     */
    encodeLocation(to: To): Path;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Get/create a fetcher for the given key
     * @param key
     */
    getFetcher<TData = any>(key: string): Fetcher<TData>;
    /**
     * @internal
     * PRIVATE - DO NOT USE
     *
     * Reset the fetcher for a given key
     * @param key
     */
    resetFetcher(key: string, opts?: {
        reason?: unknown;
    }): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Delete the fetcher for a given key
     * @param key
     */
    deleteFetcher(key: string): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Cleanup listeners and abort any in-progress loads
     */
    dispose(): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Get a navigation blocker
     * @param key The identifier for the blocker
     * @param fn The blocker function implementation
     */
    getBlocker(key: string, fn: BlockerFunction): Blocker;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Delete a navigation blocker
     * @param key The identifier for the blocker
     */
    deleteBlocker(key: string): void;
    /**
     * @private
     * PRIVATE DO NOT USE
     *
     * Patch additional children routes into an existing parent route
     * @param routeId The parent route id or a callback function accepting `patch`
     *                to perform batch patching
     * @param children The additional children routes
     * @param unstable_allowElementMutations Allow mutation or route elements on
     *                                       existing routes. Intended for RSC-usage
     *                                       only.
     */
    patchRoutes(routeId: string | null, children: RouteObject[], unstable_allowElementMutations?: boolean): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * HMR needs to pass in-flight route updates to React Router
     * TODO: Replace this with granular route update APIs (addRoute, updateRoute, deleteRoute)
     */
    _internalSetRoutes(routes: RouteObject[]): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Cause subscribers to re-render.  This is used to force a re-render.
     */
    _internalSetStateDoNotUseOrYouWillBreakYourApp(state: Partial<RouterState>): void;
    /**
     * @private
     * PRIVATE - DO NOT USE
     *
     * Internal fetch AbortControllers accessed by unit tests
     */
    _internalFetchControllers: Map<string, AbortController>;
}
/**
 * State maintained internally by the router.  During a navigation, all states
 * reflect the "old" location unless otherwise noted.
 */
interface RouterState {
    /**
     * The action of the most recent navigation
     */
    historyAction: Action;
    /**
     * The current location reflected by the router
     */
    location: Location;
    /**
     * The current set of route matches
     */
    matches: DataRouteMatch[];
    /**
     * Tracks whether we've completed our initial data load
     */
    initialized: boolean;
    /**
     * Tracks whether we should be rendering a HydrateFallback during hydration
     */
    renderFallback: boolean;
    /**
     * Current scroll position we should start at for a new view
     *  - number -> scroll position to restore to
     *  - false -> do not restore scroll at all (used during submissions/revalidations)
     *  - null -> don't have a saved position, scroll to hash or top of page
     */
    restoreScrollPosition: number | false | null;
    /**
     * Indicate whether this navigation should skip resetting the scroll position
     * if we are unable to restore the scroll position
     */
    preventScrollReset: boolean;
    /**
     * Tracks the state of the current navigation
     */
    navigation: Navigation;
    /**
     * Tracks any in-progress revalidations
     */
    revalidation: RevalidationState;
    /**
     * Data from the loaders for the current matches
     */
    loaderData: RouteData;
    /**
     * Data from the action for the current matches
     */
    actionData: RouteData | null;
    /**
     * Errors caught from loaders for the current matches
     */
    errors: RouteData | null;
    /**
     * Map of current fetchers
     */
    fetchers: Map<string, Fetcher>;
    /**
     * Map of current blockers
     */
    blockers: Map<string, Blocker>;
}
/**
 * Data that can be passed into hydrate a Router from SSR
 */
type HydrationState = Partial<Pick<RouterState, "loaderData" | "actionData" | "errors">>;
/**
 * Future flags to toggle new feature behavior
 */
interface FutureConfig {
    unstable_passThroughRequests: boolean;
}
/**
 * Initialization options for createRouter
 */
interface RouterInit {
    routes: RouteObject[];
    history: History;
    basename?: string;
    getContext?: () => MaybePromise<RouterContextProvider>;
    unstable_instrumentations?: unstable_ClientInstrumentation[];
    mapRouteProperties?: MapRoutePropertiesFunction;
    future?: Partial<FutureConfig>;
    hydrationRouteProperties?: string[];
    hydrationData?: HydrationState;
    window?: Window;
    dataStrategy?: DataStrategyFunction;
    patchRoutesOnNavigation?: PatchRoutesOnNavigationFunction;
}
/**
 * State returned from a server-side query() call
 */
interface StaticHandlerContext {
    basename: Router$1["basename"];
    location: RouterState["location"];
    matches: RouterState["matches"];
    loaderData: RouterState["loaderData"];
    actionData: RouterState["actionData"];
    errors: RouterState["errors"];
    statusCode: number;
    loaderHeaders: Record<string, Headers>;
    actionHeaders: Record<string, Headers>;
    _deepestRenderedBoundaryId?: string | null;
}
/**
 * A StaticHandler instance manages a singular SSR navigation/fetch event
 */
interface StaticHandler {
    dataRoutes: DataRouteObject[];
    query(request: Request, opts?: {
        requestContext?: unknown;
        filterMatchesToLoad?: (match: DataRouteMatch) => boolean;
        skipLoaderErrorBubbling?: boolean;
        skipRevalidation?: boolean;
        dataStrategy?: DataStrategyFunction<unknown>;
        generateMiddlewareResponse?: (query: (r: Request, args?: {
            filterMatchesToLoad?: (match: DataRouteMatch) => boolean;
        }) => Promise<StaticHandlerContext | Response>) => MaybePromise<Response>;
        unstable_normalizePath?: (request: Request) => Path;
    }): Promise<StaticHandlerContext | Response>;
    queryRoute(request: Request, opts?: {
        routeId?: string;
        requestContext?: unknown;
        dataStrategy?: DataStrategyFunction<unknown>;
        generateMiddlewareResponse?: (queryRoute: (r: Request) => Promise<Response>) => MaybePromise<Response>;
        unstable_normalizePath?: (request: Request) => Path;
    }): Promise<any>;
}
type ViewTransitionOpts = {
    currentLocation: Location;
    nextLocation: Location;
};
/**
 * Subscriber function signature for changes to router state
 */
interface RouterSubscriber {
    (state: RouterState, opts: {
        deletedFetchers: string[];
        newErrors: RouteData | null;
        viewTransitionOpts?: ViewTransitionOpts;
        flushSync: boolean;
    }): void;
}
/**
 * Function signature for determining the key to be used in scroll restoration
 * for a given location
 */
interface GetScrollRestorationKeyFunction {
    (location: Location, matches: UIMatch[]): string | null;
}
/**
 * Function signature for determining the current scroll position
 */
interface GetScrollPositionFunction {
    (): number;
}
/**
 * - "route": relative to the route hierarchy so `..` means remove all segments
 * of the current route even if it has many. For example, a `route("posts/:id")`
 * would have both `:id` and `posts` removed from the url.
 * - "path": relative to the pathname so `..` means remove one segment of the
 * pathname. For example, a `route("posts/:id")` would have only `:id` removed
 * from the url.
 */
type RelativeRoutingType = "route" | "path";
type BaseNavigateOrFetchOptions = {
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    flushSync?: boolean;
    unstable_defaultShouldRevalidate?: boolean;
};
type BaseNavigateOptions = BaseNavigateOrFetchOptions & {
    replace?: boolean;
    state?: any;
    fromRouteId?: string;
    viewTransition?: boolean;
    unstable_mask?: To;
};
type BaseSubmissionOptions = {
    formMethod?: HTMLFormMethod;
    formEncType?: FormEncType;
} & ({
    formData: FormData;
    body?: undefined;
} | {
    formData?: undefined;
    body: any;
});
/**
 * Options for a navigate() call for a normal (non-submission) navigation
 */
type LinkNavigateOptions = BaseNavigateOptions;
/**
 * Options for a navigate() call for a submission navigation
 */
type SubmissionNavigateOptions = BaseNavigateOptions & BaseSubmissionOptions;
/**
 * Options to pass to navigate() for a navigation
 */
type RouterNavigateOptions = LinkNavigateOptions | SubmissionNavigateOptions;
/**
 * Options for a fetch() load
 */
type LoadFetchOptions = BaseNavigateOrFetchOptions;
/**
 * Options for a fetch() submission
 */
type SubmitFetchOptions = BaseNavigateOrFetchOptions & BaseSubmissionOptions;
/**
 * Options to pass to fetch()
 */
type RouterFetchOptions = LoadFetchOptions | SubmitFetchOptions;
/**
 * Potential states for state.navigation
 */
type NavigationStates = {
    Idle: {
        state: "idle";
        location: undefined;
        formMethod: undefined;
        formAction: undefined;
        formEncType: undefined;
        formData: undefined;
        json: undefined;
        text: undefined;
    };
    Loading: {
        state: "loading";
        location: Location;
        formMethod: Submission["formMethod"] | undefined;
        formAction: Submission["formAction"] | undefined;
        formEncType: Submission["formEncType"] | undefined;
        formData: Submission["formData"] | undefined;
        json: Submission["json"] | undefined;
        text: Submission["text"] | undefined;
    };
    Submitting: {
        state: "submitting";
        location: Location;
        formMethod: Submission["formMethod"];
        formAction: Submission["formAction"];
        formEncType: Submission["formEncType"];
        formData: Submission["formData"];
        json: Submission["json"];
        text: Submission["text"];
    };
};
type Navigation = NavigationStates[keyof NavigationStates];
type RevalidationState = "idle" | "loading";
/**
 * Potential states for fetchers
 */
type FetcherStates<TData = any> = {
    /**
     * The fetcher is not calling a loader or action
     *
     * ```tsx
     * fetcher.state === "idle"
     * ```
     */
    Idle: {
        state: "idle";
        formMethod: undefined;
        formAction: undefined;
        formEncType: undefined;
        text: undefined;
        formData: undefined;
        json: undefined;
        /**
         * If the fetcher has never been called, this will be undefined.
         */
        data: TData | undefined;
    };
    /**
     * The fetcher is loading data from a {@link LoaderFunction | loader} from a
     * call to {@link FetcherWithComponents.load | `fetcher.load`}.
     *
     * ```tsx
     * // somewhere
     * <button onClick={() => fetcher.load("/some/route") }>Load</button>
     *
     * // the state will update
     * fetcher.state === "loading"
     * ```
     */
    Loading: {
        state: "loading";
        formMethod: Submission["formMethod"] | undefined;
        formAction: Submission["formAction"] | undefined;
        formEncType: Submission["formEncType"] | undefined;
        text: Submission["text"] | undefined;
        formData: Submission["formData"] | undefined;
        json: Submission["json"] | undefined;
        data: TData | undefined;
    };
    /**
      The fetcher is submitting to a {@link LoaderFunction} (GET) or {@link ActionFunction} (POST) from a {@link FetcherWithComponents.Form | `fetcher.Form`} or {@link FetcherWithComponents.submit | `fetcher.submit`}.
  
      ```tsx
      // somewhere
      <input
        onChange={e => {
          fetcher.submit(event.currentTarget.form, { method: "post" });
        }}
      />
  
      // the state will update
      fetcher.state === "submitting"
  
      // and formData will be available
      fetcher.formData
      ```
     */
    Submitting: {
        state: "submitting";
        formMethod: Submission["formMethod"];
        formAction: Submission["formAction"];
        formEncType: Submission["formEncType"];
        text: Submission["text"];
        formData: Submission["formData"];
        json: Submission["json"];
        data: TData | undefined;
    };
};
type Fetcher<TData = any> = FetcherStates<TData>[keyof FetcherStates<TData>];
interface BlockerBlocked {
    state: "blocked";
    reset: () => void;
    proceed: () => void;
    location: Location;
}
interface BlockerUnblocked {
    state: "unblocked";
    reset: undefined;
    proceed: undefined;
    location: undefined;
}
interface BlockerProceeding {
    state: "proceeding";
    reset: undefined;
    proceed: undefined;
    location: Location;
}
type Blocker = BlockerUnblocked | BlockerBlocked | BlockerProceeding;
type BlockerFunction = (args: {
    currentLocation: Location;
    nextLocation: Location;
    historyAction: Action;
}) => boolean;
declare const IDLE_NAVIGATION: NavigationStates["Idle"];
declare const IDLE_FETCHER: FetcherStates["Idle"];
declare const IDLE_BLOCKER: BlockerUnblocked;
/**
 * Create a router and listen to history POP navigations
 */
declare function createRouter(init: RouterInit): Router$1;
interface CreateStaticHandlerOptions {
    basename?: string;
    mapRouteProperties?: MapRoutePropertiesFunction;
    unstable_instrumentations?: Pick<unstable_ServerInstrumentation, "route">[];
    future?: Partial<FutureConfig>;
}

declare function mapRouteProperties(route: RouteObject): Partial<RouteObject> & {
    hasErrorBoundary: boolean;
};
declare const hydrationRouteProperties: (keyof RouteObject)[];
/**
 * @category Data Routers
 */
interface MemoryRouterOpts {
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
declare function createMemoryRouter(routes: RouteObject[], opts?: MemoryRouterOpts): Router$1;
/**
 * Function signature for client side error handling for loader/actions errors
 * and rendering errors via `componentDidCatch`
 */
interface ClientOnErrorFunction {
    (error: unknown, info: {
        location: Location;
        params: Params;
        unstable_pattern: string;
        errorInfo?: React.ErrorInfo;
    }): void;
}
/**
 * @category Types
 */
interface RouterProviderProps {
    /**
     * The {@link DataRouter} instance to use for navigation and data fetching.
     */
    router: Router$1;
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
declare function RouterProvider({ router, flushSync: reactDomFlushSyncImpl, onError, unstable_useTransitions, }: RouterProviderProps): React.ReactElement;
/**
 * @category Types
 */
interface MemoryRouterProps {
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
declare function MemoryRouter({ basename, children, initialEntries, initialIndex, unstable_useTransitions, }: MemoryRouterProps): React.ReactElement;
/**
 * @category Types
 */
interface NavigateProps {
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
declare function Navigate({ to, replace, state, relative, }: NavigateProps): null;
/**
 * @category Types
 */
interface OutletProps {
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
declare function Outlet(props: OutletProps): React.ReactElement | null;
/**
 * @category Types
 */
interface PathRouteProps {
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
interface LayoutRouteProps extends PathRouteProps {
}
/**
 * @category Types
 */
interface IndexRouteProps {
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
/**
 * @category Types
 */
type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps;
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
declare function Route(props: RouteProps): React.ReactElement | null;
/**
 * @category Types
 */
interface RouterProps {
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
    navigationType?: Action;
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
declare function Router({ basename: basenameProp, children, location: locationProp, navigationType, navigator, static: staticProp, unstable_useTransitions, }: RouterProps): React.ReactElement | null;
/**
 * @category Types
 */
interface RoutesProps {
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
declare function Routes({ children, location, }: RoutesProps): React.ReactElement | null;
interface AwaitResolveRenderFunction<Resolve = any> {
    (data: Awaited<Resolve>): React.ReactNode;
}
/**
 * @category Types
 */
interface AwaitProps<Resolve> {
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
declare function Await<Resolve>({ children, errorElement, resolve, }: AwaitProps<Resolve>): React.JSX.Element;
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
declare function createRoutesFromChildren(children: React.ReactNode, parentPath?: number[]): RouteObject[];
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
declare const createRoutesFromElements: typeof createRoutesFromChildren;
/**
 * Renders the result of {@link matchRoutes} into a React element.
 *
 * @public
 * @category Utils
 * @param matches The array of {@link RouteMatch | route matches} to render
 * @returns A React element that renders the matched routes or `null` if no matches
 */
declare function renderMatches(matches: RouteMatch[] | null): React.ReactElement | null;
declare function useRouteComponentProps(): {
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
    matches: UIMatch<unknown, unknown>[];
};
type RouteComponentProps = ReturnType<typeof useRouteComponentProps>;
type RouteComponentType = React.ComponentType<RouteComponentProps>;
declare function WithComponentProps({ children, }: {
    children: React.ReactElement;
}): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
declare function withComponentProps(Component: RouteComponentType): () => React.ReactElement<{
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
    matches: UIMatch<unknown, unknown>[];
}, string | React.JSXElementConstructor<any>>;
declare function useHydrateFallbackProps(): {
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
};
type HydrateFallbackProps = ReturnType<typeof useHydrateFallbackProps>;
type HydrateFallbackType = React.ComponentType<HydrateFallbackProps>;
declare function WithHydrateFallbackProps({ children, }: {
    children: React.ReactElement;
}): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
declare function withHydrateFallbackProps(HydrateFallback: HydrateFallbackType): () => React.ReactElement<{
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
}, string | React.JSXElementConstructor<any>>;
declare function useErrorBoundaryProps(): {
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
    error: unknown;
};
type ErrorBoundaryProps = ReturnType<typeof useErrorBoundaryProps>;
type ErrorBoundaryType = React.ComponentType<ErrorBoundaryProps>;
declare function WithErrorBoundaryProps({ children, }: {
    children: React.ReactElement;
}): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
declare function withErrorBoundaryProps(ErrorBoundary: ErrorBoundaryType): () => React.ReactElement<{
    params: Readonly<Params<string>>;
    loaderData: any;
    actionData: any;
    error: unknown;
}, string | React.JSXElementConstructor<any>>;

interface DataRouterContextObject extends Omit<NavigationContextObject, "future" | "unstable_useTransitions"> {
    router: Router$1;
    staticContext?: StaticHandlerContext;
    onError?: ClientOnErrorFunction;
}
declare const DataRouterContext: React.Context<DataRouterContextObject | null>;
declare const DataRouterStateContext: React.Context<RouterState | null>;
type ViewTransitionContextObject = {
    isTransitioning: false;
} | {
    isTransitioning: true;
    flushSync: boolean;
    currentLocation: Location;
    nextLocation: Location;
};
declare const ViewTransitionContext: React.Context<ViewTransitionContextObject>;
type FetchersContextObject = Map<string, any>;
declare const FetchersContext: React.Context<FetchersContextObject>;
declare const AwaitContext: React.Context<TrackedPromise | null>;
declare const AwaitContextProvider: (props: React.ComponentProps<typeof AwaitContext.Provider>) => React.FunctionComponentElement<React.ProviderProps<TrackedPromise | null>>;
interface NavigateOptions {
    /** Replace the current entry in the history stack instead of pushing a new one */
    replace?: boolean;
    /** Masked URL */
    unstable_mask?: To;
    /** Adds persistent client side routing state to the next location */
    state?: any;
    /** If you are using {@link ScrollRestoration `<ScrollRestoration>`}, prevent the scroll position from being reset to the top of the window when navigating */
    preventScrollReset?: boolean;
    /** Defines the relative path behavior for the link. "route" will use the route hierarchy so ".." will remove all URL segments of the current route pattern while "path" will use the URL path so ".." will remove one URL segment. */
    relative?: RelativeRoutingType;
    /** Wraps the initial state update for this navigation in a {@link https://react.dev/reference/react-dom/flushSync ReactDOM.flushSync} call instead of the default {@link https://react.dev/reference/react/startTransition React.startTransition} */
    flushSync?: boolean;
    /** Enables a {@link https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API View Transition} for this navigation by wrapping the final state update in `document.startViewTransition()`. If you need to apply specific styles for this view transition, you will also need to leverage the {@link useViewTransitionState `useViewTransitionState()`} hook.  */
    viewTransition?: boolean;
    /** Specifies the default revalidation behavior after this submission */
    unstable_defaultShouldRevalidate?: boolean;
}
/**
 * A Navigator is a "location changer"; it's how you get to different locations.
 *
 * Every history instance conforms to the Navigator interface, but the
 * distinction is useful primarily when it comes to the low-level `<Router>` API
 * where both the location and a navigator must be provided separately in order
 * to avoid "tearing" that may occur in a suspense-enabled app if the action
 * and/or location were to be read directly from the history instance.
 */
interface Navigator {
    createHref: History["createHref"];
    encodeLocation?: History["encodeLocation"];
    go: History["go"];
    push(to: To, state?: any, opts?: NavigateOptions): void;
    replace(to: To, state?: any, opts?: NavigateOptions): void;
}
interface NavigationContextObject {
    basename: string;
    navigator: Navigator;
    static: boolean;
    unstable_useTransitions: boolean | undefined;
    future: {};
}
declare const NavigationContext: React.Context<NavigationContextObject>;
interface LocationContextObject {
    location: Location;
    navigationType: Action;
}
declare const LocationContext: React.Context<LocationContextObject>;
interface RouteContextObject {
    outlet: React.ReactElement | null;
    matches: RouteMatch[];
    isDataRoute: boolean;
}
declare const RouteContext: React.Context<RouteContextObject>;

export { createRoutesFromElements as $, AwaitContextProvider as A, type BlockerFunction as B, type ClientOnErrorFunction as C, type RouteProps as D, type RouterProps as E, type Fetcher as F, type GetScrollPositionFunction as G, type HydrationState as H, IDLE_NAVIGATION as I, type RoutesProps as J, Await as K, type LayoutRouteProps as L, type MemoryRouterOpts as M, type NavigateOptions as N, type OutletProps as O, type PathRouteProps as P, MemoryRouter as Q, type RouterInit as R, type StaticHandler as S, Navigate as T, Outlet as U, Route as V, Router as W, RouterProvider as X, Routes as Y, createMemoryRouter as Z, createRoutesFromChildren as _, type RouterProviderProps as a, renderMatches as a0, createRouter as a1, DataRouterContext as a2, DataRouterStateContext as a3, FetchersContext as a4, LocationContext as a5, NavigationContext as a6, RouteContext as a7, ViewTransitionContext as a8, hydrationRouteProperties as a9, mapRouteProperties as aa, WithComponentProps as ab, withComponentProps as ac, WithHydrateFallbackProps as ad, withHydrateFallbackProps as ae, WithErrorBoundaryProps as af, withErrorBoundaryProps as ag, type FutureConfig as ah, type CreateStaticHandlerOptions as ai, type Router$1 as b, type Blocker as c, type RelativeRoutingType as d, type Navigation as e, type RouterState as f, type GetScrollRestorationKeyFunction as g, type StaticHandlerContext as h, type NavigationStates as i, type RouterSubscriber as j, type RouterNavigateOptions as k, type RouterFetchOptions as l, type RevalidationState as m, type unstable_ServerInstrumentation as n, type unstable_InstrumentRequestHandlerFunction as o, type unstable_InstrumentRouterFunction as p, type unstable_InstrumentRouteFunction as q, type unstable_InstrumentationHandlerResult as r, IDLE_FETCHER as s, IDLE_BLOCKER as t, type unstable_ClientInstrumentation as u, type Navigator as v, type AwaitProps as w, type IndexRouteProps as x, type MemoryRouterProps as y, type NavigateProps as z };
