import type { History, Location, Path, To } from "./history";
import {
  Action as NavigationType,
  createLocation,
  createPath,
  invariant,
  parsePath,
  warning,
} from "./history";
import type {
  AgnosticDataRouteMatch,
  AgnosticDataRouteObject,
  DataStrategyMatch,
  AgnosticRouteObject,
  DataResult,
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  ErrorResult,
  FormEncType,
  FormMethod,
  HTMLFormMethod,
  DataStrategyResult,
  ImmutableRouteKey,
  MapRoutePropertiesFunction,
  MutationFormMethod,
  RedirectResult,
  RouteData,
  RouteManifest,
  ShouldRevalidateFunctionArgs,
  Submission,
  SuccessResult,
  UIMatch,
  AgnosticPatchRoutesOnNavigationFunction,
  DataWithResponseInit,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  LoaderFunction,
  ActionFunction,
  unstable_MiddlewareFunction,
  unstable_MiddlewareNextFunction,
  unstable_InitialContext,
} from "./utils";
import {
  ErrorResponseImpl,
  ResultType,
  convertRouteMatchToUiMatch,
  convertRoutesToDataRoutes,
  getPathContributingMatches,
  getResolveToMatches,
  immutableRouteKeys,
  isRouteErrorResponse,
  joinPaths,
  matchRoutes,
  matchRoutesImpl,
  resolveTo,
  stripBasename,
  unstable_RouterContextProvider,
} from "./utils";

////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////

type MaybePromise<T> = T | Promise<T>;

/**
 * A Router instance manages all navigation and data loading/mutations
 */
export interface Router {
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
  get routes(): AgnosticDataRouteObject[];

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
  initialize(): Router;

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
  enableScrollRestoration(
    savedScrollPositions: Record<string, number>,
    getScrollPosition: GetScrollPositionFunction,
    getKey?: GetScrollRestorationKeyFunction
  ): () => void;

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
  fetch(
    key: string,
    routeId: string,
    href: string | null,
    opts?: RouterFetchOptions
  ): Promise<void>;

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
   */
  patchRoutes(routeId: string | null, children: AgnosticRouteObject[]): void;

  /**
   * @private
   * PRIVATE - DO NOT USE
   *
   * HMR needs to pass in-flight route updates to React Router
   * TODO: Replace this with granular route update APIs (addRoute, updateRoute, deleteRoute)
   */
  _internalSetRoutes(routes: AgnosticRouteObject[]): void;

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
export interface RouterState {
  // TODO: (v7) should we consider renaming this `navigationType` to align with
  // `useNavigationType` at some point?
  /**
   * The action of the most recent navigation
   */
  historyAction: NavigationType;

  /**
   * The current location reflected by the router
   */
  location: Location;

  /**
   * The current set of route matches
   */
  matches: AgnosticDataRouteMatch[];

  /**
   * Tracks whether we've completed our initial data load
   */
  initialized: boolean;

  /**
   * Current scroll position we should start at for a new view
   *  - number -> scroll position to restore to
   *  - false -> do not restore scroll at all (used during submissions)
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
export type HydrationState = Partial<
  Pick<RouterState, "loaderData" | "actionData" | "errors">
>;

/**
 * Future flags to toggle new feature behavior
 */
export interface FutureConfig {
  unstable_middleware: boolean;
}

/**
 * Initialization options for createRouter
 */
export interface RouterInit {
  routes: AgnosticRouteObject[];
  history: History;
  basename?: string;
  unstable_getContext?: () => MaybePromise<unstable_InitialContext>;
  mapRouteProperties?: MapRoutePropertiesFunction;
  future?: Partial<FutureConfig>;
  hydrationData?: HydrationState;
  window?: Window;
  dataStrategy?: DataStrategyFunction;
  patchRoutesOnNavigation?: AgnosticPatchRoutesOnNavigationFunction;
}

/**
 * State returned from a server-side query() call
 */
export interface StaticHandlerContext {
  basename: Router["basename"];
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
export interface StaticHandler {
  dataRoutes: AgnosticDataRouteObject[];
  query(
    request: Request,
    opts?: {
      requestContext?: unknown;
      filterMatchesToLoad?: (match: AgnosticDataRouteMatch) => boolean;
      skipLoaderErrorBubbling?: boolean;
      skipRevalidation?: boolean;
      dataStrategy?: DataStrategyFunction<unknown>;
      unstable_respond?: (
        staticContext: StaticHandlerContext
      ) => MaybePromise<Response>;
    }
  ): Promise<StaticHandlerContext | Response>;
  queryRoute(
    request: Request,
    opts?: {
      routeId?: string;
      requestContext?: unknown;
      dataStrategy?: DataStrategyFunction<unknown>;
      unstable_respond?: (res: Response) => MaybePromise<Response>;
    }
  ): Promise<any>;
}

type ViewTransitionOpts = {
  currentLocation: Location;
  nextLocation: Location;
};

/**
 * Subscriber function signature for changes to router state
 */
export interface RouterSubscriber {
  (
    state: RouterState,
    opts: {
      deletedFetchers: string[];
      viewTransitionOpts?: ViewTransitionOpts;
      flushSync: boolean;
    }
  ): void;
}

/**
 * Function signature for determining the key to be used in scroll restoration
 * for a given location
 */
export interface GetScrollRestorationKeyFunction {
  (location: Location, matches: UIMatch[]): string | null;
}

/**
 * Function signature for determining the current scroll position
 */
export interface GetScrollPositionFunction {
  (): number;
}

/**
  - "route": relative to the route hierarchy so `..` means remove all segments of the current route even if it has many. For example, a `route("posts/:id")` would have both `:id` and `posts` removed from the url.
  - "path": relative to the pathname so `..` means remove one segment of the pathname. For example, a `route("posts/:id")` would have only `:id` removed from the url.
 */
export type RelativeRoutingType = "route" | "path";

// Allowed for any navigation or fetch
type BaseNavigateOrFetchOptions = {
  preventScrollReset?: boolean;
  relative?: RelativeRoutingType;
  flushSync?: boolean;
};

// Only allowed for navigations
type BaseNavigateOptions = BaseNavigateOrFetchOptions & {
  replace?: boolean;
  state?: any;
  fromRouteId?: string;
  viewTransition?: boolean;
};

// Only allowed for submission navigations
type BaseSubmissionOptions = {
  formMethod?: HTMLFormMethod;
  formEncType?: FormEncType;
} & (
  | { formData: FormData; body?: undefined }
  | { formData?: undefined; body: any }
);

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
export type RouterNavigateOptions =
  | LinkNavigateOptions
  | SubmissionNavigateOptions;

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
export type RouterFetchOptions = LoadFetchOptions | SubmitFetchOptions;

/**
 * Potential states for state.navigation
 */
export type NavigationStates = {
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

export type Navigation = NavigationStates[keyof NavigationStates];

export type RevalidationState = "idle" | "loading";

/**
 * Potential states for fetchers
 */
export type FetcherStates<TData = any> = {
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

export type Fetcher<TData = any> =
  FetcherStates<TData>[keyof FetcherStates<TData>];

interface BlockerBlocked {
  state: "blocked";
  reset(): void;
  proceed(): void;
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

export type Blocker = BlockerUnblocked | BlockerBlocked | BlockerProceeding;

export type BlockerFunction = (args: {
  currentLocation: Location;
  nextLocation: Location;
  historyAction: NavigationType;
}) => boolean;

interface ShortCircuitable {
  /**
   * startNavigation does not need to complete the navigation because we
   * redirected or got interrupted
   */
  shortCircuited?: boolean;
}

type PendingActionResult = [string, SuccessResult | ErrorResult];

interface HandleActionResult extends ShortCircuitable {
  /**
   * Route matches which may have been updated from fog of war discovery
   */
  matches?: RouterState["matches"];
  /**
   * Tuple for the returned or thrown value from the current action.  The routeId
   * is the action route for success and the bubbled boundary route for errors.
   */
  pendingActionResult?: PendingActionResult;
}

interface HandleLoadersResult extends ShortCircuitable {
  /**
   * Route matches which may have been updated from fog of war discovery
   */
  matches?: RouterState["matches"];
  /**
   * loaderData returned from the current set of loaders
   */
  loaderData?: RouterState["loaderData"];
  /**
   * errors thrown from the current set of loaders
   */
  errors?: RouterState["errors"];
}

/**
 * Cached info for active fetcher.load() instances so they can participate
 * in revalidation
 */
interface FetchLoadMatch {
  routeId: string;
  path: string;
}

/**
 * Identified fetcher.load() calls that need to be revalidated
 */
interface RevalidatingFetcher extends FetchLoadMatch {
  key: string;
  match: AgnosticDataRouteMatch | null;
  matches: AgnosticDataRouteMatch[] | null;
  controller: AbortController | null;
}

const validMutationMethodsArr: MutationFormMethod[] = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];
const validMutationMethods = new Set<MutationFormMethod>(
  validMutationMethodsArr
);

const validRequestMethodsArr: FormMethod[] = [
  "GET",
  ...validMutationMethodsArr,
];
const validRequestMethods = new Set<FormMethod>(validRequestMethodsArr);

export const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
const redirectPreserveMethodStatusCodes = new Set([307, 308]);

export const IDLE_NAVIGATION: NavigationStates["Idle"] = {
  state: "idle",
  location: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
  json: undefined,
  text: undefined,
};

export const IDLE_FETCHER: FetcherStates["Idle"] = {
  state: "idle",
  data: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
  json: undefined,
  text: undefined,
};

export const IDLE_BLOCKER: BlockerUnblocked = {
  state: "unblocked",
  proceed: undefined,
  reset: undefined,
  location: undefined,
};

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

const defaultMapRouteProperties: MapRoutePropertiesFunction = (route) => ({
  hasErrorBoundary: Boolean(route.hasErrorBoundary),
});

const TRANSITIONS_STORAGE_KEY = "remix-router-transitions";

// Flag used on new `loaderData` to indicate that we do not want to preserve
// any prior loader data from the throwing route in `mergeLoaderData`
const ResetLoaderDataSymbol = Symbol("ResetLoaderData");

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region createRouter
////////////////////////////////////////////////////////////////////////////////

/**
 * Create a router and listen to history POP navigations
 */
export function createRouter(init: RouterInit): Router {
  const routerWindow = init.window
    ? init.window
    : typeof window !== "undefined"
    ? window
    : undefined;
  const isBrowser =
    typeof routerWindow !== "undefined" &&
    typeof routerWindow.document !== "undefined" &&
    typeof routerWindow.document.createElement !== "undefined";

  invariant(
    init.routes.length > 0,
    "You must provide a non-empty routes array to createRouter"
  );

  let mapRouteProperties = init.mapRouteProperties || defaultMapRouteProperties;

  // Routes keyed by ID
  let manifest: RouteManifest = {};
  // Routes in tree format for matching
  let dataRoutes = convertRoutesToDataRoutes(
    init.routes,
    mapRouteProperties,
    undefined,
    manifest
  );
  let inFlightDataRoutes: AgnosticDataRouteObject[] | undefined;
  let basename = init.basename || "/";
  let dataStrategyImpl = init.dataStrategy || defaultDataStrategyWithMiddleware;

  // Config driven behavior flags
  let future: FutureConfig = {
    unstable_middleware: false,
    ...init.future,
  };
  // Cleanup function for history
  let unlistenHistory: (() => void) | null = null;
  // Externally-provided functions to call on all state changes
  let subscribers = new Set<RouterSubscriber>();
  // Externally-provided object to hold scroll restoration locations during routing
  let savedScrollPositions: Record<string, number> | null = null;
  // Externally-provided function to get scroll restoration keys
  let getScrollRestorationKey: GetScrollRestorationKeyFunction | null = null;
  // Externally-provided function to get current scroll position
  let getScrollPosition: GetScrollPositionFunction | null = null;
  // One-time flag to control the initial hydration scroll restoration.  Because
  // we don't get the saved positions from <ScrollRestoration /> until _after_
  // the initial render, we need to manually trigger a separate updateState to
  // send along the restoreScrollPosition
  // Set to true if we have `hydrationData` since we assume we were SSR'd and that
  // SSR did the initial scroll restoration.
  let initialScrollRestored = init.hydrationData != null;

  let initialMatches = matchRoutes(dataRoutes, init.history.location, basename);
  let initialMatchesIsFOW = false;
  let initialErrors: RouteData | null = null;

  if (initialMatches == null && !init.patchRoutesOnNavigation) {
    // If we do not match a user-provided-route, fall back to the root
    // to allow the error boundary to take over
    let error = getInternalRouterError(404, {
      pathname: init.history.location.pathname,
    });
    let { matches, route } = getShortCircuitMatches(dataRoutes);
    initialMatches = matches;
    initialErrors = { [route.id]: error };
  }

  // In SPA apps, if the user provided a patchRoutesOnNavigation implementation and
  // our initial match is a splat route, clear them out so we run through lazy
  // discovery on hydration in case there's a more accurate lazy route match.
  // In SSR apps (with `hydrationData`), we expect that the server will send
  // up the proper matched routes so we don't want to run lazy discovery on
  // initial hydration and want to hydrate into the splat route.
  if (initialMatches && !init.hydrationData) {
    let fogOfWar = checkFogOfWar(
      initialMatches,
      dataRoutes,
      init.history.location.pathname
    );
    if (fogOfWar.active) {
      initialMatches = null;
    }
  }

  let initialized: boolean;
  if (!initialMatches) {
    initialized = false;
    initialMatches = [];

    // If partial hydration and fog of war is enabled, we will be running
    // `patchRoutesOnNavigation` during hydration so include any partial matches as
    // the initial matches so we can properly render `HydrateFallback`'s
    let fogOfWar = checkFogOfWar(
      null,
      dataRoutes,
      init.history.location.pathname
    );
    if (fogOfWar.active && fogOfWar.matches) {
      initialMatchesIsFOW = true;
      initialMatches = fogOfWar.matches;
    }
  } else if (initialMatches.some((m) => m.route.lazy)) {
    // All initialMatches need to be loaded before we're ready.  If we have lazy
    // functions around still then we'll need to run them in initialize()
    initialized = false;
  } else if (!initialMatches.some((m) => m.route.loader)) {
    // If we've got no loaders to run, then we're good to go
    initialized = true;
  } else {
    // With "partial hydration", we're initialized so long as we were
    // provided with hydrationData for every route with a loader, and no loaders
    // were marked for explicit hydration
    let loaderData = init.hydrationData ? init.hydrationData.loaderData : null;
    let errors = init.hydrationData ? init.hydrationData.errors : null;
    // If errors exist, don't consider routes below the boundary
    if (errors) {
      let idx = initialMatches.findIndex(
        (m) => errors![m.route.id] !== undefined
      );
      initialized = initialMatches
        .slice(0, idx + 1)
        .every((m) => !shouldLoadRouteOnHydration(m.route, loaderData, errors));
    } else {
      initialized = initialMatches.every(
        (m) => !shouldLoadRouteOnHydration(m.route, loaderData, errors)
      );
    }
  }

  let router: Router;
  let state: RouterState = {
    historyAction: init.history.action,
    location: init.history.location,
    matches: initialMatches,
    initialized,
    navigation: IDLE_NAVIGATION,
    // Don't restore on initial updateState() if we were SSR'd
    restoreScrollPosition: init.hydrationData != null ? false : null,
    preventScrollReset: false,
    revalidation: "idle",
    loaderData: (init.hydrationData && init.hydrationData.loaderData) || {},
    actionData: (init.hydrationData && init.hydrationData.actionData) || null,
    errors: (init.hydrationData && init.hydrationData.errors) || initialErrors,
    fetchers: new Map(),
    blockers: new Map(),
  };

  // -- Stateful internal variables to manage navigations --
  // Current navigation in progress (to be committed in completeNavigation)
  let pendingAction: NavigationType = NavigationType.Pop;

  // Should the current navigation prevent the scroll reset if scroll cannot
  // be restored?
  let pendingPreventScrollReset = false;

  // AbortController for the active navigation
  let pendingNavigationController: AbortController | null;

  // Should the current navigation enable document.startViewTransition?
  let pendingViewTransitionEnabled = false;

  // Store applied view transitions so we can apply them on POP
  let appliedViewTransitions: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  // Cleanup function for persisting applied transitions to sessionStorage
  let removePageHideEventListener: (() => void) | null = null;

  // We use this to avoid touching history in completeNavigation if a
  // revalidation is entirely uninterrupted
  let isUninterruptedRevalidation = false;

  // Use this internal flag to force revalidation of all loaders:
  //  - submissions (completed or interrupted)
  //  - useRevalidator()
  //  - X-Remix-Revalidate (from redirect)
  let isRevalidationRequired = false;

  // Use this internal array to capture fetcher loads that were cancelled by an
  // action navigation and require revalidation
  let cancelledFetcherLoads: Set<string> = new Set();

  // AbortControllers for any in-flight fetchers
  let fetchControllers = new Map<string, AbortController>();

  // Track loads based on the order in which they started
  let incrementingLoadId = 0;

  // Track the outstanding pending navigation data load to be compared against
  // the globally incrementing load when a fetcher load lands after a completed
  // navigation
  let pendingNavigationLoadId = -1;

  // Fetchers that triggered data reloads as a result of their actions
  let fetchReloadIds = new Map<string, number>();

  // Fetchers that triggered redirect navigations
  let fetchRedirectIds = new Set<string>();

  // Most recent href/match for fetcher.load calls for fetchers
  let fetchLoadMatches = new Map<string, FetchLoadMatch>();

  // Ref-count mounted fetchers so we know when it's ok to clean them up
  let activeFetchers = new Map<string, number>();

  // Fetchers queued for deletion because they've been removed from the UI.
  // These will be officially deleted after they return to idle
  let fetchersQueuedForDeletion = new Set<string>();

  // Store blocker functions in a separate Map outside of router state since
  // we don't need to update UI state if they change
  let blockerFunctions = new Map<string, BlockerFunction>();

  // Flag to ignore the next history update, so we can revert the URL change on
  // a POP navigation that was blocked by the user without touching router state
  let unblockBlockerHistoryUpdate: (() => void) | undefined = undefined;

  let pendingRevalidationDfd: ReturnType<typeof createDeferred<void>> | null =
    null;

  // Initialize the router, all side effects should be kicked off from here.
  // Implemented as a Fluent API for ease of:
  //   let router = createRouter(init).initialize();
  function initialize() {
    // If history informs us of a POP navigation, start the navigation but do not update
    // state.  We'll update our own state once the navigation completes
    unlistenHistory = init.history.listen(
      ({ action: historyAction, location, delta }) => {
        // Ignore this event if it was just us resetting the URL from a
        // blocked POP navigation
        if (unblockBlockerHistoryUpdate) {
          unblockBlockerHistoryUpdate();
          unblockBlockerHistoryUpdate = undefined;
          return;
        }

        warning(
          blockerFunctions.size === 0 || delta != null,
          "You are trying to use a blocker on a POP navigation to a location " +
            "that was not created by @remix-run/router. This will fail silently in " +
            "production. This can happen if you are navigating outside the router " +
            "via `window.history.pushState`/`window.location.hash` instead of using " +
            "router navigation APIs.  This can also happen if you are using " +
            "createHashRouter and the user manually changes the URL."
        );

        let blockerKey = shouldBlockNavigation({
          currentLocation: state.location,
          nextLocation: location,
          historyAction,
        });

        if (blockerKey && delta != null) {
          // Restore the URL to match the current UI, but don't update router state
          let nextHistoryUpdatePromise = new Promise<void>((resolve) => {
            unblockBlockerHistoryUpdate = resolve;
          });
          init.history.go(delta * -1);

          // Put the blocker into a blocked state
          updateBlocker(blockerKey, {
            state: "blocked",
            location,
            proceed() {
              updateBlocker(blockerKey!, {
                state: "proceeding",
                proceed: undefined,
                reset: undefined,
                location,
              });
              // Re-do the same POP navigation we just blocked, after the url
              // restoration is also complete.  See:
              // https://github.com/remix-run/react-router/issues/11613
              nextHistoryUpdatePromise.then(() => init.history.go(delta));
            },
            reset() {
              let blockers = new Map(state.blockers);
              blockers.set(blockerKey!, IDLE_BLOCKER);
              updateState({ blockers });
            },
          });
          return;
        }

        return startNavigation(historyAction, location);
      }
    );

    if (isBrowser) {
      // FIXME: This feels gross.  How can we cleanup the lines between
      // scrollRestoration/appliedTransitions persistance?
      restoreAppliedTransitions(routerWindow, appliedViewTransitions);
      let _saveAppliedTransitions = () =>
        persistAppliedTransitions(routerWindow, appliedViewTransitions);
      routerWindow.addEventListener("pagehide", _saveAppliedTransitions);
      removePageHideEventListener = () =>
        routerWindow.removeEventListener("pagehide", _saveAppliedTransitions);
    }

    // Kick off initial data load if needed.  Use Pop to avoid modifying history
    // Note we don't do any handling of lazy here.  For SPA's it'll get handled
    // in the normal navigation flow.  For SSR it's expected that lazy modules are
    // resolved prior to router creation since we can't go into a fallback
    // UI for SSR'd apps
    if (!state.initialized) {
      startNavigation(NavigationType.Pop, state.location, {
        initialHydration: true,
      });
    }

    return router;
  }

  // Clean up a router and it's side effects
  function dispose() {
    if (unlistenHistory) {
      unlistenHistory();
    }
    if (removePageHideEventListener) {
      removePageHideEventListener();
    }
    subscribers.clear();
    pendingNavigationController && pendingNavigationController.abort();
    state.fetchers.forEach((_, key) => deleteFetcher(key));
    state.blockers.forEach((_, key) => deleteBlocker(key));
  }

  // Subscribe to state updates for the router
  function subscribe(fn: RouterSubscriber) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  // Update our state and notify the calling context of the change
  function updateState(
    newState: Partial<RouterState>,
    opts: {
      flushSync?: boolean;
      viewTransitionOpts?: ViewTransitionOpts;
    } = {}
  ): void {
    state = {
      ...state,
      ...newState,
    };

    // Cleanup for all fetchers that have returned to idle since we only
    // care about in-flight fetchers
    // - If it's been unmounted then we can completely delete it
    // - If it's still mounted we can remove it from `state.fetchers`, but we
    //   need to keep it around in things like `fetchLoadMatches`, etc. since
    //   it may be called again
    let unmountedFetchers: string[] = [];
    let mountedFetchers: string[] = [];

    state.fetchers.forEach((fetcher, key) => {
      if (fetcher.state === "idle") {
        if (fetchersQueuedForDeletion.has(key)) {
          unmountedFetchers.push(key);
        } else {
          mountedFetchers.push(key);
        }
      }
    });

    // Delete any other `idle` fetchers unmounted in the UI that were previously
    // removed from state.fetchers.  Check `fetchControllers` in case this
    // fetcher is actively revalidating and we want to let that finish
    fetchersQueuedForDeletion.forEach((key) => {
      if (!state.fetchers.has(key) && !fetchControllers.has(key)) {
        unmountedFetchers.push(key);
      }
    });

    // Iterate over a local copy so that if flushSync is used and we end up
    // removing and adding a new subscriber due to the useCallback dependencies,
    // we don't get ourselves into a loop calling the new subscriber immediately
    [...subscribers].forEach((subscriber) =>
      subscriber(state, {
        deletedFetchers: unmountedFetchers,
        viewTransitionOpts: opts.viewTransitionOpts,
        flushSync: opts.flushSync === true,
      })
    );

    // Cleanup internally now that we've called our subscribers/updated state
    unmountedFetchers.forEach((key) => deleteFetcher(key));
    mountedFetchers.forEach((key) => state.fetchers.delete(key));
  }

  // Complete a navigation returning the state.navigation back to the IDLE_NAVIGATION
  // and setting state.[historyAction/location/matches] to the new route.
  // - Location is a required param
  // - Navigation will always be set to IDLE_NAVIGATION
  // - Can pass any other state in newState
  function completeNavigation(
    location: Location,
    newState: Partial<Omit<RouterState, "action" | "location" | "navigation">>,
    { flushSync }: { flushSync?: boolean } = {}
  ): void {
    // Deduce if we're in a loading/actionReload state:
    // - We have committed actionData in the store
    // - The current navigation was a mutation submission
    // - We're past the submitting state and into the loading state
    // - The location being loaded is not the result of a redirect
    let isActionReload =
      state.actionData != null &&
      state.navigation.formMethod != null &&
      isMutationMethod(state.navigation.formMethod) &&
      state.navigation.state === "loading" &&
      location.state?._isRedirect !== true;

    let actionData: RouteData | null;
    if (newState.actionData) {
      if (Object.keys(newState.actionData).length > 0) {
        actionData = newState.actionData;
      } else {
        // Empty actionData -> clear prior actionData due to an action error
        actionData = null;
      }
    } else if (isActionReload) {
      // Keep the current data if we're wrapping up the action reload
      actionData = state.actionData;
    } else {
      // Clear actionData on any other completed navigations
      actionData = null;
    }

    // Always preserve any existing loaderData from re-used routes
    let loaderData = newState.loaderData
      ? mergeLoaderData(
          state.loaderData,
          newState.loaderData,
          newState.matches || [],
          newState.errors
        )
      : state.loaderData;

    // On a successful navigation we can assume we got through all blockers
    // so we can start fresh
    let blockers = state.blockers;
    if (blockers.size > 0) {
      blockers = new Map(blockers);
      blockers.forEach((_, k) => blockers.set(k, IDLE_BLOCKER));
    }

    // Always respect the user flag.  Otherwise don't reset on mutation
    // submission navigations unless they redirect
    let preventScrollReset =
      pendingPreventScrollReset === true ||
      (state.navigation.formMethod != null &&
        isMutationMethod(state.navigation.formMethod) &&
        location.state?._isRedirect !== true);

    // Commit any in-flight routes at the end of the HMR revalidation "navigation"
    if (inFlightDataRoutes) {
      dataRoutes = inFlightDataRoutes;
      inFlightDataRoutes = undefined;
    }

    if (isUninterruptedRevalidation) {
      // If this was an uninterrupted revalidation then do not touch history
    } else if (pendingAction === NavigationType.Pop) {
      // Do nothing for POP - URL has already been updated
    } else if (pendingAction === NavigationType.Push) {
      init.history.push(location, location.state);
    } else if (pendingAction === NavigationType.Replace) {
      init.history.replace(location, location.state);
    }

    let viewTransitionOpts: ViewTransitionOpts | undefined;

    // On POP, enable transitions if they were enabled on the original navigation
    if (pendingAction === NavigationType.Pop) {
      // Forward takes precedence so they behave like the original navigation
      let priorPaths = appliedViewTransitions.get(state.location.pathname);
      if (priorPaths && priorPaths.has(location.pathname)) {
        viewTransitionOpts = {
          currentLocation: state.location,
          nextLocation: location,
        };
      } else if (appliedViewTransitions.has(location.pathname)) {
        // If we don't have a previous forward nav, assume we're popping back to
        // the new location and enable if that location previously enabled
        viewTransitionOpts = {
          currentLocation: location,
          nextLocation: state.location,
        };
      }
    } else if (pendingViewTransitionEnabled) {
      // Store the applied transition on PUSH/REPLACE
      let toPaths = appliedViewTransitions.get(state.location.pathname);
      if (toPaths) {
        toPaths.add(location.pathname);
      } else {
        toPaths = new Set<string>([location.pathname]);
        appliedViewTransitions.set(state.location.pathname, toPaths);
      }
      viewTransitionOpts = {
        currentLocation: state.location,
        nextLocation: location,
      };
    }

    updateState(
      {
        ...newState, // matches, errors, fetchers go through as-is
        actionData,
        loaderData,
        historyAction: pendingAction,
        location,
        initialized: true,
        navigation: IDLE_NAVIGATION,
        revalidation: "idle",
        restoreScrollPosition: getSavedScrollPosition(
          location,
          newState.matches || state.matches
        ),
        preventScrollReset,
        blockers,
      },
      {
        viewTransitionOpts,
        flushSync: flushSync === true,
      }
    );

    // Reset stateful navigation vars
    pendingAction = NavigationType.Pop;
    pendingPreventScrollReset = false;
    pendingViewTransitionEnabled = false;
    isUninterruptedRevalidation = false;
    isRevalidationRequired = false;
    pendingRevalidationDfd?.resolve();
    pendingRevalidationDfd = null;
  }

  // Trigger a navigation event, which can either be a numerical POP or a PUSH
  // replace with an optional submission
  async function navigate(
    to: number | To | null,
    opts?: RouterNavigateOptions
  ) {
    if (typeof to === "number") {
      init.history.go(to);
      return;
    }

    let normalizedPath = normalizeTo(
      state.location,
      state.matches,
      basename,
      to,
      opts?.fromRouteId,
      opts?.relative
    );
    let { path, submission, error } = normalizeNavigateOptions(
      false,
      normalizedPath,
      opts
    );

    let currentLocation = state.location;
    let nextLocation = createLocation(state.location, path, opts && opts.state);

    // When using navigate as a PUSH/REPLACE we aren't reading an already-encoded
    // URL from window.location, so we need to encode it here so the behavior
    // remains the same as POP and non-data-router usages.  new URL() does all
    // the same encoding we'd get from a history.pushState/window.location read
    // without having to touch history
    nextLocation = {
      ...nextLocation,
      ...init.history.encodeLocation(nextLocation),
    };

    let userReplace = opts && opts.replace != null ? opts.replace : undefined;

    let historyAction = NavigationType.Push;

    if (userReplace === true) {
      historyAction = NavigationType.Replace;
    } else if (userReplace === false) {
      // no-op
    } else if (
      submission != null &&
      isMutationMethod(submission.formMethod) &&
      submission.formAction === state.location.pathname + state.location.search
    ) {
      // By default on submissions to the current location we REPLACE so that
      // users don't have to double-click the back button to get to the prior
      // location.  If the user redirects to a different location from the
      // action/loader this will be ignored and the redirect will be a PUSH
      historyAction = NavigationType.Replace;
    }

    let preventScrollReset =
      opts && "preventScrollReset" in opts
        ? opts.preventScrollReset === true
        : undefined;

    let flushSync = (opts && opts.flushSync) === true;

    let blockerKey = shouldBlockNavigation({
      currentLocation,
      nextLocation,
      historyAction,
    });

    if (blockerKey) {
      // Put the blocker into a blocked state
      updateBlocker(blockerKey, {
        state: "blocked",
        location: nextLocation,
        proceed() {
          updateBlocker(blockerKey!, {
            state: "proceeding",
            proceed: undefined,
            reset: undefined,
            location: nextLocation,
          });
          // Send the same navigation through
          navigate(to, opts);
        },
        reset() {
          let blockers = new Map(state.blockers);
          blockers.set(blockerKey!, IDLE_BLOCKER);
          updateState({ blockers });
        },
      });
      return;
    }

    await startNavigation(historyAction, nextLocation, {
      submission,
      // Send through the formData serialization error if we have one so we can
      // render at the right error boundary after we match routes
      pendingError: error,
      preventScrollReset,
      replace: opts && opts.replace,
      enableViewTransition: opts && opts.viewTransition,
      flushSync,
    });
  }

  // Revalidate all current loaders.  If a navigation is in progress or if this
  // is interrupted by a navigation, allow this to "succeed" by calling all
  // loaders during the next loader round
  function revalidate() {
    // We can't just return the promise from `startNavigation` because that
    // navigation may be interrupted and our revalidation wouldn't be finished
    // until the _next_ navigation completes.  Instead we just track via a
    // deferred and resolve it the next time we run through `completeNavigation`
    // This is different than navigations which will settle if interrupted
    // because the navigation to a specific location is no longer relevant.
    // Revalidations are location-independent and will settle whenever we land
    // on our final location
    if (!pendingRevalidationDfd) {
      pendingRevalidationDfd = createDeferred<void>();
    }

    interruptActiveLoads();
    updateState({ revalidation: "loading" });

    // Capture this here for the edge-case that we have a fully synchronous
    // startNavigation which would resolve and null out pendingRevalidationDfd
    // before we return from this function
    let promise = pendingRevalidationDfd.promise;

    // If we're currently submitting an action, we don't need to start a new
    // navigation, we'll just let the follow up loader execution call all loaders
    if (state.navigation.state === "submitting") {
      return promise;
    }

    // If we're currently in an idle state, start a new navigation for the current
    // action/location and mark it as uninterrupted, which will skip the history
    // update in completeNavigation
    if (state.navigation.state === "idle") {
      startNavigation(state.historyAction, state.location, {
        startUninterruptedRevalidation: true,
      });
      return promise;
    }

    // Otherwise, if we're currently in a loading state, just start a new
    // navigation to the navigation.location but do not trigger an uninterrupted
    // revalidation so that history correctly updates once the navigation completes
    startNavigation(
      pendingAction || state.historyAction,
      state.navigation.location,
      {
        overrideNavigation: state.navigation,
        // Proxy through any rending view transition
        enableViewTransition: pendingViewTransitionEnabled === true,
      }
    );
    return promise;
  }

  // Start a navigation to the given action/location.  Can optionally provide a
  // overrideNavigation which will override the normalLoad in the case of a redirect
  // navigation
  async function startNavigation(
    historyAction: NavigationType,
    location: Location,
    opts?: {
      initialHydration?: boolean;
      submission?: Submission;
      fetcherSubmission?: Submission;
      overrideNavigation?: Navigation;
      pendingError?: ErrorResponseImpl;
      startUninterruptedRevalidation?: boolean;
      preventScrollReset?: boolean;
      replace?: boolean;
      enableViewTransition?: boolean;
      flushSync?: boolean;
    }
  ): Promise<void> {
    // Abort any in-progress navigations and start a new one. Unset any ongoing
    // uninterrupted revalidations unless told otherwise, since we want this
    // new navigation to update history normally
    pendingNavigationController && pendingNavigationController.abort();
    pendingNavigationController = null;
    pendingAction = historyAction;
    isUninterruptedRevalidation =
      (opts && opts.startUninterruptedRevalidation) === true;

    // Save the current scroll position every time we start a new navigation,
    // and track whether we should reset scroll on completion
    saveScrollPosition(state.location, state.matches);
    pendingPreventScrollReset = (opts && opts.preventScrollReset) === true;

    pendingViewTransitionEnabled = (opts && opts.enableViewTransition) === true;

    let routesToUse = inFlightDataRoutes || dataRoutes;
    let loadingNavigation = opts && opts.overrideNavigation;
    let matches =
      opts?.initialHydration &&
      state.matches &&
      state.matches.length > 0 &&
      !initialMatchesIsFOW
        ? // `matchRoutes()` has already been called if we're in here via `router.initialize()`
          state.matches
        : matchRoutes(routesToUse, location, basename);
    let flushSync = (opts && opts.flushSync) === true;

    // Short circuit if it's only a hash change and not a revalidation or
    // mutation submission.
    //
    // Ignore on initial page loads because since the initial hydration will always
    // be "same hash".  For example, on /page#hash and submit a <Form method="post">
    // which will default to a navigation to /page
    if (
      matches &&
      state.initialized &&
      !isRevalidationRequired &&
      isHashChangeOnly(state.location, location) &&
      !(opts && opts.submission && isMutationMethod(opts.submission.formMethod))
    ) {
      completeNavigation(location, { matches }, { flushSync });
      return;
    }

    let fogOfWar = checkFogOfWar(matches, routesToUse, location.pathname);
    if (fogOfWar.active && fogOfWar.matches) {
      matches = fogOfWar.matches;
    }

    // Short circuit with a 404 on the root error boundary if we match nothing
    if (!matches) {
      let { error, notFoundMatches, route } = handleNavigational404(
        location.pathname
      );
      completeNavigation(
        location,
        {
          matches: notFoundMatches,
          loaderData: {},
          errors: {
            [route.id]: error,
          },
        },
        { flushSync }
      );
      return;
    }

    // Create a controller/Request for this navigation
    pendingNavigationController = new AbortController();
    let request = createClientSideRequest(
      init.history,
      location,
      pendingNavigationController.signal,
      opts && opts.submission
    );
    // Create a new context per navigation
    let scopedContext = new unstable_RouterContextProvider(
      init.unstable_getContext ? await init.unstable_getContext() : undefined
    );
    let pendingActionResult: PendingActionResult | undefined;

    if (opts && opts.pendingError) {
      // If we have a pendingError, it means the user attempted a GET submission
      // with binary FormData so assign here and skip to handleLoaders.  That
      // way we handle calling loaders above the boundary etc.  It's not really
      // different from an actionError in that sense.
      pendingActionResult = [
        findNearestBoundary(matches).route.id,
        { type: ResultType.error, error: opts.pendingError },
      ];
    } else if (
      opts &&
      opts.submission &&
      isMutationMethod(opts.submission.formMethod)
    ) {
      // Call action if we received an action submission
      let actionResult = await handleAction(
        request,
        location,
        opts.submission,
        matches,
        scopedContext,
        fogOfWar.active,
        { replace: opts.replace, flushSync }
      );

      if (actionResult.shortCircuited) {
        return;
      }

      // If we received a 404 from handleAction, it's because we couldn't lazily
      // discover the destination route so we don't want to call loaders
      if (actionResult.pendingActionResult) {
        let [routeId, result] = actionResult.pendingActionResult;
        if (
          isErrorResult(result) &&
          isRouteErrorResponse(result.error) &&
          result.error.status === 404
        ) {
          pendingNavigationController = null;

          completeNavigation(location, {
            matches: actionResult.matches,
            loaderData: {},
            errors: {
              [routeId]: result.error,
            },
          });
          return;
        }
      }

      matches = actionResult.matches || matches;
      pendingActionResult = actionResult.pendingActionResult;
      loadingNavigation = getLoadingNavigation(location, opts.submission);
      flushSync = false;
      // No need to do fog of war matching again on loader execution
      fogOfWar.active = false;

      // Create a GET request for the loaders
      request = createClientSideRequest(
        init.history,
        request.url,
        request.signal
      );
    }

    // Call loaders
    let {
      shortCircuited,
      matches: updatedMatches,
      loaderData,
      errors,
    } = await handleLoaders(
      request,
      location,
      matches,
      scopedContext,
      fogOfWar.active,
      loadingNavigation,
      opts && opts.submission,
      opts && opts.fetcherSubmission,
      opts && opts.replace,
      opts && opts.initialHydration === true,
      flushSync,
      pendingActionResult
    );

    if (shortCircuited) {
      return;
    }

    // Clean up now that the action/loaders have completed.  Don't clean up if
    // we short circuited because pendingNavigationController will have already
    // been assigned to a new controller for the next navigation
    pendingNavigationController = null;

    completeNavigation(location, {
      matches: updatedMatches || matches,
      ...getActionDataForCommit(pendingActionResult),
      loaderData,
      errors,
    });
  }

  // Call the action matched by the leaf route for this navigation and handle
  // redirects/errors
  async function handleAction(
    request: Request,
    location: Location,
    submission: Submission,
    matches: AgnosticDataRouteMatch[],
    scopedContext: unstable_RouterContextProvider,
    isFogOfWar: boolean,
    opts: { replace?: boolean; flushSync?: boolean } = {}
  ): Promise<HandleActionResult> {
    interruptActiveLoads();

    // Put us in a submitting state
    let navigation = getSubmittingNavigation(location, submission);
    updateState({ navigation }, { flushSync: opts.flushSync === true });

    if (isFogOfWar) {
      let discoverResult = await discoverRoutes(
        matches,
        location.pathname,
        request.signal
      );
      if (discoverResult.type === "aborted") {
        return { shortCircuited: true };
      } else if (discoverResult.type === "error") {
        let boundaryId = findNearestBoundary(discoverResult.partialMatches)
          .route.id;
        return {
          matches: discoverResult.partialMatches,
          pendingActionResult: [
            boundaryId,
            {
              type: ResultType.error,
              error: discoverResult.error,
            },
          ],
        };
      } else if (!discoverResult.matches) {
        let { notFoundMatches, error, route } = handleNavigational404(
          location.pathname
        );
        return {
          matches: notFoundMatches,
          pendingActionResult: [
            route.id,
            {
              type: ResultType.error,
              error,
            },
          ],
        };
      } else {
        matches = discoverResult.matches;
      }
    }

    // Call our action and get the result
    let result: DataResult;
    let actionMatch = getTargetMatch(matches, location);

    if (!actionMatch.route.action && !actionMatch.route.lazy) {
      result = {
        type: ResultType.error,
        error: getInternalRouterError(405, {
          method: request.method,
          pathname: location.pathname,
          routeId: actionMatch.route.id,
        }),
      };
    } else {
      let results = await callDataStrategy(
        "action",
        request,
        [actionMatch],
        matches,
        scopedContext,
        null
      );
      result = results[actionMatch.route.id];

      if (!result) {
        // If this error came from a parent middleware before the action ran,
        // then it won't be tied to the action route
        for (let match of matches) {
          if (results[match.route.id]) {
            result = results[match.route.id];
            break;
          }
        }
      }

      if (request.signal.aborted) {
        return { shortCircuited: true };
      }
    }

    if (isRedirectResult(result)) {
      let replace: boolean;
      if (opts && opts.replace != null) {
        replace = opts.replace;
      } else {
        // If the user didn't explicitly indicate replace behavior, replace if
        // we redirected to the exact same location we're currently at to avoid
        // double back-buttons
        let location = normalizeRedirectLocation(
          result.response.headers.get("Location")!,
          new URL(request.url),
          basename
        );
        replace = location === state.location.pathname + state.location.search;
      }
      await startRedirectNavigation(request, result, true, {
        submission,
        replace,
      });
      return { shortCircuited: true };
    }

    if (isErrorResult(result)) {
      // Store off the pending error - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);

      // By default, all submissions to the current location are REPLACE
      // navigations, but if the action threw an error that'll be rendered in
      // an errorElement, we fall back to PUSH so that the user can use the
      // back button to get back to the pre-submission form location to try
      // again
      if ((opts && opts.replace) !== true) {
        pendingAction = NavigationType.Push;
      }

      return {
        matches,
        pendingActionResult: [boundaryMatch.route.id, result],
      };
    }

    return {
      matches,
      pendingActionResult: [actionMatch.route.id, result],
    };
  }

  // Call all applicable loaders for the given matches, handling redirects,
  // errors, etc.
  async function handleLoaders(
    request: Request,
    location: Location,
    matches: AgnosticDataRouteMatch[],
    scopedContext: unstable_RouterContextProvider,
    isFogOfWar: boolean,
    overrideNavigation?: Navigation,
    submission?: Submission,
    fetcherSubmission?: Submission,
    replace?: boolean,
    initialHydration?: boolean,
    flushSync?: boolean,
    pendingActionResult?: PendingActionResult
  ): Promise<HandleLoadersResult> {
    // Figure out the right navigation we want to use for data loading
    let loadingNavigation =
      overrideNavigation || getLoadingNavigation(location, submission);

    // If this was a redirect from an action we don't have a "submission" but
    // we have it on the loading navigation so use that if available
    let activeSubmission =
      submission ||
      fetcherSubmission ||
      getSubmissionFromNavigation(loadingNavigation);

    // If this is an uninterrupted revalidation, we remain in our current idle
    // state.  If not, we need to switch to our loading state and load data,
    // preserving any new action data or existing action data (in the case of
    // a revalidation interrupting an actionReload)
    // Also (with "partial hydration"), don't update the state for the initial
    // data load since it's not a "navigation"
    let shouldUpdateNavigationState =
      !isUninterruptedRevalidation && !initialHydration;

    // When fog of war is enabled, we enter our `loading` state earlier so we
    // can discover new routes during the `loading` state.  We skip this if
    // we've already run actions since we would have done our matching already.
    // If the children() function threw then, we want to proceed with the
    // partial matches it discovered.
    if (isFogOfWar) {
      if (shouldUpdateNavigationState) {
        let actionData = getUpdatedActionData(pendingActionResult);
        updateState(
          {
            navigation: loadingNavigation,
            ...(actionData !== undefined ? { actionData } : {}),
          },
          {
            flushSync,
          }
        );
      }

      let discoverResult = await discoverRoutes(
        matches,
        location.pathname,
        request.signal
      );

      if (discoverResult.type === "aborted") {
        return { shortCircuited: true };
      } else if (discoverResult.type === "error") {
        let boundaryId = findNearestBoundary(discoverResult.partialMatches)
          .route.id;
        return {
          matches: discoverResult.partialMatches,
          loaderData: {},
          errors: {
            [boundaryId]: discoverResult.error,
          },
        };
      } else if (!discoverResult.matches) {
        let { error, notFoundMatches, route } = handleNavigational404(
          location.pathname
        );
        return {
          matches: notFoundMatches,
          loaderData: {},
          errors: {
            [route.id]: error,
          },
        };
      } else {
        matches = discoverResult.matches;
      }
    }

    let routesToUse = inFlightDataRoutes || dataRoutes;
    let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(
      init.history,
      state,
      matches,
      activeSubmission,
      location,
      initialHydration === true,
      isRevalidationRequired,
      cancelledFetcherLoads,
      fetchersQueuedForDeletion,
      fetchLoadMatches,
      fetchRedirectIds,
      routesToUse,
      basename,
      pendingActionResult
    );

    pendingNavigationLoadId = ++incrementingLoadId;

    // Short circuit if we have no loaders to run
    if (matchesToLoad.length === 0 && revalidatingFetchers.length === 0) {
      let updatedFetchers = markFetchRedirectsDone();
      completeNavigation(
        location,
        {
          matches,
          loaderData: {},
          // Commit pending error if we're short circuiting
          errors:
            pendingActionResult && isErrorResult(pendingActionResult[1])
              ? { [pendingActionResult[0]]: pendingActionResult[1].error }
              : null,
          ...getActionDataForCommit(pendingActionResult),
          ...(updatedFetchers ? { fetchers: new Map(state.fetchers) } : {}),
        },
        { flushSync }
      );
      return { shortCircuited: true };
    }

    if (shouldUpdateNavigationState) {
      let updates: Partial<RouterState> = {};
      if (!isFogOfWar) {
        // Only update navigation/actionNData if we didn't already do it above
        updates.navigation = loadingNavigation;
        let actionData = getUpdatedActionData(pendingActionResult);
        if (actionData !== undefined) {
          updates.actionData = actionData;
        }
      }
      if (revalidatingFetchers.length > 0) {
        updates.fetchers = getUpdatedRevalidatingFetchers(revalidatingFetchers);
      }
      updateState(updates, { flushSync });
    }

    revalidatingFetchers.forEach((rf) => {
      abortFetcher(rf.key);
      if (rf.controller) {
        // Fetchers use an independent AbortController so that aborting a fetcher
        // (via deleteFetcher) does not abort the triggering navigation that
        // triggered the revalidation
        fetchControllers.set(rf.key, rf.controller);
      }
    });

    // Proxy navigation abort through to revalidation fetchers
    let abortPendingFetchRevalidations = () =>
      revalidatingFetchers.forEach((f) => abortFetcher(f.key));
    if (pendingNavigationController) {
      pendingNavigationController.signal.addEventListener(
        "abort",
        abortPendingFetchRevalidations
      );
    }

    let { loaderResults, fetcherResults } =
      await callLoadersAndMaybeResolveData(
        matches,
        matchesToLoad,
        revalidatingFetchers,
        request,
        scopedContext
      );

    if (request.signal.aborted) {
      return { shortCircuited: true };
    }

    // Clean up _after_ loaders have completed.  Don't clean up if we short
    // circuited because fetchControllers would have been aborted and
    // reassigned to new controllers for the next navigation
    if (pendingNavigationController) {
      pendingNavigationController.signal.removeEventListener(
        "abort",
        abortPendingFetchRevalidations
      );
    }

    revalidatingFetchers.forEach((rf) => fetchControllers.delete(rf.key));

    // If any loaders returned a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect(loaderResults);
    if (redirect) {
      await startRedirectNavigation(request, redirect.result, true, {
        replace,
      });
      return { shortCircuited: true };
    }

    redirect = findRedirect(fetcherResults);
    if (redirect) {
      // If this redirect came from a fetcher make sure we mark it in
      // fetchRedirectIds so it doesn't get revalidated on the next set of
      // loader executions
      fetchRedirectIds.add(redirect.key);
      await startRedirectNavigation(request, redirect.result, true, {
        replace,
      });
      return { shortCircuited: true };
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      matches,
      loaderResults,
      pendingActionResult,
      revalidatingFetchers,
      fetcherResults
    );

    // Preserve SSR errors during partial hydration
    if (initialHydration && state.errors) {
      errors = { ...state.errors, ...errors };
    }

    let updatedFetchers = markFetchRedirectsDone();
    let didAbortFetchLoads = abortStaleFetchLoads(pendingNavigationLoadId);
    let shouldUpdateFetchers =
      updatedFetchers || didAbortFetchLoads || revalidatingFetchers.length > 0;

    return {
      matches,
      loaderData,
      errors,
      ...(shouldUpdateFetchers ? { fetchers: new Map(state.fetchers) } : {}),
    };
  }

  function getUpdatedActionData(
    pendingActionResult: PendingActionResult | undefined
  ): Record<string, RouteData> | null | undefined {
    if (pendingActionResult && !isErrorResult(pendingActionResult[1])) {
      // This is cast to `any` currently because `RouteData`uses any and it
      // would be a breaking change to use any.
      // TODO: v7 - change `RouteData` to use `unknown` instead of `any`
      return {
        [pendingActionResult[0]]: pendingActionResult[1].data as any,
      };
    } else if (state.actionData) {
      if (Object.keys(state.actionData).length === 0) {
        return null;
      } else {
        return state.actionData;
      }
    }
  }

  function getUpdatedRevalidatingFetchers(
    revalidatingFetchers: RevalidatingFetcher[]
  ) {
    revalidatingFetchers.forEach((rf) => {
      let fetcher = state.fetchers.get(rf.key);
      let revalidatingFetcher = getLoadingFetcher(
        undefined,
        fetcher ? fetcher.data : undefined
      );
      state.fetchers.set(rf.key, revalidatingFetcher);
    });
    return new Map(state.fetchers);
  }

  // Trigger a fetcher load/submit for the given fetcher key
  async function fetch(
    key: string,
    routeId: string,
    href: string | null,
    opts?: RouterFetchOptions
  ) {
    abortFetcher(key);

    let flushSync = (opts && opts.flushSync) === true;

    let routesToUse = inFlightDataRoutes || dataRoutes;
    let normalizedPath = normalizeTo(
      state.location,
      state.matches,
      basename,
      href,
      routeId,
      opts?.relative
    );
    let matches = matchRoutes(routesToUse, normalizedPath, basename);

    let fogOfWar = checkFogOfWar(matches, routesToUse, normalizedPath);
    if (fogOfWar.active && fogOfWar.matches) {
      matches = fogOfWar.matches;
    }

    if (!matches) {
      setFetcherError(
        key,
        routeId,
        getInternalRouterError(404, { pathname: normalizedPath }),
        { flushSync }
      );
      return;
    }

    let { path, submission, error } = normalizeNavigateOptions(
      true,
      normalizedPath,
      opts
    );

    if (error) {
      setFetcherError(key, routeId, error, { flushSync });
      return;
    }

    let match = getTargetMatch(matches, path);
    // Create a new context per fetch
    let scopedContext = new unstable_RouterContextProvider(
      init.unstable_getContext ? await init.unstable_getContext() : undefined
    );
    let preventScrollReset = (opts && opts.preventScrollReset) === true;

    if (submission && isMutationMethod(submission.formMethod)) {
      await handleFetcherAction(
        key,
        routeId,
        path,
        match,
        matches,
        scopedContext,
        fogOfWar.active,
        flushSync,
        preventScrollReset,
        submission
      );
      return;
    }

    // Store off the match so we can call it's shouldRevalidate on subsequent
    // revalidations
    fetchLoadMatches.set(key, { routeId, path });
    await handleFetcherLoader(
      key,
      routeId,
      path,
      match,
      matches,
      scopedContext,
      fogOfWar.active,
      flushSync,
      preventScrollReset,
      submission
    );
  }

  // Call the action for the matched fetcher.submit(), and then handle redirects,
  // errors, and revalidation
  async function handleFetcherAction(
    key: string,
    routeId: string,
    path: string,
    match: AgnosticDataRouteMatch,
    requestMatches: AgnosticDataRouteMatch[],
    scopedContext: unstable_RouterContextProvider,
    isFogOfWar: boolean,
    flushSync: boolean,
    preventScrollReset: boolean,
    submission: Submission
  ) {
    interruptActiveLoads();
    fetchLoadMatches.delete(key);

    function detectAndHandle405Error(m: AgnosticDataRouteMatch) {
      if (!m.route.action && !m.route.lazy) {
        let error = getInternalRouterError(405, {
          method: submission.formMethod,
          pathname: path,
          routeId: routeId,
        });
        setFetcherError(key, routeId, error, { flushSync });
        return true;
      }
      return false;
    }

    if (!isFogOfWar && detectAndHandle405Error(match)) {
      return;
    }

    // Put this fetcher into it's submitting state
    let existingFetcher = state.fetchers.get(key);
    updateFetcherState(key, getSubmittingFetcher(submission, existingFetcher), {
      flushSync,
    });

    let abortController = new AbortController();
    let fetchRequest = createClientSideRequest(
      init.history,
      path,
      abortController.signal,
      submission
    );

    if (isFogOfWar) {
      let discoverResult = await discoverRoutes(
        requestMatches,
        path,
        fetchRequest.signal,
        key
      );

      if (discoverResult.type === "aborted") {
        return;
      } else if (discoverResult.type === "error") {
        setFetcherError(key, routeId, discoverResult.error, { flushSync });
        return;
      } else if (!discoverResult.matches) {
        setFetcherError(
          key,
          routeId,
          getInternalRouterError(404, { pathname: path }),
          { flushSync }
        );
        return;
      } else {
        requestMatches = discoverResult.matches;
        match = getTargetMatch(requestMatches, path);

        if (detectAndHandle405Error(match)) {
          return;
        }
      }
    }

    // Call the action for the fetcher
    fetchControllers.set(key, abortController);

    let originatingLoadId = incrementingLoadId;
    let actionResults = await callDataStrategy(
      "action",
      fetchRequest,
      [match],
      requestMatches,
      scopedContext,
      key
    );
    let actionResult = actionResults[match.route.id];

    if (fetchRequest.signal.aborted) {
      // We can delete this so long as we weren't aborted by our own fetcher
      // re-submit which would have put _new_ controller is in fetchControllers
      if (fetchControllers.get(key) === abortController) {
        fetchControllers.delete(key);
      }
      return;
    }

    // We don't want errors bubbling up to the UI or redirects processed for
    // unmounted fetchers so we just revert them to idle
    if (fetchersQueuedForDeletion.has(key)) {
      if (isRedirectResult(actionResult) || isErrorResult(actionResult)) {
        updateFetcherState(key, getDoneFetcher(undefined));
        return;
      }
      // Let SuccessResult's fall through for revalidation
    } else {
      if (isRedirectResult(actionResult)) {
        fetchControllers.delete(key);
        if (pendingNavigationLoadId > originatingLoadId) {
          // A new navigation was kicked off after our action started, so that
          // should take precedence over this redirect navigation.  We already
          // set isRevalidationRequired so all loaders for the new route should
          // fire unless opted out via shouldRevalidate
          updateFetcherState(key, getDoneFetcher(undefined));
          return;
        } else {
          fetchRedirectIds.add(key);
          updateFetcherState(key, getLoadingFetcher(submission));
          return startRedirectNavigation(fetchRequest, actionResult, false, {
            fetcherSubmission: submission,
            preventScrollReset,
          });
        }
      }

      // Process any non-redirect errors thrown
      if (isErrorResult(actionResult)) {
        setFetcherError(key, routeId, actionResult.error);
        return;
      }
    }

    // Start the data load for current matches, or the next location if we're
    // in the middle of a navigation
    let nextLocation = state.navigation.location || state.location;
    let revalidationRequest = createClientSideRequest(
      init.history,
      nextLocation,
      abortController.signal
    );
    let routesToUse = inFlightDataRoutes || dataRoutes;
    let matches =
      state.navigation.state !== "idle"
        ? matchRoutes(routesToUse, state.navigation.location, basename)
        : state.matches;

    invariant(matches, "Didn't find any matches after fetcher action");

    let loadId = ++incrementingLoadId;
    fetchReloadIds.set(key, loadId);

    let loadFetcher = getLoadingFetcher(submission, actionResult.data);
    state.fetchers.set(key, loadFetcher);

    let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(
      init.history,
      state,
      matches,
      submission,
      nextLocation,
      false,
      isRevalidationRequired,
      cancelledFetcherLoads,
      fetchersQueuedForDeletion,
      fetchLoadMatches,
      fetchRedirectIds,
      routesToUse,
      basename,
      [match.route.id, actionResult]
    );

    // Put all revalidating fetchers into the loading state, except for the
    // current fetcher which we want to keep in it's current loading state which
    // contains it's action submission info + action data
    revalidatingFetchers
      .filter((rf) => rf.key !== key)
      .forEach((rf) => {
        let staleKey = rf.key;
        let existingFetcher = state.fetchers.get(staleKey);
        let revalidatingFetcher = getLoadingFetcher(
          undefined,
          existingFetcher ? existingFetcher.data : undefined
        );
        state.fetchers.set(staleKey, revalidatingFetcher);
        abortFetcher(staleKey);
        if (rf.controller) {
          fetchControllers.set(staleKey, rf.controller);
        }
      });

    updateState({ fetchers: new Map(state.fetchers) });

    let abortPendingFetchRevalidations = () =>
      revalidatingFetchers.forEach((rf) => abortFetcher(rf.key));

    abortController.signal.addEventListener(
      "abort",
      abortPendingFetchRevalidations
    );

    let { loaderResults, fetcherResults } =
      await callLoadersAndMaybeResolveData(
        matches,
        matchesToLoad,
        revalidatingFetchers,
        revalidationRequest,
        scopedContext
      );

    if (abortController.signal.aborted) {
      return;
    }

    abortController.signal.removeEventListener(
      "abort",
      abortPendingFetchRevalidations
    );

    fetchReloadIds.delete(key);
    fetchControllers.delete(key);
    revalidatingFetchers.forEach((r) => fetchControllers.delete(r.key));

    let redirect = findRedirect(loaderResults);
    if (redirect) {
      return startRedirectNavigation(
        revalidationRequest,
        redirect.result,
        false,
        { preventScrollReset }
      );
    }

    redirect = findRedirect(fetcherResults);
    if (redirect) {
      // If this redirect came from a fetcher make sure we mark it in
      // fetchRedirectIds so it doesn't get revalidated on the next set of
      // loader executions
      fetchRedirectIds.add(redirect.key);
      return startRedirectNavigation(
        revalidationRequest,
        redirect.result,
        false,
        { preventScrollReset }
      );
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      matches,
      loaderResults,
      undefined,
      revalidatingFetchers,
      fetcherResults
    );

    // Since we let revalidations complete even if the submitting fetcher was
    // deleted, only put it back to idle if it hasn't been deleted
    if (state.fetchers.has(key)) {
      let doneFetcher = getDoneFetcher(actionResult.data);
      state.fetchers.set(key, doneFetcher);
    }

    abortStaleFetchLoads(loadId);

    // If we are currently in a navigation loading state and this fetcher is
    // more recent than the navigation, we want the newer data so abort the
    // navigation and complete it with the fetcher data
    if (
      state.navigation.state === "loading" &&
      loadId > pendingNavigationLoadId
    ) {
      invariant(pendingAction, "Expected pending action");
      pendingNavigationController && pendingNavigationController.abort();

      completeNavigation(state.navigation.location, {
        matches,
        loaderData,
        errors,
        fetchers: new Map(state.fetchers),
      });
    } else {
      // otherwise just update with the fetcher data, preserving any existing
      // loaderData for loaders that did not need to reload.  We have to
      // manually merge here since we aren't going through completeNavigation
      updateState({
        errors,
        loaderData: mergeLoaderData(
          state.loaderData,
          loaderData,
          matches,
          errors
        ),
        fetchers: new Map(state.fetchers),
      });
      isRevalidationRequired = false;
    }
  }

  // Call the matched loader for fetcher.load(), handling redirects, errors, etc.
  async function handleFetcherLoader(
    key: string,
    routeId: string,
    path: string,
    match: AgnosticDataRouteMatch,
    matches: AgnosticDataRouteMatch[],
    scopedContext: unstable_RouterContextProvider,
    isFogOfWar: boolean,
    flushSync: boolean,
    preventScrollReset: boolean,
    submission?: Submission
  ) {
    let existingFetcher = state.fetchers.get(key);
    updateFetcherState(
      key,
      getLoadingFetcher(
        submission,
        existingFetcher ? existingFetcher.data : undefined
      ),
      { flushSync }
    );

    let abortController = new AbortController();
    let fetchRequest = createClientSideRequest(
      init.history,
      path,
      abortController.signal
    );

    if (isFogOfWar) {
      let discoverResult = await discoverRoutes(
        matches,
        path,
        fetchRequest.signal,
        key
      );

      if (discoverResult.type === "aborted") {
        return;
      } else if (discoverResult.type === "error") {
        setFetcherError(key, routeId, discoverResult.error, { flushSync });
        return;
      } else if (!discoverResult.matches) {
        setFetcherError(
          key,
          routeId,
          getInternalRouterError(404, { pathname: path }),
          { flushSync }
        );
        return;
      } else {
        matches = discoverResult.matches;
        match = getTargetMatch(matches, path);
      }
    }

    // Call the loader for this fetcher route match
    fetchControllers.set(key, abortController);

    let originatingLoadId = incrementingLoadId;
    let results = await callDataStrategy(
      "loader",
      fetchRequest,
      [match],
      matches,
      scopedContext,
      key
    );
    let result = results[match.route.id];

    // We can delete this so long as we weren't aborted by our our own fetcher
    // re-load which would have put _new_ controller is in fetchControllers
    if (fetchControllers.get(key) === abortController) {
      fetchControllers.delete(key);
    }

    if (fetchRequest.signal.aborted) {
      return;
    }

    // We don't want errors bubbling up or redirects followed for unmounted
    // fetchers, so short circuit here if it was removed from the UI
    if (fetchersQueuedForDeletion.has(key)) {
      updateFetcherState(key, getDoneFetcher(undefined));
      return;
    }

    // If the loader threw a redirect Response, start a new REPLACE navigation
    if (isRedirectResult(result)) {
      if (pendingNavigationLoadId > originatingLoadId) {
        // A new navigation was kicked off after our loader started, so that
        // should take precedence over this redirect navigation
        updateFetcherState(key, getDoneFetcher(undefined));
        return;
      } else {
        fetchRedirectIds.add(key);
        await startRedirectNavigation(fetchRequest, result, false, {
          preventScrollReset,
        });
        return;
      }
    }

    // Process any non-redirect errors thrown
    if (isErrorResult(result)) {
      setFetcherError(key, routeId, result.error);
      return;
    }

    // Put the fetcher back into an idle state
    updateFetcherState(key, getDoneFetcher(result.data));
  }

  /**
   * Utility function to handle redirects returned from an action or loader.
   * Normally, a redirect "replaces" the navigation that triggered it.  So, for
   * example:
   *
   *  - user is on /a
   *  - user clicks a link to /b
   *  - loader for /b redirects to /c
   *
   * In a non-JS app the browser would track the in-flight navigation to /b and
   * then replace it with /c when it encountered the redirect response.  In
   * the end it would only ever update the URL bar with /c.
   *
   * In client-side routing using pushState/replaceState, we aim to emulate
   * this behavior and we also do not update history until the end of the
   * navigation (including processed redirects).  This means that we never
   * actually touch history until we've processed redirects, so we just use
   * the history action from the original navigation (PUSH or REPLACE).
   */
  async function startRedirectNavigation(
    request: Request,
    redirect: RedirectResult,
    isNavigation: boolean,
    {
      submission,
      fetcherSubmission,
      preventScrollReset,
      replace,
    }: {
      submission?: Submission;
      fetcherSubmission?: Submission;
      preventScrollReset?: boolean;
      replace?: boolean;
    } = {}
  ) {
    if (redirect.response.headers.has("X-Remix-Revalidate")) {
      isRevalidationRequired = true;
    }

    let location = redirect.response.headers.get("Location");
    invariant(location, "Expected a Location header on the redirect Response");
    location = normalizeRedirectLocation(
      location,
      new URL(request.url),
      basename
    );
    let redirectLocation = createLocation(state.location, location, {
      _isRedirect: true,
    });

    if (isBrowser) {
      let isDocumentReload = false;

      if (redirect.response.headers.has("X-Remix-Reload-Document")) {
        // Hard reload if the response contained X-Remix-Reload-Document
        isDocumentReload = true;
      } else if (ABSOLUTE_URL_REGEX.test(location)) {
        const url = init.history.createURL(location);
        isDocumentReload =
          // Hard reload if it's an absolute URL to a new origin
          url.origin !== routerWindow.location.origin ||
          // Hard reload if it's an absolute URL that does not match our basename
          stripBasename(url.pathname, basename) == null;
      }

      if (isDocumentReload) {
        if (replace) {
          routerWindow.location.replace(location);
        } else {
          routerWindow.location.assign(location);
        }
        return;
      }
    }

    // There's no need to abort on redirects, since we don't detect the
    // redirect until the action/loaders have settled
    pendingNavigationController = null;

    let redirectNavigationType =
      replace === true || redirect.response.headers.has("X-Remix-Replace")
        ? NavigationType.Replace
        : NavigationType.Push;

    // Use the incoming submission if provided, fallback on the active one in
    // state.navigation
    let { formMethod, formAction, formEncType } = state.navigation;
    if (
      !submission &&
      !fetcherSubmission &&
      formMethod &&
      formAction &&
      formEncType
    ) {
      submission = getSubmissionFromNavigation(state.navigation);
    }

    // If this was a 307/308 submission we want to preserve the HTTP method and
    // re-submit the GET/POST/PUT/PATCH/DELETE as a submission navigation to the
    // redirected location
    let activeSubmission = submission || fetcherSubmission;
    if (
      redirectPreserveMethodStatusCodes.has(redirect.response.status) &&
      activeSubmission &&
      isMutationMethod(activeSubmission.formMethod)
    ) {
      await startNavigation(redirectNavigationType, redirectLocation, {
        submission: {
          ...activeSubmission,
          formAction: location,
        },
        // Preserve these flags across redirects
        preventScrollReset: preventScrollReset || pendingPreventScrollReset,
        enableViewTransition: isNavigation
          ? pendingViewTransitionEnabled
          : undefined,
      });
    } else {
      // If we have a navigation submission, we will preserve it through the
      // redirect navigation
      let overrideNavigation = getLoadingNavigation(
        redirectLocation,
        submission
      );
      await startNavigation(redirectNavigationType, redirectLocation, {
        overrideNavigation,
        // Send fetcher submissions through for shouldRevalidate
        fetcherSubmission,
        // Preserve these flags across redirects
        preventScrollReset: preventScrollReset || pendingPreventScrollReset,
        enableViewTransition: isNavigation
          ? pendingViewTransitionEnabled
          : undefined,
      });
    }
  }

  // Utility wrapper for calling dataStrategy client-side without having to
  // pass around the manifest, mapRouteProperties, etc.
  async function callDataStrategy(
    type: "loader" | "action",
    request: Request,
    matchesToLoad: AgnosticDataRouteMatch[],
    matches: AgnosticDataRouteMatch[],
    scopedContext: unstable_RouterContextProvider,
    fetcherKey: string | null
  ): Promise<Record<string, DataResult>> {
    let results: Record<string, DataStrategyResult>;
    let dataResults: Record<string, DataResult> = {};
    try {
      results = await callDataStrategyImpl(
        dataStrategyImpl as DataStrategyFunction<unknown>,
        type,
        request,
        matchesToLoad,
        matches,
        fetcherKey,
        manifest,
        mapRouteProperties,
        scopedContext,
        future.unstable_middleware
      );
    } catch (e) {
      // If the outer dataStrategy method throws, just return the error for all
      // matches - and it'll naturally bubble to the root
      matchesToLoad.forEach((m) => {
        dataResults[m.route.id] = {
          type: ResultType.error,
          error: e,
        };
      });
      return dataResults;
    }

    for (let [routeId, result] of Object.entries(results)) {
      if (isRedirectDataStrategyResult(result)) {
        let response = result.result as Response;
        dataResults[routeId] = {
          type: ResultType.redirect,
          response: normalizeRelativeRoutingRedirectResponse(
            response,
            request,
            routeId,
            matches,
            basename
          ),
        };
      } else {
        dataResults[routeId] = await convertDataStrategyResultToDataResult(
          result
        );
      }
    }

    return dataResults;
  }

  async function callLoadersAndMaybeResolveData(
    matches: AgnosticDataRouteMatch[],
    matchesToLoad: AgnosticDataRouteMatch[],
    fetchersToLoad: RevalidatingFetcher[],
    request: Request,
    scopedContext: unstable_RouterContextProvider
  ) {
    // Kick off loaders and fetchers in parallel
    let loaderResultsPromise = callDataStrategy(
      "loader",
      request,
      matchesToLoad,
      matches,
      scopedContext,
      null
    );

    let fetcherResultsPromise = Promise.all(
      fetchersToLoad.map(async (f) => {
        if (f.matches && f.match && f.controller) {
          let results = await callDataStrategy(
            "loader",
            createClientSideRequest(init.history, f.path, f.controller.signal),
            [f.match],
            f.matches,
            scopedContext,
            f.key
          );
          let result = results[f.match.route.id];
          // Fetcher results are keyed by fetcher key from here on out, not routeId
          return { [f.key]: result };
        } else {
          return Promise.resolve({
            [f.key]: {
              type: ResultType.error,
              error: getInternalRouterError(404, {
                pathname: f.path,
              }),
            } as ErrorResult,
          });
        }
      })
    );

    let loaderResults = await loaderResultsPromise;
    let fetcherResults = (await fetcherResultsPromise).reduce(
      (acc, r) => Object.assign(acc, r),
      {}
    );

    return {
      loaderResults,
      fetcherResults,
    };
  }

  function interruptActiveLoads() {
    // Every interruption triggers a revalidation
    isRevalidationRequired = true;

    // Abort in-flight fetcher loads
    fetchLoadMatches.forEach((_, key) => {
      if (fetchControllers.has(key)) {
        cancelledFetcherLoads.add(key);
      }
      abortFetcher(key);
    });
  }

  function updateFetcherState(
    key: string,
    fetcher: Fetcher,
    opts: { flushSync?: boolean } = {}
  ) {
    state.fetchers.set(key, fetcher);
    updateState(
      { fetchers: new Map(state.fetchers) },
      { flushSync: (opts && opts.flushSync) === true }
    );
  }

  function setFetcherError(
    key: string,
    routeId: string,
    error: any,
    opts: { flushSync?: boolean } = {}
  ) {
    let boundaryMatch = findNearestBoundary(state.matches, routeId);
    deleteFetcher(key);
    updateState(
      {
        errors: {
          [boundaryMatch.route.id]: error,
        },
        fetchers: new Map(state.fetchers),
      },
      { flushSync: (opts && opts.flushSync) === true }
    );
  }

  function getFetcher<TData = any>(key: string): Fetcher<TData> {
    activeFetchers.set(key, (activeFetchers.get(key) || 0) + 1);
    // If this fetcher was previously marked for deletion, unmark it since we
    // have a new instance
    if (fetchersQueuedForDeletion.has(key)) {
      fetchersQueuedForDeletion.delete(key);
    }
    return state.fetchers.get(key) || IDLE_FETCHER;
  }

  function deleteFetcher(key: string): void {
    let fetcher = state.fetchers.get(key);
    // Don't abort the controller if this is a deletion of a fetcher.submit()
    // in it's loading phase since - we don't want to abort the corresponding
    // revalidation and want them to complete and land
    if (
      fetchControllers.has(key) &&
      !(fetcher && fetcher.state === "loading" && fetchReloadIds.has(key))
    ) {
      abortFetcher(key);
    }
    fetchLoadMatches.delete(key);
    fetchReloadIds.delete(key);
    fetchRedirectIds.delete(key);
    fetchersQueuedForDeletion.delete(key);
    cancelledFetcherLoads.delete(key);
    state.fetchers.delete(key);
  }

  function queueFetcherForDeletion(key: string): void {
    let count = (activeFetchers.get(key) || 0) - 1;
    if (count <= 0) {
      activeFetchers.delete(key);
      fetchersQueuedForDeletion.add(key);
    } else {
      activeFetchers.set(key, count);
    }
    updateState({ fetchers: new Map(state.fetchers) });
  }

  function abortFetcher(key: string) {
    let controller = fetchControllers.get(key);
    if (controller) {
      controller.abort();
      fetchControllers.delete(key);
    }
  }

  function markFetchersDone(keys: string[]) {
    for (let key of keys) {
      let fetcher = getFetcher(key);
      let doneFetcher = getDoneFetcher(fetcher.data);
      state.fetchers.set(key, doneFetcher);
    }
  }

  function markFetchRedirectsDone(): boolean {
    let doneKeys = [];
    let updatedFetchers = false;
    for (let key of fetchRedirectIds) {
      let fetcher = state.fetchers.get(key);
      invariant(fetcher, `Expected fetcher: ${key}`);
      if (fetcher.state === "loading") {
        fetchRedirectIds.delete(key);
        doneKeys.push(key);
        updatedFetchers = true;
      }
    }
    markFetchersDone(doneKeys);
    return updatedFetchers;
  }

  function abortStaleFetchLoads(landedId: number): boolean {
    let yeetedKeys = [];
    for (let [key, id] of fetchReloadIds) {
      if (id < landedId) {
        let fetcher = state.fetchers.get(key);
        invariant(fetcher, `Expected fetcher: ${key}`);
        if (fetcher.state === "loading") {
          abortFetcher(key);
          fetchReloadIds.delete(key);
          yeetedKeys.push(key);
        }
      }
    }
    markFetchersDone(yeetedKeys);
    return yeetedKeys.length > 0;
  }

  function getBlocker(key: string, fn: BlockerFunction) {
    let blocker: Blocker = state.blockers.get(key) || IDLE_BLOCKER;

    if (blockerFunctions.get(key) !== fn) {
      blockerFunctions.set(key, fn);
    }

    return blocker;
  }

  function deleteBlocker(key: string) {
    state.blockers.delete(key);
    blockerFunctions.delete(key);
  }

  // Utility function to update blockers, ensuring valid state transitions
  function updateBlocker(key: string, newBlocker: Blocker) {
    let blocker = state.blockers.get(key) || IDLE_BLOCKER;

    // Poor mans state machine :)
    // https://mermaid.live/edit#pako:eNqVkc9OwzAMxl8l8nnjAYrEtDIOHEBIgwvKJTReGy3_lDpIqO27k6awMG0XcrLlnz87nwdonESogKXXBuE79rq75XZO3-yHds0RJVuv70YrPlUrCEe2HfrORS3rubqZfuhtpg5C9wk5tZ4VKcRUq88q9Z8RS0-48cE1iHJkL0ugbHuFLus9L6spZy8nX9MP2CNdomVaposqu3fGayT8T8-jJQwhepo_UtpgBQaDEUom04dZhAN1aJBDlUKJBxE1ceB2Smj0Mln-IBW5AFU2dwUiktt_2Qaq2dBfaKdEup85UV7Yd-dKjlnkabl2Pvr0DTkTreM
    invariant(
      (blocker.state === "unblocked" && newBlocker.state === "blocked") ||
        (blocker.state === "blocked" && newBlocker.state === "blocked") ||
        (blocker.state === "blocked" && newBlocker.state === "proceeding") ||
        (blocker.state === "blocked" && newBlocker.state === "unblocked") ||
        (blocker.state === "proceeding" && newBlocker.state === "unblocked"),
      `Invalid blocker state transition: ${blocker.state} -> ${newBlocker.state}`
    );

    let blockers = new Map(state.blockers);
    blockers.set(key, newBlocker);
    updateState({ blockers });
  }

  function shouldBlockNavigation({
    currentLocation,
    nextLocation,
    historyAction,
  }: {
    currentLocation: Location;
    nextLocation: Location;
    historyAction: NavigationType;
  }): string | undefined {
    if (blockerFunctions.size === 0) {
      return;
    }

    // We ony support a single active blocker at the moment since we don't have
    // any compelling use cases for multi-blocker yet
    if (blockerFunctions.size > 1) {
      warning(false, "A router only supports one blocker at a time");
    }

    let entries = Array.from(blockerFunctions.entries());
    let [blockerKey, blockerFunction] = entries[entries.length - 1];
    let blocker = state.blockers.get(blockerKey);

    if (blocker && blocker.state === "proceeding") {
      // If the blocker is currently proceeding, we don't need to re-check
      // it and can let this navigation continue
      return;
    }

    // At this point, we know we're unblocked/blocked so we need to check the
    // user-provided blocker function
    if (blockerFunction({ currentLocation, nextLocation, historyAction })) {
      return blockerKey;
    }
  }

  function handleNavigational404(pathname: string) {
    let error = getInternalRouterError(404, { pathname });
    let routesToUse = inFlightDataRoutes || dataRoutes;
    let { matches, route } = getShortCircuitMatches(routesToUse);

    return { notFoundMatches: matches, route, error };
  }

  // Opt in to capturing and reporting scroll positions during navigations,
  // used by the <ScrollRestoration> component
  function enableScrollRestoration(
    positions: Record<string, number>,
    getPosition: GetScrollPositionFunction,
    getKey?: GetScrollRestorationKeyFunction
  ) {
    savedScrollPositions = positions;
    getScrollPosition = getPosition;
    getScrollRestorationKey = getKey || null;

    // Perform initial hydration scroll restoration, since we miss the boat on
    // the initial updateState() because we've not yet rendered <ScrollRestoration/>
    // and therefore have no savedScrollPositions available
    if (!initialScrollRestored && state.navigation === IDLE_NAVIGATION) {
      initialScrollRestored = true;
      let y = getSavedScrollPosition(state.location, state.matches);
      if (y != null) {
        updateState({ restoreScrollPosition: y });
      }
    }

    return () => {
      savedScrollPositions = null;
      getScrollPosition = null;
      getScrollRestorationKey = null;
    };
  }

  function getScrollKey(location: Location, matches: AgnosticDataRouteMatch[]) {
    if (getScrollRestorationKey) {
      let key = getScrollRestorationKey(
        location,
        matches.map((m) => convertRouteMatchToUiMatch(m, state.loaderData))
      );
      return key || location.key;
    }
    return location.key;
  }

  function saveScrollPosition(
    location: Location,
    matches: AgnosticDataRouteMatch[]
  ): void {
    if (savedScrollPositions && getScrollPosition) {
      let key = getScrollKey(location, matches);
      savedScrollPositions[key] = getScrollPosition();
    }
  }

  function getSavedScrollPosition(
    location: Location,
    matches: AgnosticDataRouteMatch[]
  ): number | null {
    if (savedScrollPositions) {
      let key = getScrollKey(location, matches);
      let y = savedScrollPositions[key];
      if (typeof y === "number") {
        return y;
      }
    }
    return null;
  }

  function checkFogOfWar(
    matches: AgnosticDataRouteMatch[] | null,
    routesToUse: AgnosticDataRouteObject[],
    pathname: string
  ): { active: boolean; matches: AgnosticDataRouteMatch[] | null } {
    if (init.patchRoutesOnNavigation) {
      if (!matches) {
        let fogMatches = matchRoutesImpl<AgnosticDataRouteObject>(
          routesToUse,
          pathname,
          basename,
          true
        );

        return { active: true, matches: fogMatches || [] };
      } else {
        if (Object.keys(matches[0].params).length > 0) {
          // If we matched a dynamic param or a splat, it might only be because
          // we haven't yet discovered other routes that would match with a
          // higher score.  Call patchRoutesOnNavigation just to be sure
          let partialMatches = matchRoutesImpl<AgnosticDataRouteObject>(
            routesToUse,
            pathname,
            basename,
            true
          );
          return { active: true, matches: partialMatches };
        }
      }
    }

    return { active: false, matches: null };
  }

  type DiscoverRoutesSuccessResult = {
    type: "success";
    matches: AgnosticDataRouteMatch[] | null;
  };
  type DiscoverRoutesErrorResult = {
    type: "error";
    error: any;
    partialMatches: AgnosticDataRouteMatch[];
  };
  type DiscoverRoutesAbortedResult = { type: "aborted" };
  type DiscoverRoutesResult =
    | DiscoverRoutesSuccessResult
    | DiscoverRoutesErrorResult
    | DiscoverRoutesAbortedResult;

  async function discoverRoutes(
    matches: AgnosticDataRouteMatch[],
    pathname: string,
    signal: AbortSignal,
    fetcherKey?: string
  ): Promise<DiscoverRoutesResult> {
    if (!init.patchRoutesOnNavigation) {
      return { type: "success", matches };
    }

    let partialMatches: AgnosticDataRouteMatch[] | null = matches;
    while (true) {
      let isNonHMR = inFlightDataRoutes == null;
      let routesToUse = inFlightDataRoutes || dataRoutes;
      let localManifest = manifest;
      try {
        await init.patchRoutesOnNavigation({
          signal,
          path: pathname,
          matches: partialMatches,
          fetcherKey,
          patch: (routeId, children) => {
            if (signal.aborted) return;
            patchRoutesImpl(
              routeId,
              children,
              routesToUse,
              localManifest,
              mapRouteProperties
            );
          },
        });
      } catch (e) {
        return { type: "error", error: e, partialMatches };
      } finally {
        // If we are not in the middle of an HMR revalidation and we changed the
        // routes, provide a new identity so when we `updateState` at the end of
        // this navigation/fetch `router.routes` will be a new identity and
        // trigger a re-run of memoized `router.routes` dependencies.
        // HMR will already update the identity and reflow when it lands
        // `inFlightDataRoutes` in `completeNavigation`
        if (isNonHMR && !signal.aborted) {
          dataRoutes = [...dataRoutes];
        }
      }

      if (signal.aborted) {
        return { type: "aborted" };
      }

      let newMatches = matchRoutes(routesToUse, pathname, basename);
      if (newMatches) {
        return { type: "success", matches: newMatches };
      }

      let newPartialMatches = matchRoutesImpl<AgnosticDataRouteObject>(
        routesToUse,
        pathname,
        basename,
        true
      );

      // Avoid loops if the second pass results in the same partial matches
      if (
        !newPartialMatches ||
        (partialMatches.length === newPartialMatches.length &&
          partialMatches.every(
            (m, i) => m.route.id === newPartialMatches![i].route.id
          ))
      ) {
        return { type: "success", matches: null };
      }

      partialMatches = newPartialMatches;
    }
  }

  function _internalSetRoutes(newRoutes: AgnosticDataRouteObject[]) {
    manifest = {};
    inFlightDataRoutes = convertRoutesToDataRoutes(
      newRoutes,
      mapRouteProperties,
      undefined,
      manifest
    );
  }

  function patchRoutes(
    routeId: string | null,
    children: AgnosticRouteObject[]
  ): void {
    let isNonHMR = inFlightDataRoutes == null;
    let routesToUse = inFlightDataRoutes || dataRoutes;
    patchRoutesImpl(
      routeId,
      children,
      routesToUse,
      manifest,
      mapRouteProperties
    );

    // If we are not in the middle of an HMR revalidation and we changed the
    // routes, provide a new identity and trigger a reflow via `updateState`
    // to re-run memoized `router.routes` dependencies.
    // HMR will already update the identity and reflow when it lands
    // `inFlightDataRoutes` in `completeNavigation`
    if (isNonHMR) {
      dataRoutes = [...dataRoutes];
      updateState({});
    }
  }

  router = {
    get basename() {
      return basename;
    },
    get future() {
      return future;
    },
    get state() {
      return state;
    },
    get routes() {
      return dataRoutes;
    },
    get window() {
      return routerWindow;
    },
    initialize,
    subscribe,
    enableScrollRestoration,
    navigate,
    fetch,
    revalidate,
    // Passthrough to history-aware createHref used by useHref so we get proper
    // hash-aware URLs in DOM paths
    createHref: (to: To) => init.history.createHref(to),
    encodeLocation: (to: To) => init.history.encodeLocation(to),
    getFetcher,
    deleteFetcher: queueFetcherForDeletion,
    dispose,
    getBlocker,
    deleteBlocker,
    patchRoutes,
    _internalFetchControllers: fetchControllers,
    // TODO: Remove setRoutes, it's temporary to avoid dealing with
    // updating the tree while validating the update algorithm.
    _internalSetRoutes,
  };

  return router;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region createStaticHandler
////////////////////////////////////////////////////////////////////////////////

export interface CreateStaticHandlerOptions {
  basename?: string;
  mapRouteProperties?: MapRoutePropertiesFunction;
  future?: {};
}

export function createStaticHandler(
  routes: AgnosticRouteObject[],
  opts?: CreateStaticHandlerOptions
): StaticHandler {
  invariant(
    routes.length > 0,
    "You must provide a non-empty routes array to createStaticHandler"
  );

  let manifest: RouteManifest = {};
  let basename = (opts ? opts.basename : null) || "/";
  let mapRouteProperties =
    opts?.mapRouteProperties || defaultMapRouteProperties;

  let dataRoutes = convertRoutesToDataRoutes(
    routes,
    mapRouteProperties,
    undefined,
    manifest
  );

  /**
   * The query() method is intended for document requests, in which we want to
   * call an optional action and potentially multiple loaders for all nested
   * routes.  It returns a StaticHandlerContext object, which is very similar
   * to the router state (location, loaderData, actionData, errors, etc.) and
   * also adds SSR-specific information such as the statusCode and headers
   * from action/loaders Responses.
   *
   * It _should_ never throw and should report all errors through the
   * returned handlerContext.errors object, properly associating errors to
   * their error boundary.  Additionally, it tracks _deepestRenderedBoundaryId
   * which can be used to emulate React error boundaries during SSR by performing
   * a second pass only down to the boundaryId.
   *
   * The one exception where we do not return a StaticHandlerContext is when a
   * redirect response is returned or thrown from any action/loader.  We
   * propagate that out and return the raw Response so the HTTP server can
   * return it directly.
   *
   * - `opts.requestContext` is an optional server context that will be passed
   *   to actions/loaders in the `context` parameter
   * - `opts.skipLoaderErrorBubbling` is an optional parameter that will prevent
   *   the bubbling of errors which allows single-fetch-type implementations
   *   where the client will handle the bubbling and we may need to return data
   *   for the handling route
   */
  async function query(
    request: Parameters<StaticHandler["query"]>[0],
    {
      requestContext,
      filterMatchesToLoad,
      skipLoaderErrorBubbling,
      skipRevalidation,
      dataStrategy,
      unstable_respond: respond,
    }: Parameters<StaticHandler["query"]>[1] = {}
  ): Promise<StaticHandlerContext | Response> {
    let url = new URL(request.url);
    let method = request.method;
    let location = createLocation("", createPath(url), null, "default");
    let matches = matchRoutes(dataRoutes, location, basename);
    requestContext =
      requestContext != null
        ? requestContext
        : new unstable_RouterContextProvider();

    // SSR supports HEAD requests while SPA doesn't
    if (!isValidMethod(method) && method !== "HEAD") {
      let error = getInternalRouterError(405, { method });
      let { matches: methodNotAllowedMatches, route } =
        getShortCircuitMatches(dataRoutes);
      let staticContext: StaticHandlerContext = {
        basename,
        location,
        matches: methodNotAllowedMatches,
        loaderData: {},
        actionData: null,
        errors: {
          [route.id]: error,
        },
        statusCode: error.status,
        loaderHeaders: {},
        actionHeaders: {},
      };
      return respond ? respond(staticContext) : staticContext;
    } else if (!matches) {
      let error = getInternalRouterError(404, { pathname: location.pathname });
      let { matches: notFoundMatches, route } =
        getShortCircuitMatches(dataRoutes);
      let staticContext: StaticHandlerContext = {
        basename,
        location,
        matches: notFoundMatches,
        loaderData: {},
        actionData: null,
        errors: {
          [route.id]: error,
        },
        statusCode: error.status,
        loaderHeaders: {},
        actionHeaders: {},
      };
      return respond ? respond(staticContext) : staticContext;
    }

    if (respond && matches.some((m) => m.route.unstable_middleware)) {
      invariant(
        requestContext instanceof unstable_RouterContextProvider,
        "When using middleware in `staticHandler.query()`, any provided " +
          "`requestContext` must be an instance of `unstable_RouterContextProvider`"
      );
      try {
        let renderedStaticContext: StaticHandlerContext | undefined;
        let response = await runMiddlewarePipeline(
          {
            request,
            matches,
            params: matches[0].params,
            // If we're calling middleware then it must be enabled so we can cast
            // this to the proper type knowing it's not an `AppLoadContext`
            context: requestContext as unstable_RouterContextProvider,
          },
          true,
          async () => {
            let result = await queryImpl(
              request,
              location,
              matches!,
              requestContext,
              dataStrategy || null,
              skipLoaderErrorBubbling === true,
              null,
              filterMatchesToLoad || null,
              skipRevalidation === true
            );

            if (isResponse(result)) {
              return result;
            }

            // When returning StaticHandlerContext, we patch back in the location here
            // since we need it for React Context.  But this helps keep our submit and
            // loadRouteData operating on a Request instead of a Location
            renderedStaticContext = { location, basename, ...result };
            let res = await respond(renderedStaticContext);

            return res;
          },
          async (e) => {
            if (isResponse(e.error)) {
              return e.error;
            }

            if (renderedStaticContext) {
              // We rendered an HTML response and caught an error going back up
              // the middleware chain - render again with an updated context

              // If we had loaderData for the route that threw, clear it out
              // to align server/client behavior.  Client side middleware uses
              // dataStrategy and a given route can only have one result, so the
              // error overwrites any prior loader data.
              if (e.routeId in renderedStaticContext.loaderData) {
                renderedStaticContext.loaderData[e.routeId] = undefined;
              }

              return respond(
                getStaticContextFromError(
                  dataRoutes,
                  renderedStaticContext,
                  e.error,
                  findNearestBoundary(matches!, e.routeId).route.id
                )
              );
            } else {
              // We never even got to the handlers, so we've got no data -
              // just create an empty context reflecting the error.
              // Find the boundary at or above the highest loader.  We can't
              // render any UI below there since we have no loader data available
              let loaderIdx = matches!.findIndex((m) => m.route.loader);
              let boundary =
                loaderIdx >= 0
                  ? findNearestBoundary(matches!, matches![loaderIdx].route.id)
                  : findNearestBoundary(matches!);

              return respond({
                matches: matches!,
                location,
                basename,
                loaderData: {},
                actionData: null,
                errors: {
                  [boundary.route.id]: e.error,
                },
                statusCode: isRouteErrorResponse(e.error)
                  ? e.error.status
                  : 500,
                actionHeaders: {},
                loaderHeaders: {},
              });
            }
          }
        );

        invariant(isResponse(response), "Expected a response in query()");
        return response;
      } catch (e) {
        if (isResponse(e)) {
          return e;
        }
        throw e;
      }
    }

    let result = await queryImpl(
      request,
      location,
      matches,
      requestContext,
      dataStrategy || null,
      skipLoaderErrorBubbling === true,
      null,
      filterMatchesToLoad || null,
      skipRevalidation === true
    );

    if (isResponse(result)) {
      return result;
    }

    // When returning StaticHandlerContext, we patch back in the location here
    // since we need it for React Context.  But this helps keep our submit and
    // loadRouteData operating on a Request instead of a Location
    return { location, basename, ...result };
  }

  /**
   * The queryRoute() method is intended for targeted route requests, either
   * for fetch ?_data requests or resource route requests.  In this case, we
   * are only ever calling a single action or loader, and we are returning the
   * returned value directly.  In most cases, this will be a Response returned
   * from the action/loader, but it may be a primitive or other value as well -
   * and in such cases the calling context should handle that accordingly.
   *
   * We do respect the throw/return differentiation, so if an action/loader
   * throws, then this method will throw the value.  This is important so we
   * can do proper boundary identification in Remix where a thrown Response
   * must go to the Catch Boundary but a returned Response is happy-path.
   *
   * One thing to note is that any Router-initiated Errors that make sense
   * to associate with a status code will be thrown as an ErrorResponse
   * instance which include the raw Error, such that the calling context can
   * serialize the error as they see fit while including the proper response
   * code.  Examples here are 404 and 405 errors that occur prior to reaching
   * any user-defined loaders.
   *
   * - `opts.routeId` allows you to specify the specific route handler to call.
   *   If not provided the handler will determine the proper route by matching
   *   against `request.url`
   * - `opts.requestContext` is an optional server context that will be passed
   *    to actions/loaders in the `context` parameter
   */
  async function queryRoute(
    request: Parameters<StaticHandler["queryRoute"]>[0],
    {
      routeId,
      requestContext,
      dataStrategy,
      unstable_respond: respond,
    }: Parameters<StaticHandler["queryRoute"]>[1] = {}
  ): Promise<any> {
    let url = new URL(request.url);
    let method = request.method;
    let location = createLocation("", createPath(url), null, "default");
    let matches = matchRoutes(dataRoutes, location, basename);
    requestContext =
      requestContext != null
        ? requestContext
        : new unstable_RouterContextProvider();

    // SSR supports HEAD requests while SPA doesn't
    if (!isValidMethod(method) && method !== "HEAD" && method !== "OPTIONS") {
      throw getInternalRouterError(405, { method });
    } else if (!matches) {
      throw getInternalRouterError(404, { pathname: location.pathname });
    }

    let match = routeId
      ? matches.find((m) => m.route.id === routeId)
      : getTargetMatch(matches, location);

    if (routeId && !match) {
      throw getInternalRouterError(403, {
        pathname: location.pathname,
        routeId,
      });
    } else if (!match) {
      // This should never hit I don't think?
      throw getInternalRouterError(404, { pathname: location.pathname });
    }

    if (respond && matches.some((m) => m.route.unstable_middleware)) {
      invariant(
        requestContext instanceof unstable_RouterContextProvider,
        "When using middleware in `staticHandler.queryRoute()`, any provided " +
          "`requestContext` must bean instance of `unstable_RouterContextProvider`"
      );
      let response = await runMiddlewarePipeline(
        {
          request,
          matches,
          params: matches[0].params,
          // If we're calling middleware then it must be enabled so we can cast
          // this to the proper type knowing it's not an `AppLoadContext`
          context: requestContext as unstable_RouterContextProvider,
        },
        true,
        async () => {
          let result = await queryImpl(
            request,
            location,
            matches!,
            requestContext,
            dataStrategy || null,
            false,
            match!,
            null,
            false
          );

          if (isResponse(result)) {
            return respond(result);
          }

          let error = result.errors
            ? Object.values(result.errors)[0]
            : undefined;

          if (error !== undefined) {
            // If we got back result.errors, that means the loader/action threw
            // _something_ that wasn't a Response, but it's not guaranteed/required
            // to be an `instanceof Error` either, so we have to use throw here to
            // preserve the "error" state outside of queryImpl.
            throw error;
          }

          // Pick off the right state value to return
          let value = result.actionData
            ? Object.values(result.actionData)[0]
            : Object.values(result.loaderData)[0];

          return typeof value === "string"
            ? new Response(value)
            : Response.json(value);
        },
        (e) => {
          if (isResponse(e.error)) {
            return respond(e.error);
          }
          return new Response(String(e.error), {
            status: 500,
            statusText: "Unexpected Server Error",
          });
        }
      );
      return response;
    }

    let result = await queryImpl(
      request,
      location,
      matches,
      requestContext,
      dataStrategy || null,
      false,
      match,
      null,
      false
    );

    if (isResponse(result)) {
      return result;
    }

    let error = result.errors ? Object.values(result.errors)[0] : undefined;
    if (error !== undefined) {
      // If we got back result.errors, that means the loader/action threw
      // _something_ that wasn't a Response, but it's not guaranteed/required
      // to be an `instanceof Error` either, so we have to use throw here to
      // preserve the "error" state outside of queryImpl.
      throw error;
    }

    // Pick off the right state value to return
    if (result.actionData) {
      return Object.values(result.actionData)[0];
    }

    if (result.loaderData) {
      return Object.values(result.loaderData)[0];
    }

    return undefined;
  }

  async function queryImpl(
    request: Request,
    location: Location,
    matches: AgnosticDataRouteMatch[],
    requestContext: unknown,
    dataStrategy: DataStrategyFunction<unknown> | null,
    skipLoaderErrorBubbling: boolean,
    routeMatch: AgnosticDataRouteMatch | null,
    filterMatchesToLoad: ((m: AgnosticDataRouteMatch) => boolean) | null,
    skipRevalidation: boolean
  ): Promise<Omit<StaticHandlerContext, "location" | "basename"> | Response> {
    invariant(
      request.signal,
      "query()/queryRoute() requests must contain an AbortController signal"
    );

    try {
      if (isMutationMethod(request.method)) {
        let result = await submit(
          request,
          matches,
          routeMatch || getTargetMatch(matches, location),
          requestContext,
          dataStrategy,
          skipLoaderErrorBubbling,
          routeMatch != null,
          filterMatchesToLoad,
          skipRevalidation
        );
        return result;
      }

      let result = await loadRouteData(
        request,
        matches,
        requestContext,
        dataStrategy,
        skipLoaderErrorBubbling,
        routeMatch,
        filterMatchesToLoad
      );
      return isResponse(result)
        ? result
        : {
            ...result,
            actionData: null,
            actionHeaders: {},
          };
    } catch (e) {
      // If the user threw/returned a Response in callLoaderOrAction for a
      // `queryRoute` call, we throw the `DataStrategyResult` to bail out early
      // and then return or throw the raw Response here accordingly
      if (isDataStrategyResult(e) && isResponse(e.result)) {
        if (e.type === ResultType.error) {
          throw e.result;
        }
        return e.result;
      }
      // Redirects are always returned since they don't propagate to catch
      // boundaries
      if (isRedirectResponse(e)) {
        return e;
      }
      throw e;
    }
  }

  async function submit(
    request: Request,
    matches: AgnosticDataRouteMatch[],
    actionMatch: AgnosticDataRouteMatch,
    requestContext: unknown,
    dataStrategy: DataStrategyFunction<unknown> | null,
    skipLoaderErrorBubbling: boolean,
    isRouteRequest: boolean,
    filterMatchesToLoad: ((m: AgnosticDataRouteMatch) => boolean) | null,
    skipRevalidation: boolean
  ): Promise<Omit<StaticHandlerContext, "location" | "basename"> | Response> {
    let result: DataResult;

    if (!actionMatch.route.action && !actionMatch.route.lazy) {
      let error = getInternalRouterError(405, {
        method: request.method,
        pathname: new URL(request.url).pathname,
        routeId: actionMatch.route.id,
      });
      if (isRouteRequest) {
        throw error;
      }
      result = {
        type: ResultType.error,
        error,
      };
    } else {
      let results = await callDataStrategy(
        "action",
        request,
        [actionMatch],
        matches,
        isRouteRequest,
        requestContext,
        dataStrategy
      );
      result = results[actionMatch.route.id];

      if (request.signal.aborted) {
        throwStaticHandlerAbortedError(request, isRouteRequest);
      }
    }

    if (isRedirectResult(result)) {
      // Uhhhh - this should never happen, we should always throw these from
      // callLoaderOrAction, but the type narrowing here keeps TS happy and we
      // can get back on the "throw all redirect responses" train here should
      // this ever happen :/
      throw new Response(null, {
        status: result.response.status,
        headers: {
          Location: result.response.headers.get("Location")!,
        },
      });
    }

    if (isRouteRequest) {
      // Note: This should only be non-Response values if we get here, since
      // isRouteRequest should throw any Response received in callLoaderOrAction
      if (isErrorResult(result)) {
        throw result.error;
      }

      return {
        matches: [actionMatch],
        loaderData: {},
        actionData: { [actionMatch.route.id]: result.data },
        errors: null,
        // Note: statusCode + headers are unused here since queryRoute will
        // return the raw Response or value
        statusCode: 200,
        loaderHeaders: {},
        actionHeaders: {},
      };
    }

    if (skipRevalidation) {
      if (isErrorResult(result)) {
        let boundaryMatch = skipLoaderErrorBubbling
          ? actionMatch
          : findNearestBoundary(matches, actionMatch.route.id);

        return {
          statusCode: isRouteErrorResponse(result.error)
            ? result.error.status
            : result.statusCode != null
            ? result.statusCode
            : 500,
          actionData: null,
          actionHeaders: {
            ...(result.headers
              ? { [actionMatch.route.id]: result.headers }
              : {}),
          },
          matches,
          loaderData: {},
          errors: {
            [boundaryMatch.route.id]: result.error,
          },
          loaderHeaders: {},
        };
      } else {
        return {
          actionData: {
            [actionMatch.route.id]: result.data,
          },
          actionHeaders: result.headers
            ? { [actionMatch.route.id]: result.headers }
            : {},
          matches,
          loaderData: {},
          errors: null,
          statusCode: result.statusCode || 200,
          loaderHeaders: {},
        };
      }
    }

    // Create a GET request for the loaders
    let loaderRequest = new Request(request.url, {
      headers: request.headers,
      redirect: request.redirect,
      signal: request.signal,
    });

    if (isErrorResult(result)) {
      // Store off the pending error - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = skipLoaderErrorBubbling
        ? actionMatch
        : findNearestBoundary(matches, actionMatch.route.id);

      let handlerContext = await loadRouteData(
        loaderRequest,
        matches,
        requestContext,
        dataStrategy,
        skipLoaderErrorBubbling,
        null,
        filterMatchesToLoad,
        [boundaryMatch.route.id, result]
      );

      // action status codes take precedence over loader status codes
      return {
        ...handlerContext,
        statusCode: isRouteErrorResponse(result.error)
          ? result.error.status
          : result.statusCode != null
          ? result.statusCode
          : 500,
        actionData: null,
        actionHeaders: {
          ...(result.headers ? { [actionMatch.route.id]: result.headers } : {}),
        },
      };
    }

    let handlerContext = await loadRouteData(
      loaderRequest,
      matches,
      requestContext,
      dataStrategy,
      skipLoaderErrorBubbling,
      null,
      filterMatchesToLoad
    );

    return {
      ...handlerContext,
      actionData: {
        [actionMatch.route.id]: result.data,
      },
      // action status codes take precedence over loader status codes
      ...(result.statusCode ? { statusCode: result.statusCode } : {}),
      actionHeaders: result.headers
        ? { [actionMatch.route.id]: result.headers }
        : {},
    };
  }

  async function loadRouteData(
    request: Request,
    matches: AgnosticDataRouteMatch[],
    requestContext: unknown,
    dataStrategy: DataStrategyFunction<unknown> | null,
    skipLoaderErrorBubbling: boolean,
    routeMatch: AgnosticDataRouteMatch | null,
    filterMatchesToLoad: ((match: AgnosticDataRouteMatch) => boolean) | null,
    pendingActionResult?: PendingActionResult
  ): Promise<
    | Omit<
        StaticHandlerContext,
        "location" | "basename" | "actionData" | "actionHeaders"
      >
    | Response
  > {
    let isRouteRequest = routeMatch != null;

    // Short circuit if we have no loaders to run (queryRoute())
    if (
      isRouteRequest &&
      !routeMatch?.route.loader &&
      !routeMatch?.route.lazy
    ) {
      throw getInternalRouterError(400, {
        method: request.method,
        pathname: new URL(request.url).pathname,
        routeId: routeMatch?.route.id,
      });
    }

    let requestMatches = routeMatch
      ? [routeMatch]
      : pendingActionResult && isErrorResult(pendingActionResult[1])
      ? getLoaderMatchesUntilBoundary(matches, pendingActionResult[0])
      : matches;
    let matchesToLoad = requestMatches.filter(
      (m) =>
        (m.route.loader || m.route.lazy) &&
        (!filterMatchesToLoad || filterMatchesToLoad(m))
    );

    // Short circuit if we have no loaders to run (query())
    if (matchesToLoad.length === 0) {
      return {
        matches,
        // Add a null for all matched routes for proper revalidation on the client
        loaderData: matches.reduce(
          (acc, m) => Object.assign(acc, { [m.route.id]: null }),
          {}
        ),
        errors:
          pendingActionResult && isErrorResult(pendingActionResult[1])
            ? {
                [pendingActionResult[0]]: pendingActionResult[1].error,
              }
            : null,
        statusCode: 200,
        loaderHeaders: {},
      };
    }

    let results = await callDataStrategy(
      "loader",
      request,
      matchesToLoad,
      matches,
      isRouteRequest,
      requestContext,
      dataStrategy
    );

    if (request.signal.aborted) {
      throwStaticHandlerAbortedError(request, isRouteRequest);
    }

    // Process and commit output from loaders
    let handlerContext = processRouteLoaderData(
      matches,
      results,
      pendingActionResult,
      true,
      skipLoaderErrorBubbling
    );

    // Add a null for any non-loader matches for proper revalidation on the client
    let executedLoaders = new Set<string>(
      matchesToLoad.map((match) => match.route.id)
    );
    matches.forEach((match) => {
      if (!executedLoaders.has(match.route.id)) {
        handlerContext.loaderData[match.route.id] = null;
      }
    });

    return {
      ...handlerContext,
      matches,
    };
  }

  // Utility wrapper for calling dataStrategy server-side without having to
  // pass around the manifest, mapRouteProperties, etc.
  async function callDataStrategy(
    type: "loader" | "action",
    request: Request,
    matchesToLoad: AgnosticDataRouteMatch[],
    matches: AgnosticDataRouteMatch[],
    isRouteRequest: boolean,
    requestContext: unknown,
    dataStrategy: DataStrategyFunction<unknown> | null
  ): Promise<Record<string, DataResult>> {
    let results = await callDataStrategyImpl(
      dataStrategy || defaultDataStrategy,
      type,
      request,
      matchesToLoad,
      matches,
      null,
      manifest,
      mapRouteProperties,
      requestContext,
      false // middleware not done via dataStrategy in the static handler
    );

    let dataResults: Record<string, DataResult> = {};
    await Promise.all(
      matches.map(async (match) => {
        if (!(match.route.id in results)) {
          return;
        }
        let result = results[match.route.id];
        if (isRedirectDataStrategyResult(result)) {
          let response = result.result as Response;
          // Throw redirects and let the server handle them with an HTTP redirect
          throw normalizeRelativeRoutingRedirectResponse(
            response,
            request,
            match.route.id,
            matches,
            basename
          );
        }
        if (isResponse(result.result) && isRouteRequest) {
          // For SSR single-route requests, we want to hand Responses back
          // directly without unwrapping
          throw result;
        }

        dataResults[match.route.id] =
          await convertDataStrategyResultToDataResult(result);
      })
    );
    return dataResults;
  }

  return {
    dataRoutes,
    query,
    queryRoute,
  };
}

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Helpers
////////////////////////////////////////////////////////////////////////////////

/**
 * Given an existing StaticHandlerContext and an error thrown at render time,
 * provide an updated StaticHandlerContext suitable for a second SSR render
 *
 * @category Utils
 */
export function getStaticContextFromError(
  routes: AgnosticDataRouteObject[],
  handlerContext: StaticHandlerContext,
  error: any,
  boundaryId?: string
): StaticHandlerContext {
  let errorBoundaryId =
    boundaryId || handlerContext._deepestRenderedBoundaryId || routes[0].id;
  return {
    ...handlerContext,
    statusCode: isRouteErrorResponse(error) ? error.status : 500,
    errors: {
      [errorBoundaryId]: error,
    },
  };
}

function throwStaticHandlerAbortedError(
  request: Request,
  isRouteRequest: boolean
) {
  if (request.signal.reason !== undefined) {
    throw request.signal.reason;
  }

  let method = isRouteRequest ? "queryRoute" : "query";
  throw new Error(
    `${method}() call aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`
  );
}

function isSubmissionNavigation(
  opts: BaseNavigateOrFetchOptions
): opts is SubmissionNavigateOptions {
  return (
    opts != null &&
    (("formData" in opts && opts.formData != null) ||
      ("body" in opts && opts.body !== undefined))
  );
}

function normalizeTo(
  location: Path,
  matches: AgnosticDataRouteMatch[],
  basename: string,
  to: To | null,
  fromRouteId?: string,
  relative?: RelativeRoutingType
) {
  let contextualMatches: AgnosticDataRouteMatch[];
  let activeRouteMatch: AgnosticDataRouteMatch | undefined;
  if (fromRouteId) {
    // Grab matches up to the calling route so our route-relative logic is
    // relative to the correct source route
    contextualMatches = [];
    for (let match of matches) {
      contextualMatches.push(match);
      if (match.route.id === fromRouteId) {
        activeRouteMatch = match;
        break;
      }
    }
  } else {
    contextualMatches = matches;
    activeRouteMatch = matches[matches.length - 1];
  }

  // Resolve the relative path
  let path = resolveTo(
    to ? to : ".",
    getResolveToMatches(contextualMatches),
    stripBasename(location.pathname, basename) || location.pathname,
    relative === "path"
  );

  // When `to` is not specified we inherit search/hash from the current
  // location, unlike when to="." and we just inherit the path.
  // See https://github.com/remix-run/remix/issues/927
  if (to == null) {
    path.search = location.search;
    path.hash = location.hash;
  }

  // Account for `?index` params when routing to the current location
  if ((to == null || to === "" || to === ".") && activeRouteMatch) {
    let nakedIndex = hasNakedIndexQuery(path.search);
    if (activeRouteMatch.route.index && !nakedIndex) {
      // Add one when we're targeting an index route
      path.search = path.search
        ? path.search.replace(/^\?/, "?index&")
        : "?index";
    } else if (!activeRouteMatch.route.index && nakedIndex) {
      // Remove existing ones when we're not
      let params = new URLSearchParams(path.search);
      let indexValues = params.getAll("index");
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? `?${qs}` : "";
    }
  }

  // If we're operating within a basename, prepend it to the pathname.  If
  // this is a root navigation, then just use the raw basename which allows
  // the basename to have full control over the presence of a trailing slash
  // on root actions
  if (basename !== "/") {
    path.pathname =
      path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }

  return createPath(path);
}

// Normalize navigation options by converting formMethod=GET formData objects to
// URLSearchParams so they behave identically to links with query params
function normalizeNavigateOptions(
  isFetcher: boolean,
  path: string,
  opts?: BaseNavigateOrFetchOptions
): {
  path: string;
  submission?: Submission;
  error?: ErrorResponseImpl;
} {
  // Return location verbatim on non-submission navigations
  if (!opts || !isSubmissionNavigation(opts)) {
    return { path };
  }

  if (opts.formMethod && !isValidMethod(opts.formMethod)) {
    return {
      path,
      error: getInternalRouterError(405, { method: opts.formMethod }),
    };
  }

  let getInvalidBodyError = () => ({
    path,
    error: getInternalRouterError(400, { type: "invalid-body" }),
  });

  // Create a Submission on non-GET navigations
  let rawFormMethod = opts.formMethod || "get";
  let formMethod = rawFormMethod.toUpperCase() as FormMethod;
  let formAction = stripHashFromPath(path);

  if (opts.body !== undefined) {
    if (opts.formEncType === "text/plain") {
      // text only support POST/PUT/PATCH/DELETE submissions
      if (!isMutationMethod(formMethod)) {
        return getInvalidBodyError();
      }

      let text =
        typeof opts.body === "string"
          ? opts.body
          : opts.body instanceof FormData ||
            opts.body instanceof URLSearchParams
          ? // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#plain-text-form-data
            Array.from(opts.body.entries()).reduce(
              (acc, [name, value]) => `${acc}${name}=${value}\n`,
              ""
            )
          : String(opts.body);

      return {
        path,
        submission: {
          formMethod,
          formAction,
          formEncType: opts.formEncType,
          formData: undefined,
          json: undefined,
          text,
        },
      };
    } else if (opts.formEncType === "application/json") {
      // json only supports POST/PUT/PATCH/DELETE submissions
      if (!isMutationMethod(formMethod)) {
        return getInvalidBodyError();
      }

      try {
        let json =
          typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;

        return {
          path,
          submission: {
            formMethod,
            formAction,
            formEncType: opts.formEncType,
            formData: undefined,
            json,
            text: undefined,
          },
        };
      } catch (e) {
        return getInvalidBodyError();
      }
    }
  }

  invariant(
    typeof FormData === "function",
    "FormData is not available in this environment"
  );

  let searchParams: URLSearchParams;
  let formData: FormData;

  if (opts.formData) {
    searchParams = convertFormDataToSearchParams(opts.formData);
    formData = opts.formData;
  } else if (opts.body instanceof FormData) {
    searchParams = convertFormDataToSearchParams(opts.body);
    formData = opts.body;
  } else if (opts.body instanceof URLSearchParams) {
    searchParams = opts.body;
    formData = convertSearchParamsToFormData(searchParams);
  } else if (opts.body == null) {
    searchParams = new URLSearchParams();
    formData = new FormData();
  } else {
    try {
      searchParams = new URLSearchParams(opts.body);
      formData = convertSearchParamsToFormData(searchParams);
    } catch (e) {
      return getInvalidBodyError();
    }
  }

  let submission: Submission = {
    formMethod,
    formAction,
    formEncType:
      (opts && opts.formEncType) || "application/x-www-form-urlencoded",
    formData,
    json: undefined,
    text: undefined,
  };

  if (isMutationMethod(submission.formMethod)) {
    return { path, submission };
  }

  // Flatten submission onto URLSearchParams for GET submissions
  let parsedPath = parsePath(path);
  // On GET navigation submissions we can drop the ?index param from the
  // resulting location since all loaders will run.  But fetcher GET submissions
  // only run a single loader so we need to preserve any incoming ?index params
  if (isFetcher && parsedPath.search && hasNakedIndexQuery(parsedPath.search)) {
    searchParams.append("index", "");
  }
  parsedPath.search = `?${searchParams}`;

  return { path: createPath(parsedPath), submission };
}

// Filter out all routes at/below any caught error as they aren't going to
// render so we don't need to load them
function getLoaderMatchesUntilBoundary(
  matches: AgnosticDataRouteMatch[],
  boundaryId: string,
  includeBoundary = false
) {
  let index = matches.findIndex((m) => m.route.id === boundaryId);
  if (index >= 0) {
    return matches.slice(0, includeBoundary ? index + 1 : index);
  }
  return matches;
}

function getMatchesToLoad(
  history: History,
  state: RouterState,
  matches: AgnosticDataRouteMatch[],
  submission: Submission | undefined,
  location: Location,
  initialHydration: boolean,
  isRevalidationRequired: boolean,
  cancelledFetcherLoads: Set<string>,
  fetchersQueuedForDeletion: Set<string>,
  fetchLoadMatches: Map<string, FetchLoadMatch>,
  fetchRedirectIds: Set<string>,
  routesToUse: AgnosticDataRouteObject[],
  basename: string | undefined,
  pendingActionResult?: PendingActionResult
): [AgnosticDataRouteMatch[], RevalidatingFetcher[]] {
  let actionResult = pendingActionResult
    ? isErrorResult(pendingActionResult[1])
      ? pendingActionResult[1].error
      : pendingActionResult[1].data
    : undefined;
  let currentUrl = history.createURL(state.location);
  let nextUrl = history.createURL(location);

  // Pick navigation matches that are net-new or qualify for revalidation
  let boundaryMatches = matches;
  if (initialHydration && state.errors) {
    // On initial hydration, only consider matches up to _and including_ the boundary.
    // This is inclusive to handle cases where a server loader ran successfully,
    // a child server loader bubbled up to this route, but this route has
    // `clientLoader.hydrate` so we want to still run the `clientLoader` so that
    // we have a complete version of `loaderData`
    boundaryMatches = getLoaderMatchesUntilBoundary(
      matches,
      Object.keys(state.errors)[0],
      true
    );
  } else if (pendingActionResult && isErrorResult(pendingActionResult[1])) {
    // If an action threw an error, we call loaders up to, but not including the
    // boundary
    boundaryMatches = getLoaderMatchesUntilBoundary(
      matches,
      pendingActionResult[0]
    );
  }

  // Don't revalidate loaders by default after action 4xx/5xx responses
  // when the flag is enabled.  They can still opt-into revalidation via
  // `shouldRevalidate` via `actionResult`
  let actionStatus = pendingActionResult
    ? pendingActionResult[1].statusCode
    : undefined;
  let shouldSkipRevalidation = actionStatus && actionStatus >= 400;

  let navigationMatches = boundaryMatches.filter((match, index) => {
    let { route } = match;
    if (route.lazy) {
      // We haven't loaded this route yet so we don't know if it's got a loader!
      return true;
    }

    if (route.loader == null) {
      return false;
    }

    if (initialHydration) {
      return shouldLoadRouteOnHydration(route, state.loaderData, state.errors);
    }

    // Always call the loader on new route instances
    if (isNewLoader(state.loaderData, state.matches[index], match)) {
      return true;
    }

    // This is the default implementation for when we revalidate.  If the route
    // provides it's own implementation, then we give them full control but
    // provide this value so they can leverage it if needed after they check
    // their own specific use cases
    let currentRouteMatch = state.matches[index];
    let nextRouteMatch = match;

    return shouldRevalidateLoader(match, {
      currentUrl,
      currentParams: currentRouteMatch.params,
      nextUrl,
      nextParams: nextRouteMatch.params,
      ...submission,
      actionResult,
      actionStatus,
      defaultShouldRevalidate: shouldSkipRevalidation
        ? false
        : // Forced revalidation due to submission, useRevalidator, or X-Remix-Revalidate
          isRevalidationRequired ||
          currentUrl.pathname + currentUrl.search ===
            nextUrl.pathname + nextUrl.search ||
          // Search params affect all loaders
          currentUrl.search !== nextUrl.search ||
          isNewRouteInstance(currentRouteMatch, nextRouteMatch),
    });
  });

  // Pick fetcher.loads that need to be revalidated
  let revalidatingFetchers: RevalidatingFetcher[] = [];
  fetchLoadMatches.forEach((f, key) => {
    // Don't revalidate:
    //  - on initial hydration (shouldn't be any fetchers then anyway)
    //  - if fetcher won't be present in the subsequent render
    //    - no longer matches the URL (v7_fetcherPersist=false)
    //    - was unmounted but persisted due to v7_fetcherPersist=true
    if (
      initialHydration ||
      !matches.some((m) => m.route.id === f.routeId) ||
      fetchersQueuedForDeletion.has(key)
    ) {
      return;
    }

    let fetcherMatches = matchRoutes(routesToUse, f.path, basename);

    // If the fetcher path no longer matches, push it in with null matches so
    // we can trigger a 404 in callLoadersAndMaybeResolveData.  Note this is
    // currently only a use-case for Remix HMR where the route tree can change
    // at runtime and remove a route previously loaded via a fetcher
    if (!fetcherMatches) {
      revalidatingFetchers.push({
        key,
        routeId: f.routeId,
        path: f.path,
        matches: null,
        match: null,
        controller: null,
      });
      return;
    }

    // Revalidating fetchers are decoupled from the route matches since they
    // load from a static href.  They revalidate based on explicit revalidation
    // (submission, useRevalidator, or X-Remix-Revalidate)
    let fetcher = state.fetchers.get(key);
    let fetcherMatch = getTargetMatch(fetcherMatches, f.path);

    let shouldRevalidate = false;
    if (fetchRedirectIds.has(key)) {
      // Never trigger a revalidation of an actively redirecting fetcher
      shouldRevalidate = false;
    } else if (cancelledFetcherLoads.has(key)) {
      // Always mark for revalidation if the fetcher was cancelled
      cancelledFetcherLoads.delete(key);
      shouldRevalidate = true;
    } else if (
      fetcher &&
      fetcher.state !== "idle" &&
      fetcher.data === undefined
    ) {
      // If the fetcher hasn't ever completed loading yet, then this isn't a
      // revalidation, it would just be a brand new load if an explicit
      // revalidation is required
      shouldRevalidate = isRevalidationRequired;
    } else {
      // Otherwise fall back on any user-defined shouldRevalidate, defaulting
      // to explicit revalidations only
      shouldRevalidate = shouldRevalidateLoader(fetcherMatch, {
        currentUrl,
        currentParams: state.matches[state.matches.length - 1].params,
        nextUrl,
        nextParams: matches[matches.length - 1].params,
        ...submission,
        actionResult,
        actionStatus,
        defaultShouldRevalidate: shouldSkipRevalidation
          ? false
          : isRevalidationRequired,
      });
    }

    if (shouldRevalidate) {
      revalidatingFetchers.push({
        key,
        routeId: f.routeId,
        path: f.path,
        matches: fetcherMatches,
        match: fetcherMatch,
        controller: new AbortController(),
      });
    }
  });

  return [navigationMatches, revalidatingFetchers];
}

function shouldLoadRouteOnHydration(
  route: AgnosticDataRouteObject,
  loaderData: RouteData | null | undefined,
  errors: RouteData | null | undefined
) {
  // We dunno if we have a loader - gotta find out!
  if (route.lazy) {
    return true;
  }

  // No loader, nothing to initialize
  if (!route.loader) {
    return false;
  }

  let hasData = loaderData != null && loaderData[route.id] !== undefined;
  let hasError = errors != null && errors[route.id] !== undefined;

  // Don't run if we error'd during SSR
  if (!hasData && hasError) {
    return false;
  }

  // Explicitly opting-in to running on hydration
  if (typeof route.loader === "function" && route.loader.hydrate === true) {
    return true;
  }

  // Otherwise, run if we're not yet initialized with anything
  return !hasData && !hasError;
}

function isNewLoader(
  currentLoaderData: RouteData,
  currentMatch: AgnosticDataRouteMatch,
  match: AgnosticDataRouteMatch
) {
  let isNew =
    // [a] -> [a, b]
    !currentMatch ||
    // [a, b] -> [a, c]
    match.route.id !== currentMatch.route.id;

  // Handle the case that we don't have data for a re-used route, potentially
  // from a prior error
  let isMissingData = !currentLoaderData.hasOwnProperty(match.route.id);

  // Always load if this is a net-new route or we don't yet have data
  return isNew || isMissingData;
}

function isNewRouteInstance(
  currentMatch: AgnosticDataRouteMatch,
  match: AgnosticDataRouteMatch
) {
  let currentPath = currentMatch.route.path;
  return (
    // param change for this match, /users/123 -> /users/456
    currentMatch.pathname !== match.pathname ||
    // splat param changed, which is not present in match.path
    // e.g. /files/images/avatar.jpg -> files/finances.xls
    (currentPath != null &&
      currentPath.endsWith("*") &&
      currentMatch.params["*"] !== match.params["*"])
  );
}

function shouldRevalidateLoader(
  loaderMatch: AgnosticDataRouteMatch,
  arg: ShouldRevalidateFunctionArgs
) {
  if (loaderMatch.route.shouldRevalidate) {
    let routeChoice = loaderMatch.route.shouldRevalidate(arg);
    if (typeof routeChoice === "boolean") {
      return routeChoice;
    }
  }

  return arg.defaultShouldRevalidate;
}

function patchRoutesImpl(
  routeId: string | null,
  children: AgnosticRouteObject[],
  routesToUse: AgnosticDataRouteObject[],
  manifest: RouteManifest,
  mapRouteProperties: MapRoutePropertiesFunction
) {
  let childrenToPatch: AgnosticDataRouteObject[];
  if (routeId) {
    let route = manifest[routeId];
    invariant(
      route,
      `No route found to patch children into: routeId = ${routeId}`
    );
    if (!route.children) {
      route.children = [];
    }
    childrenToPatch = route.children;
  } else {
    childrenToPatch = routesToUse;
  }

  // Don't patch in routes we already know about so that `patch` is idempotent
  // to simplify user-land code. This is useful because we re-call the
  // `patchRoutesOnNavigation` function for matched routes with params.
  let uniqueChildren = children.filter(
    (newRoute) =>
      !childrenToPatch.some((existingRoute) =>
        isSameRoute(newRoute, existingRoute)
      )
  );

  let newRoutes = convertRoutesToDataRoutes(
    uniqueChildren,
    mapRouteProperties,
    [routeId || "_", "patch", String(childrenToPatch?.length || "0")],
    manifest
  );

  childrenToPatch.push(...newRoutes);
}

function isSameRoute(
  newRoute: AgnosticRouteObject,
  existingRoute: AgnosticRouteObject
): boolean {
  // Most optimal check is by id
  if (
    "id" in newRoute &&
    "id" in existingRoute &&
    newRoute.id === existingRoute.id
  ) {
    return true;
  }

  // Second is by pathing differences
  if (
    !(
      newRoute.index === existingRoute.index &&
      newRoute.path === existingRoute.path &&
      newRoute.caseSensitive === existingRoute.caseSensitive
    )
  ) {
    return false;
  }

  // Pathless layout routes are trickier since we need to check children.
  // If they have no children then they're the same as far as we can tell
  if (
    (!newRoute.children || newRoute.children.length === 0) &&
    (!existingRoute.children || existingRoute.children.length === 0)
  ) {
    return true;
  }

  // Otherwise, we look to see if every child in the new route is already
  // represented in the existing route's children
  return newRoute.children!.every((aChild, i) =>
    existingRoute.children?.some((bChild) => isSameRoute(aChild, bChild))
  );
}

/**
 * Execute route.lazy() methods to lazily load route modules (loader, action,
 * shouldRevalidate) and update the routeManifest in place which shares objects
 * with dataRoutes so those get updated as well.
 */
async function loadLazyRouteModule(
  route: AgnosticDataRouteObject,
  mapRouteProperties: MapRoutePropertiesFunction,
  manifest: RouteManifest
) {
  if (!route.lazy) {
    return;
  }

  let lazyRoute = await route.lazy();

  // If the lazy route function was executed and removed by another parallel
  // call then we can return - first lazy() to finish wins because the return
  // value of lazy is expected to be static
  if (!route.lazy) {
    return;
  }

  let routeToUpdate = manifest[route.id];
  invariant(routeToUpdate, "No route found in manifest");

  // Update the route in place.  This should be safe because there's no way
  // we could yet be sitting on this route as we can't get there without
  // resolving lazy() first.
  //
  // This is different than the HMR "update" use-case where we may actively be
  // on the route being updated.  The main concern boils down to "does this
  // mutation affect any ongoing navigations or any current state.matches
  // values?".  If not, it should be safe to update in place.
  let routeUpdates: Record<string, any> = {};
  for (let lazyRouteProperty in lazyRoute) {
    let staticRouteValue =
      routeToUpdate[lazyRouteProperty as keyof typeof routeToUpdate];

    let isPropertyStaticallyDefined =
      staticRouteValue !== undefined &&
      // This property isn't static since it should always be updated based
      // on the route updates
      lazyRouteProperty !== "hasErrorBoundary";

    warning(
      !isPropertyStaticallyDefined,
      `Route "${routeToUpdate.id}" has a static property "${lazyRouteProperty}" ` +
        `defined but its lazy function is also returning a value for this property. ` +
        `The lazy route property "${lazyRouteProperty}" will be ignored.`
    );

    if (
      !isPropertyStaticallyDefined &&
      !immutableRouteKeys.has(lazyRouteProperty as ImmutableRouteKey)
    ) {
      routeUpdates[lazyRouteProperty] =
        lazyRoute[lazyRouteProperty as keyof typeof lazyRoute];
    }
  }

  // Mutate the route with the provided updates.  Do this first so we pass
  // the updated version to mapRouteProperties
  Object.assign(routeToUpdate, routeUpdates);

  // Mutate the `hasErrorBoundary` property on the route based on the route
  // updates and remove the `lazy` function so we don't resolve the lazy
  // route again.
  Object.assign(routeToUpdate, {
    // To keep things framework agnostic, we use the provided `mapRouteProperties`
    // function to set the framework-aware properties (`element`/`hasErrorBoundary`)
    // since the logic will differ between frameworks.
    ...mapRouteProperties(routeToUpdate),
    lazy: undefined,
  });
}

// Default implementation of `dataStrategy` which fetches all loaders in parallel
async function defaultDataStrategy(
  args: DataStrategyFunctionArgs<unknown>
): ReturnType<DataStrategyFunction<unknown>> {
  let matchesToLoad = args.matches.filter((m) => m.shouldLoad);
  let keyedResults: Record<string, DataStrategyResult> = {};
  let results = await Promise.all(matchesToLoad.map((m) => m.resolve()));
  results.forEach((result, i) => {
    keyedResults[matchesToLoad[i].route.id] = result;
  });
  return keyedResults;
}

// Middleware-enabled implementation of `dataStrategy` which calls middleware
// and fetches all loaders in parallel
async function defaultDataStrategyWithMiddleware(
  args: DataStrategyFunctionArgs<unstable_RouterContextProvider>
): ReturnType<DataStrategyFunction<unknown>> {
  // Short circuit all the middleware logic if we have no middlewares
  if (!args.matches.some((m) => m.route.unstable_middleware)) {
    return defaultDataStrategy(args);
  }

  return runMiddlewarePipeline(
    args,
    false,
    () => defaultDataStrategy(args),
    (e) => ({ [e.routeId]: { type: "error", result: e.error } })
  ) as Promise<Record<string, DataStrategyResult>>;
}

type MutableMiddlewareState = {
  handlerResult: unknown;
  propagateResult: boolean;
};

export async function runMiddlewarePipeline<T extends boolean>(
  args: (
    | LoaderFunctionArgs<unstable_RouterContextProvider>
    | ActionFunctionArgs<unstable_RouterContextProvider>
  ) & {
    // Don't use `DataStrategyFunctionArgs` directly so we can we reduce these
    // back from `DataStrategyMatch` to regular matches for use in the staticHandler
    matches: AgnosticDataRouteMatch[];
  },
  propagateResult: T,
  handler: () => T extends true
    ? MaybePromise<Response>
    : MaybePromise<Record<string, DataStrategyResult>>,
  errorHandler: (error: MiddlewareError) => unknown
): Promise<unknown> {
  let { matches, request, params, context } = args;
  let middlewareState: MutableMiddlewareState = {
    handlerResult: undefined,
    propagateResult,
  };
  try {
    let tuples = matches.flatMap((m) =>
      m.route.unstable_middleware
        ? m.route.unstable_middleware.map((fn) => [m.route.id, fn])
        : []
    ) as [string, unstable_MiddlewareFunction][];
    let result = await callRouteMiddleware(
      { request, params, context },
      tuples,
      middlewareState,
      handler
    );
    return middlewareState.propagateResult
      ? result
      : middlewareState.handlerResult;
  } catch (e) {
    if (!(e instanceof MiddlewareError)) {
      // This shouldn't happen?  This would have to come from a bug in our
      // library code...
      throw e;
    }
    let result = await errorHandler(e);
    if (propagateResult || !middlewareState.handlerResult) {
      return result;
    }
    return Object.assign(middlewareState.handlerResult, result);
  }
}

export class MiddlewareError {
  routeId: string;
  error: unknown;
  constructor(routeId: string, error: unknown) {
    this.routeId = routeId;
    this.error = error;
  }
}

async function callRouteMiddleware(
  args:
    | LoaderFunctionArgs<unstable_RouterContextProvider>
    | ActionFunctionArgs<unstable_RouterContextProvider>,
  middlewares: [string, unstable_MiddlewareFunction][],
  middlewareState: MutableMiddlewareState,
  handler: () => void,
  idx = 0
): Promise<unknown> {
  let { request } = args;
  if (request.signal.aborted) {
    if (request.signal.reason) {
      throw request.signal.reason;
    }
    throw new Error(
      `Request aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`
    );
  }

  let tuple = middlewares[idx];
  if (!tuple) {
    // We reached the end of our middlewares, call the handler
    middlewareState.handlerResult = await handler();
    return middlewareState.handlerResult;
  }

  let [routeId, middleware] = tuple;
  let nextCalled = false;
  let nextResult = undefined;
  let next: unstable_MiddlewareNextFunction = async () => {
    if (nextCalled) {
      throw new Error("You may only call `next()` once per middleware");
    }
    nextCalled = true;
    let result = await callRouteMiddleware(
      args,
      middlewares,
      middlewareState,
      handler,
      idx + 1
    );
    if (middlewareState.propagateResult) {
      nextResult = result;
      return nextResult;
    }
  };

  try {
    let result = await middleware(
      {
        request: args.request,
        params: args.params,
        context: args.context,
      },
      next
    );
    if (nextCalled) {
      if (result === undefined) {
        // If they called next() but didn't return the response, we can bubble
        // it for them. This lets folks do things like grab the response and
        // add a header without then re-returning it
        return nextResult;
      } else {
        return result;
      }
    } else {
      return next();
    }
  } catch (e) {
    if (e instanceof MiddlewareError) {
      throw e;
    }
    throw new MiddlewareError(routeId, e);
  }
}

async function callDataStrategyImpl(
  dataStrategyImpl: DataStrategyFunction<unknown>,
  type: "loader" | "action",
  request: Request,
  matchesToLoad: AgnosticDataRouteMatch[],
  matches: AgnosticDataRouteMatch[],
  fetcherKey: string | null,
  manifest: RouteManifest,
  mapRouteProperties: MapRoutePropertiesFunction,
  scopedContext: unknown,
  enableMiddleware: boolean
): Promise<Record<string, DataStrategyResult>> {
  let loadRouteDefinitionsPromises = matches.map((m) =>
    m.route.lazy
      ? loadLazyRouteModule(m.route, mapRouteProperties, manifest)
      : undefined
  );

  if (enableMiddleware) {
    // TODO: For the initial implementation, we await route.lazy here to ensure
    // client side middleware implementations have been loaded prior to running
    // dataStrategy which will then run them.  This is a de-optimization and
    // will be fixed before stable release by adding a new async middleware API
    // allowing us to load middleware sin a split route module.
    await Promise.all(loadRouteDefinitionsPromises);
  }

  let dsMatches = matches.map((match, i) => {
    let loadRoutePromise = loadRouteDefinitionsPromises[i];
    let shouldLoad = matchesToLoad.some((m) => m.route.id === match.route.id);
    // `resolve` encapsulates route.lazy(), executing the loader/action,
    // and mapping return values/thrown errors to a `DataStrategyResult`.  Users
    // can pass a callback to take fine-grained control over the execution
    // of the loader/action
    let resolve: DataStrategyMatch["resolve"] = async (handlerOverride) => {
      if (
        handlerOverride &&
        request.method === "GET" &&
        (match.route.lazy || match.route.loader)
      ) {
        shouldLoad = true;
      }
      return shouldLoad
        ? callLoaderOrAction(
            type,
            request,
            match,
            loadRoutePromise,
            handlerOverride,
            scopedContext
          )
        : Promise.resolve({ type: ResultType.data, result: undefined });
    };

    return {
      ...match,
      shouldLoad,
      resolve,
    };
  });

  // Send all matches here to allow for a middleware-type implementation.
  // handler will be a no-op for unneeded routes and we filter those results
  // back out below.
  let results = await dataStrategyImpl({
    matches: dsMatches,
    request,
    params: matches[0].params,
    fetcherKey,
    context: scopedContext,
  });

  // Wait for all routes to load here but swallow the error since we want
  // it to bubble up from the `await loadRoutePromise` in `callLoaderOrAction` -
  // called from `match.resolve()`
  try {
    await Promise.all(loadRouteDefinitionsPromises);
  } catch (e) {
    // No-op
  }

  return results;
}

// Default logic for calling a loader/action is the user has no specified a dataStrategy
async function callLoaderOrAction(
  type: "loader" | "action",
  request: Request,
  match: AgnosticDataRouteMatch,
  loadRoutePromise: Promise<void> | undefined,
  handlerOverride: Parameters<DataStrategyMatch["resolve"]>[0],
  scopedContext: unknown
): Promise<DataStrategyResult> {
  let result: DataStrategyResult;
  let onReject: (() => void) | undefined;

  let runHandler = (
    handler: boolean | LoaderFunction<unknown> | ActionFunction<unknown>
  ): Promise<DataStrategyResult> => {
    // Setup a promise we can race against so that abort signals short circuit
    let reject: () => void;
    // This will never resolve so safe to type it as Promise<DataStrategyResult> to
    // satisfy the function return value
    let abortPromise = new Promise<DataStrategyResult>((_, r) => (reject = r));
    onReject = () => reject();
    request.signal.addEventListener("abort", onReject);

    let actualHandler = (ctx?: unknown) => {
      if (typeof handler !== "function") {
        return Promise.reject(
          new Error(
            `You cannot call the handler for a route which defines a boolean ` +
              `"${type}" [routeId: ${match.route.id}]`
          )
        );
      }
      return handler(
        {
          request,
          params: match.params,
          context: scopedContext,
        },
        ...(ctx !== undefined ? [ctx] : [])
      );
    };

    let handlerPromise: Promise<DataStrategyResult> = (async () => {
      try {
        let val = await (handlerOverride
          ? handlerOverride((ctx: unknown) => actualHandler(ctx))
          : actualHandler());
        return { type: "data", result: val };
      } catch (e) {
        return { type: "error", result: e };
      }
    })();

    return Promise.race([handlerPromise, abortPromise]);
  };

  try {
    let handler = match.route[type] as
      | LoaderFunction<unknown>
      | ActionFunction<unknown>;

    // If we have a route.lazy promise, await that first
    if (loadRoutePromise) {
      if (handler) {
        // Run statically defined handler in parallel with lazy()
        let handlerError;
        let [value] = await Promise.all([
          // If the handler throws, don't let it immediately bubble out,
          // since we need to let the lazy() execution finish so we know if this
          // route has a boundary that can handle the error
          runHandler(handler).catch((e) => {
            handlerError = e;
          }),
          loadRoutePromise,
        ]);
        if (handlerError !== undefined) {
          throw handlerError;
        }
        result = value!;
      } else {
        // Load lazy route module, then run any returned handler
        await loadRoutePromise;

        handler = match.route[type] as
          | LoaderFunction<unknown>
          | ActionFunction<unknown>;
        if (handler) {
          // Handler still runs even if we got interrupted to maintain consistency
          // with un-abortable behavior of handler execution on non-lazy or
          // previously-lazy-loaded routes
          result = await runHandler(handler);
        } else if (type === "action") {
          let url = new URL(request.url);
          let pathname = url.pathname + url.search;
          throw getInternalRouterError(405, {
            method: request.method,
            pathname,
            routeId: match.route.id,
          });
        } else {
          // lazy() route has no loader to run.  Short circuit here so we don't
          // hit the invariant below that errors on returning undefined.
          return { type: ResultType.data, result: undefined };
        }
      }
    } else if (!handler) {
      let url = new URL(request.url);
      let pathname = url.pathname + url.search;
      throw getInternalRouterError(404, {
        pathname,
      });
    } else {
      result = await runHandler(handler);
    }
  } catch (e) {
    // We should already be catching and converting normal handler executions to
    // DataStrategyResults and returning them, so anything that throws here is an
    // unexpected error we still need to wrap
    return { type: ResultType.error, result: e };
  } finally {
    if (onReject) {
      request.signal.removeEventListener("abort", onReject);
    }
  }

  return result;
}

async function convertDataStrategyResultToDataResult(
  dataStrategyResult: DataStrategyResult
): Promise<DataResult> {
  let { result, type } = dataStrategyResult;

  if (isResponse(result)) {
    let data: any;

    try {
      let contentType = result.headers.get("Content-Type");
      // Check between word boundaries instead of startsWith() due to the last
      // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
      if (contentType && /\bapplication\/json\b/.test(contentType)) {
        if (result.body == null) {
          data = null;
        } else {
          data = await result.json();
        }
      } else {
        data = await result.text();
      }
    } catch (e) {
      return { type: ResultType.error, error: e };
    }

    if (type === ResultType.error) {
      return {
        type: ResultType.error,
        error: new ErrorResponseImpl(result.status, result.statusText, data),
        statusCode: result.status,
        headers: result.headers,
      };
    }

    return {
      type: ResultType.data,
      data,
      statusCode: result.status,
      headers: result.headers,
    };
  }

  if (type === ResultType.error) {
    if (isDataWithResponseInit(result)) {
      if (result.data instanceof Error) {
        return {
          type: ResultType.error,
          error: result.data,
          statusCode: result.init?.status,
          headers: result.init?.headers
            ? new Headers(result.init.headers)
            : undefined,
        };
      }

      // Convert thrown data() to ErrorResponse instances
      return {
        type: ResultType.error,
        error: new ErrorResponseImpl(
          result.init?.status || 500,
          undefined,
          result.data
        ),
        statusCode: isRouteErrorResponse(result) ? result.status : undefined,
        headers: result.init?.headers
          ? new Headers(result.init.headers)
          : undefined,
      };
    }

    return {
      type: ResultType.error,
      error: result,
      statusCode: isRouteErrorResponse(result) ? result.status : undefined,
    };
  }

  if (isDataWithResponseInit(result)) {
    return {
      type: ResultType.data,
      data: result.data,
      statusCode: result.init?.status,
      headers: result.init?.headers
        ? new Headers(result.init.headers)
        : undefined,
    };
  }

  return { type: ResultType.data, data: result };
}

// Support relative routing in internal redirects
function normalizeRelativeRoutingRedirectResponse(
  response: Response,
  request: Request,
  routeId: string,
  matches: AgnosticDataRouteMatch[],
  basename: string
) {
  let location = response.headers.get("Location");
  invariant(
    location,
    "Redirects returned/thrown from loaders/actions must have a Location header"
  );

  if (!ABSOLUTE_URL_REGEX.test(location)) {
    let trimmedMatches = matches.slice(
      0,
      matches.findIndex((m) => m.route.id === routeId) + 1
    );
    location = normalizeTo(
      new URL(request.url),
      trimmedMatches,
      basename,
      location
    );
    response.headers.set("Location", location);
  }

  return response;
}

function normalizeRedirectLocation(
  location: string,
  currentUrl: URL,
  basename: string
): string {
  if (ABSOLUTE_URL_REGEX.test(location)) {
    // Strip off the protocol+origin for same-origin + same-basename absolute redirects
    let normalizedLocation = location;
    let url = normalizedLocation.startsWith("//")
      ? new URL(currentUrl.protocol + normalizedLocation)
      : new URL(normalizedLocation);
    let isSameBasename = stripBasename(url.pathname, basename) != null;
    if (url.origin === currentUrl.origin && isSameBasename) {
      return url.pathname + url.search + url.hash;
    }
  }
  return location;
}

// Utility method for creating the Request instances for loaders/actions during
// client-side navigations and fetches.  During SSR we will always have a
// Request instance from the static handler (query/queryRoute)
function createClientSideRequest(
  history: History,
  location: string | Location,
  signal: AbortSignal,
  submission?: Submission
): Request {
  let url = history.createURL(stripHashFromPath(location)).toString();
  let init: RequestInit = { signal };

  if (submission && isMutationMethod(submission.formMethod)) {
    let { formMethod, formEncType } = submission;
    // Didn't think we needed this but it turns out unlike other methods, patch
    // won't be properly normalized to uppercase and results in a 405 error.
    // See: https://fetch.spec.whatwg.org/#concept-method
    init.method = formMethod.toUpperCase();

    if (formEncType === "application/json") {
      init.headers = new Headers({ "Content-Type": formEncType });
      init.body = JSON.stringify(submission.json);
    } else if (formEncType === "text/plain") {
      // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
      init.body = submission.text;
    } else if (
      formEncType === "application/x-www-form-urlencoded" &&
      submission.formData
    ) {
      // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
      init.body = convertFormDataToSearchParams(submission.formData);
    } else {
      // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
      init.body = submission.formData;
    }
  }

  return new Request(url, init);
}

function convertFormDataToSearchParams(formData: FormData): URLSearchParams {
  let searchParams = new URLSearchParams();

  for (let [key, value] of formData.entries()) {
    // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs
    searchParams.append(key, typeof value === "string" ? value : value.name);
  }

  return searchParams;
}

function convertSearchParamsToFormData(
  searchParams: URLSearchParams
): FormData {
  let formData = new FormData();
  for (let [key, value] of searchParams.entries()) {
    formData.append(key, value);
  }
  return formData;
}

function processRouteLoaderData(
  matches: AgnosticDataRouteMatch[],
  results: Record<string, DataResult>,
  pendingActionResult: PendingActionResult | undefined,
  isStaticHandler = false,
  skipLoaderErrorBubbling = false
): {
  loaderData: RouterState["loaderData"];
  errors: RouterState["errors"] | null;
  statusCode: number;
  loaderHeaders: Record<string, Headers>;
} {
  // Fill in loaderData/errors from our loaders
  let loaderData: RouterState["loaderData"] = {};
  let errors: RouterState["errors"] | null = null;
  let statusCode: number | undefined;
  let foundError = false;
  let loaderHeaders: Record<string, Headers> = {};
  let pendingError =
    pendingActionResult && isErrorResult(pendingActionResult[1])
      ? pendingActionResult[1].error
      : undefined;

  // Process loader results into state.loaderData/state.errors
  matches.forEach((match) => {
    if (!(match.route.id in results)) {
      return;
    }
    let id = match.route.id;
    let result = results[id];
    invariant(
      !isRedirectResult(result),
      "Cannot handle redirect results in processLoaderData"
    );
    if (isErrorResult(result)) {
      let error = result.error;
      // If we have a pending action error, we report it at the highest-route
      // that throws a loader error, and then clear it out to indicate that
      // it was consumed
      if (pendingError !== undefined) {
        error = pendingError;
        pendingError = undefined;
      }

      errors = errors || {};

      if (skipLoaderErrorBubbling) {
        errors[id] = error;
      } else {
        // Look upwards from the matched route for the closest ancestor error
        // boundary, defaulting to the root match.  Prefer higher error values
        // if lower errors bubble to the same boundary
        let boundaryMatch = findNearestBoundary(matches, id);
        if (errors[boundaryMatch.route.id] == null) {
          errors[boundaryMatch.route.id] = error;
        }
      }

      // Clear our any prior loaderData for the throwing route
      if (!isStaticHandler) {
        loaderData[id] = ResetLoaderDataSymbol;
      }

      // Once we find our first (highest) error, we set the status code and
      // prevent deeper status codes from overriding
      if (!foundError) {
        foundError = true;
        statusCode = isRouteErrorResponse(result.error)
          ? result.error.status
          : 500;
      }
      if (result.headers) {
        loaderHeaders[id] = result.headers;
      }
    } else {
      loaderData[id] = result.data;
      // Error status codes always override success status codes, but if all
      // loaders are successful we take the deepest status code.
      if (result.statusCode && result.statusCode !== 200 && !foundError) {
        statusCode = result.statusCode;
      }
      if (result.headers) {
        loaderHeaders[id] = result.headers;
      }
    }
  });

  // If we didn't consume the pending action error (i.e., all loaders
  // resolved), then consume it here.  Also clear out any loaderData for the
  // throwing route
  if (pendingError !== undefined && pendingActionResult) {
    errors = { [pendingActionResult[0]]: pendingError };
    loaderData[pendingActionResult[0]] = undefined;
  }

  return {
    loaderData,
    errors,
    statusCode: statusCode || 200,
    loaderHeaders,
  };
}

function processLoaderData(
  state: RouterState,
  matches: AgnosticDataRouteMatch[],
  results: Record<string, DataResult>,
  pendingActionResult: PendingActionResult | undefined,
  revalidatingFetchers: RevalidatingFetcher[],
  fetcherResults: Record<string, DataResult>
): {
  loaderData: RouterState["loaderData"];
  errors?: RouterState["errors"];
} {
  let { loaderData, errors } = processRouteLoaderData(
    matches,
    results,
    pendingActionResult
  );

  // Process results from our revalidating fetchers
  revalidatingFetchers.forEach((rf) => {
    let { key, match, controller } = rf;
    let result = fetcherResults[key];
    invariant(result, "Did not find corresponding fetcher result");

    // Process fetcher non-redirect errors
    if (controller && controller.signal.aborted) {
      // Nothing to do for aborted fetchers
      return;
    } else if (isErrorResult(result)) {
      let boundaryMatch = findNearestBoundary(state.matches, match?.route.id);
      if (!(errors && errors[boundaryMatch.route.id])) {
        errors = {
          ...errors,
          [boundaryMatch.route.id]: result.error,
        };
      }
      state.fetchers.delete(key);
    } else if (isRedirectResult(result)) {
      // Should never get here, redirects should get processed above, but we
      // keep this to type narrow to a success result in the else
      invariant(false, "Unhandled fetcher revalidation redirect");
    } else {
      let doneFetcher = getDoneFetcher(result.data);
      state.fetchers.set(key, doneFetcher);
    }
  });

  return { loaderData, errors };
}

function mergeLoaderData(
  loaderData: RouteData,
  newLoaderData: RouteData,
  matches: AgnosticDataRouteMatch[],
  errors: RouteData | null | undefined
): RouteData {
  // Start with all new entries that are not being reset
  let mergedLoaderData = Object.entries(newLoaderData)
    .filter(([, v]) => v !== ResetLoaderDataSymbol)
    .reduce((merged, [k, v]) => {
      merged[k] = v;
      return merged;
    }, {} as RouteData);

  // Preserve existing `loaderData` for routes not included in `newLoaderData` and
  // where a loader wasn't removed by HMR
  for (let match of matches) {
    let id = match.route.id;
    if (
      !newLoaderData.hasOwnProperty(id) &&
      loaderData.hasOwnProperty(id) &&
      match.route.loader
    ) {
      mergedLoaderData[id] = loaderData[id];
    }

    if (errors && errors.hasOwnProperty(id)) {
      // Don't keep any loader data below the boundary
      break;
    }
  }
  return mergedLoaderData;
}

function getActionDataForCommit(
  pendingActionResult: PendingActionResult | undefined
) {
  if (!pendingActionResult) {
    return {};
  }
  return isErrorResult(pendingActionResult[1])
    ? {
        // Clear out prior actionData on errors
        actionData: {},
      }
    : {
        actionData: {
          [pendingActionResult[0]]: pendingActionResult[1].data,
        },
      };
}

// Find the nearest error boundary, looking upwards from the leaf route (or the
// route specified by routeId) for the closest ancestor error boundary,
// defaulting to the root match
function findNearestBoundary(
  matches: AgnosticDataRouteMatch[],
  routeId?: string
): AgnosticDataRouteMatch {
  let eligibleMatches = routeId
    ? matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1)
    : [...matches];
  return (
    eligibleMatches.reverse().find((m) => m.route.hasErrorBoundary === true) ||
    matches[0]
  );
}

function getShortCircuitMatches(routes: AgnosticDataRouteObject[]): {
  matches: AgnosticDataRouteMatch[];
  route: AgnosticDataRouteObject;
} {
  // Prefer a root layout route if present, otherwise shim in a route object
  let route =
    routes.length === 1
      ? routes[0]
      : routes.find((r) => r.index || !r.path || r.path === "/") || {
          id: `__shim-error-route__`,
        };

  return {
    matches: [
      {
        params: {},
        pathname: "",
        pathnameBase: "",
        route,
      },
    ],
    route,
  };
}

function getInternalRouterError(
  status: number,
  {
    pathname,
    routeId,
    method,
    type,
    message,
  }: {
    pathname?: string;
    routeId?: string;
    method?: string;
    type?: "invalid-body";
    message?: string;
  } = {}
) {
  let statusText = "Unknown Server Error";
  let errorMessage = "Unknown @remix-run/router error";

  if (status === 400) {
    statusText = "Bad Request";
    if (method && pathname && routeId) {
      errorMessage =
        `You made a ${method} request to "${pathname}" but ` +
        `did not provide a \`loader\` for route "${routeId}", ` +
        `so there is no way to handle the request.`;
    } else if (type === "invalid-body") {
      errorMessage = "Unable to encode submission body";
    }
  } else if (status === 403) {
    statusText = "Forbidden";
    errorMessage = `Route "${routeId}" does not match URL "${pathname}"`;
  } else if (status === 404) {
    statusText = "Not Found";
    errorMessage = `No route matches URL "${pathname}"`;
  } else if (status === 405) {
    statusText = "Method Not Allowed";
    if (method && pathname && routeId) {
      errorMessage =
        `You made a ${method.toUpperCase()} request to "${pathname}" but ` +
        `did not provide an \`action\` for route "${routeId}", ` +
        `so there is no way to handle the request.`;
    } else if (method) {
      errorMessage = `Invalid request method "${method.toUpperCase()}"`;
    }
  }

  return new ErrorResponseImpl(
    status || 500,
    statusText,
    new Error(errorMessage),
    true
  );
}

// Find any returned redirect errors, starting from the lowest match
function findRedirect(
  results: Record<string, DataResult>
): { key: string; result: RedirectResult } | undefined {
  let entries = Object.entries(results);
  for (let i = entries.length - 1; i >= 0; i--) {
    let [key, result] = entries[i];
    if (isRedirectResult(result)) {
      return { key, result };
    }
  }
}

function stripHashFromPath(path: To) {
  let parsedPath = typeof path === "string" ? parsePath(path) : path;
  return createPath({ ...parsedPath, hash: "" });
}

function isHashChangeOnly(a: Location, b: Location): boolean {
  if (a.pathname !== b.pathname || a.search !== b.search) {
    return false;
  }

  if (a.hash === "") {
    // /page -> /page#hash
    return b.hash !== "";
  } else if (a.hash === b.hash) {
    // /page#hash -> /page#hash
    return true;
  } else if (b.hash !== "") {
    // /page#hash -> /page#other
    return true;
  }

  // If the hash is removed the browser will re-perform a request to the server
  // /page#hash -> /page
  return false;
}

function isDataStrategyResult(result: unknown): result is DataStrategyResult {
  return (
    result != null &&
    typeof result === "object" &&
    "type" in result &&
    "result" in result &&
    (result.type === ResultType.data || result.type === ResultType.error)
  );
}

function isRedirectDataStrategyResult(result: DataStrategyResult) {
  return (
    isResponse(result.result) && redirectStatusCodes.has(result.result.status)
  );
}
function isErrorResult(result: DataResult): result is ErrorResult {
  return result.type === ResultType.error;
}

function isRedirectResult(result?: DataResult): result is RedirectResult {
  return (result && result.type) === ResultType.redirect;
}

export function isDataWithResponseInit(
  value: any
): value is DataWithResponseInit<unknown> {
  return (
    typeof value === "object" &&
    value != null &&
    "type" in value &&
    "data" in value &&
    "init" in value &&
    value.type === "DataWithResponseInit"
  );
}

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

export function isRedirectStatusCode(statusCode: number): boolean {
  return redirectStatusCodes.has(statusCode);
}

export function isRedirectResponse(result: any): result is Response {
  return (
    isResponse(result) &&
    isRedirectStatusCode(result.status) &&
    result.headers.has("Location")
  );
}

function isValidMethod(method: string): method is FormMethod {
  return validRequestMethods.has(method.toUpperCase() as FormMethod);
}

function isMutationMethod(method: string): method is MutationFormMethod {
  return validMutationMethods.has(method.toUpperCase() as MutationFormMethod);
}

function hasNakedIndexQuery(search: string): boolean {
  return new URLSearchParams(search).getAll("index").some((v) => v === "");
}

function getTargetMatch(
  matches: AgnosticDataRouteMatch[],
  location: Location | string
) {
  let search =
    typeof location === "string" ? parsePath(location).search : location.search;
  if (
    matches[matches.length - 1].route.index &&
    hasNakedIndexQuery(search || "")
  ) {
    // Return the leaf index route when index is present
    return matches[matches.length - 1];
  }
  // Otherwise grab the deepest "path contributing" match (ignoring index and
  // pathless layout routes)
  let pathMatches = getPathContributingMatches(matches);
  return pathMatches[pathMatches.length - 1];
}

function getSubmissionFromNavigation(
  navigation: Navigation
): Submission | undefined {
  let { formMethod, formAction, formEncType, text, formData, json } =
    navigation;
  if (!formMethod || !formAction || !formEncType) {
    return;
  }

  if (text != null) {
    return {
      formMethod,
      formAction,
      formEncType,
      formData: undefined,
      json: undefined,
      text,
    };
  } else if (formData != null) {
    return {
      formMethod,
      formAction,
      formEncType,
      formData,
      json: undefined,
      text: undefined,
    };
  } else if (json !== undefined) {
    return {
      formMethod,
      formAction,
      formEncType,
      formData: undefined,
      json,
      text: undefined,
    };
  }
}

function getLoadingNavigation(
  location: Location,
  submission?: Submission
): NavigationStates["Loading"] {
  if (submission) {
    let navigation: NavigationStates["Loading"] = {
      state: "loading",
      location,
      formMethod: submission.formMethod,
      formAction: submission.formAction,
      formEncType: submission.formEncType,
      formData: submission.formData,
      json: submission.json,
      text: submission.text,
    };
    return navigation;
  } else {
    let navigation: NavigationStates["Loading"] = {
      state: "loading",
      location,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      json: undefined,
      text: undefined,
    };
    return navigation;
  }
}

function getSubmittingNavigation(
  location: Location,
  submission: Submission
): NavigationStates["Submitting"] {
  let navigation: NavigationStates["Submitting"] = {
    state: "submitting",
    location,
    formMethod: submission.formMethod,
    formAction: submission.formAction,
    formEncType: submission.formEncType,
    formData: submission.formData,
    json: submission.json,
    text: submission.text,
  };
  return navigation;
}

function getLoadingFetcher(
  submission?: Submission,
  data?: Fetcher["data"]
): FetcherStates["Loading"] {
  if (submission) {
    let fetcher: FetcherStates["Loading"] = {
      state: "loading",
      formMethod: submission.formMethod,
      formAction: submission.formAction,
      formEncType: submission.formEncType,
      formData: submission.formData,
      json: submission.json,
      text: submission.text,
      data,
    };
    return fetcher;
  } else {
    let fetcher: FetcherStates["Loading"] = {
      state: "loading",
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      json: undefined,
      text: undefined,
      data,
    };
    return fetcher;
  }
}

function getSubmittingFetcher(
  submission: Submission,
  existingFetcher?: Fetcher
): FetcherStates["Submitting"] {
  let fetcher: FetcherStates["Submitting"] = {
    state: "submitting",
    formMethod: submission.formMethod,
    formAction: submission.formAction,
    formEncType: submission.formEncType,
    formData: submission.formData,
    json: submission.json,
    text: submission.text,
    data: existingFetcher ? existingFetcher.data : undefined,
  };
  return fetcher;
}

function getDoneFetcher(data: Fetcher["data"]): FetcherStates["Idle"] {
  let fetcher: FetcherStates["Idle"] = {
    state: "idle",
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined,
    data,
  };
  return fetcher;
}

function restoreAppliedTransitions(
  _window: Window,
  transitions: Map<string, Set<string>>
) {
  try {
    let sessionPositions = _window.sessionStorage.getItem(
      TRANSITIONS_STORAGE_KEY
    );
    if (sessionPositions) {
      let json = JSON.parse(sessionPositions);
      for (let [k, v] of Object.entries(json || {})) {
        if (v && Array.isArray(v)) {
          transitions.set(k, new Set(v || []));
        }
      }
    }
  } catch (e) {
    // no-op, use default empty object
  }
}

function persistAppliedTransitions(
  _window: Window,
  transitions: Map<string, Set<string>>
) {
  if (transitions.size > 0) {
    let json: Record<string, string[]> = {};
    for (let [k, v] of transitions) {
      json[k] = [...v];
    }
    try {
      _window.sessionStorage.setItem(
        TRANSITIONS_STORAGE_KEY,
        JSON.stringify(json)
      );
    } catch (error) {
      warning(
        false,
        `Failed to save applied view transitions in sessionStorage (${error}).`
      );
    }
  }
}

function createDeferred<T = unknown>() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise<T>((res, rej) => {
    resolve = async (val: T) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: Error) => {
      rej(error);
      try {
        await promise;
      } catch (e) {}
    };
  });
  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}
//#endregion
