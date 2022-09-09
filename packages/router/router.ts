import type { History, Location, Path, To } from "./history";
import {
  Action as HistoryAction,
  createLocation,
  createPath,
  parsePath,
} from "./history";
import type {
  DataResult,
  AgnosticDataRouteMatch,
  AgnosticDataRouteObject,
  DeferredResult,
  ErrorResult,
  FormEncType,
  FormMethod,
  RedirectResult,
  RouteData,
  AgnosticRouteObject,
  Submission,
  SuccessResult,
  AgnosticRouteMatch,
} from "./utils";
import {
  DeferredData,
  ErrorResponse,
  ResultType,
  convertRoutesToDataRoutes,
  invariant,
  isRouteErrorResponse,
  matchRoutes,
} from "./utils";

////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////

/**
 * A Router instance manages all navigation and data loading/mutations
 */
export interface Router {
  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Return the basename for the router
   */
  get basename(): RouterInit["basename"];

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Return the current state of the router
   */
  get state(): RouterState;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Return the routes for this router instance
   */
  get routes(): AgnosticDataRouteObject[];

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Initialize the router, including adding history listeners and kicking off
   * initial data fetches.  Returns a function to cleanup listeners and abort
   * any in-progress loads
   */
  initialize(): Router;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Subscribe to router.state updates
   *
   * @param fn function to call with the new state
   */
  subscribe(fn: RouterSubscriber): () => void;

  /**
   * @internal
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
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Navigate forward/backward in the history stack
   * @param to Delta to move in the history stack
   */
  navigate(to: number): void;

  /**
   * Navigate to the given path
   * @param to Path to navigate to
   * @param opts Navigation options (method, submission, etc.)
   */
  navigate(to: To, opts?: RouterNavigateOptions): void;

  /**
   * @internal
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
    href: string,
    opts?: RouterNavigateOptions
  ): void;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Trigger a revalidation of all current route loaders and fetcher loads
   */
  revalidate(): void;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Utility function to create an href for the given location
   * @param location
   */
  createHref(location: Location | URL): string;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Get/create a fetcher for the given key
   * @param key
   */
  getFetcher<TData = any>(key?: string): Fetcher<TData>;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Delete the fetcher for a given key
   * @param key
   */
  deleteFetcher(key?: string): void;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Cleanup listeners and abort any in-progress loads
   */
  dispose(): void;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Internal fetch AbortControllers accessed by unit tests
   */
  _internalFetchControllers: Map<string, AbortController>;

  /**
   * @internal
   * PRIVATE - DO NOT USE
   *
   * Internal pending DeferredData instances accessed by unit tests
   */
  _internalActiveDeferreds: Map<string, DeferredData>;
}

/**
 * State maintained internally by the router.  During a navigation, all states
 * reflect the the "old" location unless otherwise noted.
 */
export interface RouterState {
  /**
   * The action of the most recent navigation
   */
  historyAction: HistoryAction;

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
}

/**
 * Data that can be passed into hydrate a Router from SSR
 */
export type HydrationState = Partial<
  Pick<RouterState, "loaderData" | "actionData" | "errors">
>;

/**
 * Initialization options for createRouter
 */
export interface RouterInit {
  basename?: string;
  routes: AgnosticRouteObject[];
  history: History;
  hydrationData?: HydrationState;
}

/**
 * State returned from a server-side query() call
 */
export interface StaticHandlerContext {
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
  query(request: Request): Promise<StaticHandlerContext | Response>;
  queryRoute(request: Request, routeId?: string): Promise<any>;
}

/**
 * Subscriber function signature for changes to router state
 */
export interface RouterSubscriber {
  (state: RouterState): void;
}

interface UseMatchesMatch {
  id: string;
  pathname: string;
  params: AgnosticRouteMatch["params"];
  data: unknown;
  handle: unknown;
}

/**
 * Function signature for determining the key to be used in scroll restoration
 * for a given location
 */
export interface GetScrollRestorationKeyFunction {
  (location: Location, matches: UseMatchesMatch[]): string | null;
}

/**
 * Function signature for determining the current scroll position
 */
export interface GetScrollPositionFunction {
  (): number;
}

/**
 * Options for a navigate() call for a Link navigation
 */
type LinkNavigateOptions = {
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
};

/**
 * Options for a navigate() call for a Form navigation
 */
type SubmissionNavigateOptions = {
  replace?: boolean;
  state?: any;
  formMethod?: FormMethod;
  formEncType?: FormEncType;
  formData: FormData;
};

/**
 * Options to pass to navigate() for either a Link or Form navigation
 */
export type RouterNavigateOptions =
  | LinkNavigateOptions
  | SubmissionNavigateOptions;

/**
 * Options to pass to fetch()
 */
export type RouterFetchOptions =
  | Omit<LinkNavigateOptions, "replace">
  | Omit<SubmissionNavigateOptions, "replace">;

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
  };
  Loading: {
    state: "loading";
    location: Location;
    formMethod: FormMethod | undefined;
    formAction: string | undefined;
    formEncType: FormEncType | undefined;
    formData: FormData | undefined;
  };
  Submitting: {
    state: "submitting";
    location: Location;
    formMethod: FormMethod;
    formAction: string;
    formEncType: FormEncType;
    formData: FormData;
  };
};

export type Navigation = NavigationStates[keyof NavigationStates];

export type RevalidationState = "idle" | "loading";

/**
 * Potential states for fetchers
 */
type FetcherStates<TData = any> = {
  Idle: {
    state: "idle";
    formMethod: undefined;
    formAction: undefined;
    formEncType: undefined;
    formData: undefined;
    data: TData | undefined;
  };
  Loading: {
    state: "loading";
    formMethod: FormMethod | undefined;
    formAction: string | undefined;
    formEncType: FormEncType | undefined;
    formData: FormData | undefined;
    data: TData | undefined;
  };
  Submitting: {
    state: "submitting";
    formMethod: FormMethod;
    formAction: string;
    formEncType: FormEncType;
    formData: FormData;
    data: TData | undefined;
  };
};

export type Fetcher<TData = any> =
  FetcherStates<TData>[keyof FetcherStates<TData>];

interface ShortCircuitable {
  /**
   * startNavigation does not need to complete the navigation because we
   * redirected or got interrupted
   */
  shortCircuited?: boolean;
}

interface HandleActionResult extends ShortCircuitable {
  /**
   * Error thrown from the current action, keyed by the route containing the
   * error boundary to render the error.  To be committed to the state after
   * loaders have completed
   */
  pendingActionError?: RouteData;
  /**
   * Data returned from the current action, keyed by the route owning the action.
   * To be committed to the state after loaders have completed
   */
  pendingActionData?: RouteData;
}

interface HandleLoadersResult extends ShortCircuitable {
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
 * Tuple of [key, href, DataRouterMatch] for a revalidating fetcher.load()
 */
type RevalidatingFetcher = [string, string, AgnosticDataRouteMatch];

/**
 * Tuple of [href, DataRouteMatch] for an active fetcher.load()
 */
type FetchLoadMatch = [string, AgnosticDataRouteMatch];

export const IDLE_NAVIGATION: NavigationStates["Idle"] = {
  state: "idle",
  location: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
};

export const IDLE_FETCHER: FetcherStates["Idle"] = {
  state: "idle",
  data: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
};
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region createRouter
////////////////////////////////////////////////////////////////////////////////

/**
 * Create a router and listen to history POP navigations
 */
export function createRouter(init: RouterInit): Router {
  invariant(
    init.routes.length > 0,
    "You must provide a non-empty routes array to createRouter"
  );

  let dataRoutes = convertRoutesToDataRoutes(init.routes);
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
  let initialScrollRestored = false;

  let initialMatches = matchRoutes(
    dataRoutes,
    init.history.location,
    init.basename
  );
  let initialErrors: RouteData | null = null;

  if (initialMatches == null) {
    // If we do not match a user-provided-route, fall back to the root
    // to allow the error boundary to take over
    let { matches, route, error } = getNotFoundMatches(dataRoutes);
    initialMatches = matches;
    initialErrors = { [route.id]: error };
  }

  let initialized =
    !initialMatches.some((m) => m.route.loader) || init.hydrationData != null;

  let router: Router;
  let state: RouterState = {
    historyAction: init.history.action,
    location: init.history.location,
    matches: initialMatches,
    initialized,
    navigation: IDLE_NAVIGATION,
    restoreScrollPosition: null,
    preventScrollReset: false,
    revalidation: "idle",
    loaderData: init.hydrationData?.loaderData || {},
    actionData: init.hydrationData?.actionData || null,
    errors: init.hydrationData?.errors || initialErrors,
    fetchers: new Map(),
  };

  // -- Stateful internal variables to manage navigations --
  // Current navigation in progress (to be committed in completeNavigation)
  let pendingAction: HistoryAction = HistoryAction.Pop;
  // Should the current navigation prevent the scroll reset if scroll cannot
  // be restored?
  let pendingPreventScrollReset = false;
  // AbortController for the active navigation
  let pendingNavigationController: AbortController | null;
  // We use this to avoid touching history in completeNavigation if a
  // revalidation is entirely uninterrupted
  let isUninterruptedRevalidation = false;
  // Use this internal flag to force revalidation of all loaders:
  //  - submissions (completed or interrupted)
  //  - useRevalidate()
  //  - X-Remix-Revalidate (from redirect)
  let isRevalidationRequired = false;
  // Use this internal array to capture routes that require revalidation due
  // to a cancelled deferred on action submission
  let cancelledDeferredRoutes: string[] = [];
  // Use this internal array to capture fetcher loads that were cancelled by an
  // action navigation and require revalidation
  let cancelledFetcherLoads: string[] = [];
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
  // Fetchers that triggered redirect navigations from their actions
  let fetchRedirectIds = new Set<string>();
  // Most recent href/match for fetcher.load calls for fetchers
  let fetchLoadMatches = new Map<string, FetchLoadMatch>();
  // Store DeferredData instances for active route matches.  When a
  // route loader returns defer() we stick one in here.  Then, when a nested
  // promise resolves we update loaderData.  If a new navigation starts we
  // cancel active deferreds for eliminated routes.
  let activeDeferreds = new Map<string, DeferredData>();

  // Initialize the router, all side effects should be kicked off from here.
  // Implemented as a Fluent API for ease of:
  //   let router = createRouter(init).initialize();
  function initialize() {
    // If history informs us of a POP navigation, start the navigation but do not update
    // state.  We'll update our own state once the navigation completes
    unlistenHistory = init.history.listen(
      ({ action: historyAction, location }) =>
        startNavigation(historyAction, location)
    );

    // Kick off initial data load if needed.  Use Pop to avoid modifying history
    if (!state.initialized) {
      startNavigation(HistoryAction.Pop, state.location);
    }

    return router;
  }

  // Clean up a router and it's side effects
  function dispose() {
    if (unlistenHistory) {
      unlistenHistory();
    }
    subscribers.clear();
    pendingNavigationController?.abort();
    state.fetchers.forEach((_, key) => deleteFetcher(key));
  }

  // Subscribe to state updates for the router
  function subscribe(fn: RouterSubscriber) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  // Update our state and notify the calling context of the change
  function updateState(newState: Partial<RouterState>): void {
    state = {
      ...state,
      ...newState,
    };
    subscribers.forEach((subscriber) => subscriber(state));
  }

  // Complete a navigation returning the state.navigation back to the IDLE_NAVIGATION
  // and setting state.[historyAction/location/matches] to the new route.
  // - Location is a required param
  // - Navigation will always be set to IDLE_NAVIGATION
  // - Can pass any other state in newState
  function completeNavigation(
    location: Location,
    newState: Partial<Omit<RouterState, "action" | "location" | "navigation">>
  ): void {
    // Deduce if we're in a loading/actionReload state:
    // - We have committed actionData in the store
    // - The current navigation was a submission
    // - We're past the submitting state and into the loading state
    // - This should not be susceptible to false positives for
    //   loading/submissionRedirect since there would not be actionData in the
    //   state since the prior action would have returned a redirect response
    //   and short circuited
    let isActionReload =
      state.actionData != null &&
      state.navigation.formMethod != null &&
      state.navigation.state === "loading";

    // Always preserve any existing loaderData from re-used routes
    let newLoaderData = newState.loaderData
      ? {
          loaderData: mergeLoaderData(
            state.loaderData,
            newState.loaderData,
            newState.matches || []
          ),
        }
      : {};

    updateState({
      // Clear existing actionData on any completed navigation beyond the original
      // action, unless we're currently finishing the loading/actionReload state.
      // Do this prior to spreading in newState in case we got back to back actions
      ...(isActionReload ? {} : { actionData: null }),
      ...newState,
      ...newLoaderData,
      historyAction: pendingAction,
      location,
      initialized: true,
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      // Don't restore on submission navigations
      restoreScrollPosition: state.navigation.formData
        ? false
        : getSavedScrollPosition(location, newState.matches || state.matches),
      preventScrollReset: pendingPreventScrollReset,
    });

    if (isUninterruptedRevalidation) {
      // If this was an uninterrupted revalidation then do not touch history
    } else if (pendingAction === HistoryAction.Pop) {
      // Do nothing for POP - URL has already been updated
    } else if (pendingAction === HistoryAction.Push) {
      init.history.push(location, location.state);
    } else if (pendingAction === HistoryAction.Replace) {
      init.history.replace(location, location.state);
    }

    // Reset stateful navigation vars
    pendingAction = HistoryAction.Pop;
    pendingPreventScrollReset = false;
    isUninterruptedRevalidation = false;
    isRevalidationRequired = false;
    cancelledDeferredRoutes = [];
    cancelledFetcherLoads = [];
  }

  // Trigger a navigation event, which can either be a numerical POP or a PUSH
  // replace with an optional submission
  async function navigate(
    to: number | To,
    opts?: RouterNavigateOptions
  ): Promise<void> {
    if (typeof to === "number") {
      init.history.go(to);
      return;
    }

    let { path, submission, error } = normalizeNavigateOptions(to, opts);

    let location = createLocation(state.location, path, opts?.state);
    let historyAction =
      opts?.replace === true || submission != null
        ? HistoryAction.Replace
        : HistoryAction.Push;
    let preventScrollReset =
      opts && "preventScrollReset" in opts
        ? opts.preventScrollReset === true
        : undefined;

    return await startNavigation(historyAction, location, {
      submission,
      // Send through the formData serialization error if we have one so we can
      // render at the right error boundary after we match routes
      pendingError: error,
      preventScrollReset,
      replace: opts?.replace,
    });
  }

  // Revalidate all current loaders.  If a navigation is in progress or if this
  // is interrupted by a navigation, allow this to "succeed" by calling all
  // loaders during the next loader round
  function revalidate() {
    interruptActiveLoads();
    updateState({ revalidation: "loading" });

    // If we're currently submitting an action, we don't need to start a new
    // navigation, we'll just let the follow up loader execution call all loaders
    if (state.navigation.state === "submitting") {
      return;
    }

    // If we're currently in an idle state, start a new navigation for the current
    // action/location and mark it as uninterrupted, which will skip the history
    // update in completeNavigation
    if (state.navigation.state === "idle") {
      startNavigation(state.historyAction, state.location, {
        startUninterruptedRevalidation: true,
      });
      return;
    }

    // Otherwise, if we're currently in a loading state, just start a new
    // navigation to the navigation.location but do not trigger an uninterrupted
    // revalidation so that history correctly updates once the navigation completes
    startNavigation(
      pendingAction || state.historyAction,
      state.navigation.location,
      { overrideNavigation: state.navigation }
    );
  }

  // Start a navigation to the given action/location.  Can optionally provide a
  // overrideNavigation which will override the normalLoad in the case of a redirect
  // navigation
  async function startNavigation(
    historyAction: HistoryAction,
    location: Location,
    opts?: {
      submission?: Submission;
      overrideNavigation?: Navigation;
      pendingError?: ErrorResponse;
      startUninterruptedRevalidation?: boolean;
      preventScrollReset?: boolean;
      replace?: boolean;
    }
  ): Promise<void> {
    // Abort any in-progress navigations and start a new one. Unset any ongoing
    // uninterrupted revalidations unless told otherwise, since we want this
    // new navigation to update history normally
    pendingNavigationController?.abort();
    pendingNavigationController = null;
    pendingAction = historyAction;
    isUninterruptedRevalidation = opts?.startUninterruptedRevalidation === true;

    // Save the current scroll position every time we start a new navigation,
    // and track whether we should reset scroll on completion
    saveScrollPosition(state.location, state.matches);
    pendingPreventScrollReset = opts?.preventScrollReset === true;

    let loadingNavigation = opts?.overrideNavigation;
    let matches = matchRoutes(dataRoutes, location, init.basename);

    // Short circuit with a 404 on the root error boundary if we match nothing
    if (!matches) {
      let {
        matches: notFoundMatches,
        route,
        error,
      } = getNotFoundMatches(dataRoutes);
      // Cancel all pending deferred on 404s since we don't keep any routes
      cancelActiveDeferreds();
      completeNavigation(location, {
        matches: notFoundMatches,
        loaderData: {},
        errors: {
          [route.id]: error,
        },
      });
      return;
    }

    // Short circuit if it's only a hash change
    if (isHashChangeOnly(state.location, location)) {
      completeNavigation(location, { matches });
      return;
    }

    // Create a controller/Request for this navigation
    pendingNavigationController = new AbortController();
    let request = createRequest(
      location,
      pendingNavigationController.signal,
      opts?.submission
    );
    let pendingActionData: RouteData | undefined;
    let pendingError: RouteData | undefined;

    if (opts?.pendingError) {
      // If we have a pendingError, it means the user attempted a GET submission
      // with binary FormData so assign here and skip to handleLoaders.  That
      // way we handle calling loaders above the boundary etc.  It's not really
      // different from an actionError in that sense.
      pendingError = {
        [findNearestBoundary(matches).route.id]: opts.pendingError,
      };
    } else if (opts?.submission) {
      // Call action if we received an action submission
      let actionOutput = await handleAction(
        request,
        location,
        opts.submission,
        matches,
        { replace: opts.replace }
      );

      if (actionOutput.shortCircuited) {
        return;
      }

      pendingActionData = actionOutput.pendingActionData;
      pendingError = actionOutput.pendingActionError;

      let navigation: NavigationStates["Loading"] = {
        state: "loading",
        location,
        ...opts.submission,
      };
      loadingNavigation = navigation;
    }

    // Call loaders
    let { shortCircuited, loaderData, errors } = await handleLoaders(
      request,
      location,
      matches,
      loadingNavigation,
      opts?.submission,
      opts?.replace,
      pendingActionData,
      pendingError
    );

    if (shortCircuited) {
      return;
    }

    // Clean up now that the action/loaders have completed.  Don't clean up if
    // we short circuited because pendingNavigationController will have already
    // been assigned to a new controller for the next navigation
    pendingNavigationController = null;

    completeNavigation(location, {
      matches,
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
    opts?: { replace?: boolean }
  ): Promise<HandleActionResult> {
    interruptActiveLoads();

    // Put us in a submitting state
    let navigation: NavigationStates["Submitting"] = {
      state: "submitting",
      location,
      ...submission,
    };
    updateState({ navigation });

    // Call our action and get the result
    let result: DataResult;
    let actionMatch = getTargetMatch(matches, location);

    if (!actionMatch.route.action) {
      result = getMethodNotAllowedResult(location);
    } else {
      result = await callLoaderOrAction("action", request, actionMatch);

      if (request.signal.aborted) {
        return { shortCircuited: true };
      }
    }

    if (isRedirectResult(result)) {
      let redirectNavigation: NavigationStates["Loading"] = {
        state: "loading",
        location: createLocation(state.location, result.location),
        ...submission,
      };
      await startRedirectNavigation(result, redirectNavigation, opts?.replace);
      return { shortCircuited: true };
    }

    if (isErrorResult(result)) {
      // Store off the pending error - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);

      // By default, all submissions are REPLACE navigations, but if the
      // action threw an error that'll be rendered in an errorElement, we fall
      // back to PUSH so that the user can use the back button to get back to
      // the pre-submission form location to try again
      if (opts?.replace !== true) {
        pendingAction = HistoryAction.Push;
      }

      return {
        pendingActionError: { [boundaryMatch.route.id]: result.error },
      };
    }

    if (isDeferredResult(result)) {
      throw new Error("defer() is not supported in actions");
    }

    return {
      pendingActionData: { [actionMatch.route.id]: result.data },
    };
  }

  // Call all applicable loaders for the given matches, handling redirects,
  // errors, etc.
  async function handleLoaders(
    request: Request,
    location: Location,
    matches: AgnosticDataRouteMatch[],
    overrideNavigation?: Navigation,
    submission?: Submission,
    replace?: boolean,
    pendingActionData?: RouteData,
    pendingError?: RouteData
  ): Promise<HandleLoadersResult> {
    // Figure out the right navigation we want to use for data loading
    let loadingNavigation = overrideNavigation;
    if (!loadingNavigation) {
      let navigation: NavigationStates["Loading"] = {
        state: "loading",
        location,
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
      };
      loadingNavigation = navigation;
    }

    let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(
      state,
      matches,
      submission,
      location,
      isRevalidationRequired,
      cancelledDeferredRoutes,
      cancelledFetcherLoads,
      pendingActionData,
      pendingError,
      fetchLoadMatches
    );

    // Cancel pending deferreds for no-longer-matched routes or routes we're
    // about to reload.  Note that if this is an action reload we would have
    // already cancelled all pending deferreds so this would be a no-op
    cancelActiveDeferreds(
      (routeId) =>
        !matches?.some((m) => m.route.id === routeId) ||
        matchesToLoad?.some((m) => m.route.id === routeId)
    );

    // Short circuit if we have no loaders to run
    if (matchesToLoad.length === 0 && revalidatingFetchers.length === 0) {
      completeNavigation(location, {
        matches,
        loaderData: mergeLoaderData(state.loaderData, {}, matches),
        // Commit pending error if we're short circuiting
        errors: pendingError || null,
        actionData: pendingActionData || null,
      });
      return { shortCircuited: true };
    }

    // If this is an uninterrupted revalidation, we remain in our current idle
    // state.  If not, we need to switch to our loading state and load data,
    // preserving any new action data or existing action data (in the case of
    // a revalidation interrupting an actionReload)
    if (!isUninterruptedRevalidation) {
      revalidatingFetchers.forEach(([key]) => {
        let revalidatingFetcher: FetcherStates["Loading"] = {
          state: "loading",
          data: state.fetchers.get(key)?.data,
          formMethod: undefined,
          formAction: undefined,
          formEncType: undefined,
          formData: undefined,
        };
        state.fetchers.set(key, revalidatingFetcher);
      });
      updateState({
        navigation: loadingNavigation,
        actionData: pendingActionData || state.actionData || null,
        ...(revalidatingFetchers.length > 0
          ? { fetchers: new Map(state.fetchers) }
          : {}),
      });
    }

    pendingNavigationLoadId = ++incrementingLoadId;
    revalidatingFetchers.forEach(([key]) =>
      fetchControllers.set(key, pendingNavigationController!)
    );

    let { results, loaderResults, fetcherResults } =
      await callLoadersAndMaybeResolveData(
        state.matches,
        matchesToLoad,
        revalidatingFetchers,
        request
      );

    if (request.signal.aborted) {
      return { shortCircuited: true };
    }

    // Clean up _after_ loaders have completed.  Don't clean up if we short
    // circuited because fetchControllers would have been aborted and
    // reassigned to new controllers for the next navigation
    revalidatingFetchers.forEach(([key]) => fetchControllers.delete(key));

    // If any loaders returned a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect(results);
    if (redirect) {
      let redirectNavigation = getLoaderRedirect(state, redirect);
      await startRedirectNavigation(redirect, redirectNavigation, replace);
      return { shortCircuited: true };
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      matches,
      matchesToLoad,
      loaderResults,
      pendingError,
      revalidatingFetchers,
      fetcherResults,
      activeDeferreds
    );

    // Wire up subscribers to update loaderData as promises settle
    activeDeferreds.forEach((deferredData, routeId) => {
      deferredData.subscribe((aborted) => {
        // Note: No need to updateState here since the TrackedPromise on
        // loaderData is stable across resolve/reject
        // Remove this instance if we were aborted or if promises have settled
        if (aborted || deferredData.done) {
          activeDeferreds.delete(routeId);
        }
      });
    });

    markFetchRedirectsDone();
    let didAbortFetchLoads = abortStaleFetchLoads(pendingNavigationLoadId);

    return {
      loaderData,
      errors,
      ...(didAbortFetchLoads || revalidatingFetchers.length > 0
        ? { fetchers: new Map(state.fetchers) }
        : {}),
    };
  }

  function getFetcher<TData = any>(key: string): Fetcher<TData> {
    return state.fetchers.get(key) || IDLE_FETCHER;
  }

  // Trigger a fetcher load/submit for the given fetcher key
  function fetch(
    key: string,
    routeId: string,
    href: string,
    opts?: RouterFetchOptions
  ) {
    if (typeof AbortController === "undefined") {
      throw new Error(
        "router.fetch() was called during the server render, but it shouldn't be. " +
          "You are likely calling a useFetcher() method in the body of your component. " +
          "Try moving it to a useEffect or a callback."
      );
    }

    if (fetchControllers.has(key)) abortFetcher(key);

    let matches = matchRoutes(dataRoutes, href, init.basename);
    if (!matches) {
      setFetcherError(key, routeId, new ErrorResponse(404, "Not Found", null));
      return;
    }

    let { path, submission } = normalizeNavigateOptions(href, opts);
    let match = getTargetMatch(matches, path);

    if (submission) {
      handleFetcherAction(key, routeId, path, match, submission);
      return;
    }

    // Store off the match so we can call it's shouldRevalidate on subsequent
    // revalidations
    fetchLoadMatches.set(key, [path, match]);
    handleFetcherLoader(key, routeId, path, match);
  }

  // Call the action for the matched fetcher.submit(), and then handle redirects,
  // errors, and revalidation
  async function handleFetcherAction(
    key: string,
    routeId: string,
    path: string,
    match: AgnosticDataRouteMatch,
    submission: Submission
  ) {
    interruptActiveLoads();
    fetchLoadMatches.delete(key);

    if (!match.route.action) {
      let { error } = getMethodNotAllowedResult(path);
      setFetcherError(key, routeId, error);
      return;
    }

    // Put this fetcher into it's submitting state
    let fetcher: FetcherStates["Submitting"] = {
      state: "submitting",
      ...submission,
      data: state.fetchers.get(key)?.data || undefined,
    };
    state.fetchers.set(key, fetcher);
    updateState({ fetchers: new Map(state.fetchers) });

    // Call the action for the fetcher
    let abortController = new AbortController();
    let fetchRequest = createRequest(path, abortController.signal, submission);
    fetchControllers.set(key, abortController);

    let actionResult = await callLoaderOrAction("action", fetchRequest, match);

    if (fetchRequest.signal.aborted) {
      // We can delete this so long as we weren't aborted by ou our own fetcher
      // re-submit which would have put _new_ controller is in fetchControllers
      if (fetchControllers.get(key) === abortController) {
        fetchControllers.delete(key);
      }
      return;
    }

    if (isRedirectResult(actionResult)) {
      fetchControllers.delete(key);
      fetchRedirectIds.add(key);
      let loadingFetcher: FetcherStates["Loading"] = {
        state: "loading",
        ...submission,
        data: undefined,
      };
      state.fetchers.set(key, loadingFetcher);
      updateState({ fetchers: new Map(state.fetchers) });

      let redirectNavigation: NavigationStates["Loading"] = {
        state: "loading",
        location: createLocation(state.location, actionResult.location),
        ...submission,
      };
      await startRedirectNavigation(actionResult, redirectNavigation);
      return;
    }

    // Process any non-redirect errors thrown
    if (isErrorResult(actionResult)) {
      setFetcherError(key, routeId, actionResult.error);
      return;
    }

    if (isDeferredResult(actionResult)) {
      invariant(false, "defer() is not supported in actions");
    }

    // Start the data load for current matches, or the next location if we're
    // in the middle of a navigation
    let nextLocation = state.navigation.location || state.location;
    let revalidationRequest = createRequest(
      nextLocation,
      abortController.signal
    );
    let matches =
      state.navigation.state !== "idle"
        ? matchRoutes(dataRoutes, state.navigation.location, init.basename)
        : state.matches;

    invariant(matches, "Didn't find any matches after fetcher action");

    let loadId = ++incrementingLoadId;
    fetchReloadIds.set(key, loadId);

    let loadFetcher: FetcherStates["Loading"] = {
      state: "loading",
      data: actionResult.data,
      ...submission,
    };
    state.fetchers.set(key, loadFetcher);

    let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(
      state,
      matches,
      submission,
      nextLocation,
      isRevalidationRequired,
      cancelledDeferredRoutes,
      cancelledFetcherLoads,
      { [match.route.id]: actionResult.data },
      undefined, // No need to send through errors since we short circuit above
      fetchLoadMatches
    );

    // Put all revalidating fetchers into the loading state, except for the
    // current fetcher which we want to keep in it's current loading state which
    // contains it's action submission info + action data
    revalidatingFetchers
      .filter(([staleKey]) => staleKey !== key)
      .forEach(([staleKey]) => {
        let revalidatingFetcher: FetcherStates["Loading"] = {
          state: "loading",
          data: state.fetchers.get(staleKey)?.data,
          formMethod: undefined,
          formAction: undefined,
          formEncType: undefined,
          formData: undefined,
        };
        state.fetchers.set(staleKey, revalidatingFetcher);
        fetchControllers.set(staleKey, abortController);
      });

    updateState({ fetchers: new Map(state.fetchers) });

    let { results, loaderResults, fetcherResults } =
      await callLoadersAndMaybeResolveData(
        state.matches,
        matchesToLoad,
        revalidatingFetchers,
        revalidationRequest
      );

    if (abortController.signal.aborted) {
      return;
    }

    fetchReloadIds.delete(key);
    fetchControllers.delete(key);
    revalidatingFetchers.forEach(([staleKey]) =>
      fetchControllers.delete(staleKey)
    );

    let redirect = findRedirect(results);
    if (redirect) {
      let redirectNavigation = getLoaderRedirect(state, redirect);
      await startRedirectNavigation(redirect, redirectNavigation);
      return;
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      state.matches,
      matchesToLoad,
      loaderResults,
      undefined,
      revalidatingFetchers,
      fetcherResults,
      activeDeferreds
    );

    let doneFetcher: FetcherStates["Idle"] = {
      state: "idle",
      data: actionResult.data,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
    };
    state.fetchers.set(key, doneFetcher);

    let didAbortFetchLoads = abortStaleFetchLoads(loadId);

    // If we are currently in a navigation loading state and this fetcher is
    // more recent than the navigation, we want the newer data so abort the
    // navigation and complete it with the fetcher data
    if (
      state.navigation.state === "loading" &&
      loadId > pendingNavigationLoadId
    ) {
      invariant(pendingAction, "Expected pending action");
      pendingNavigationController?.abort();

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
        loaderData: mergeLoaderData(state.loaderData, loaderData, matches),
        ...(didAbortFetchLoads ? { fetchers: new Map(state.fetchers) } : {}),
      });
      isRevalidationRequired = false;
    }
  }

  // Call the matched loader for fetcher.load(), handling redirects, errors, etc.
  async function handleFetcherLoader(
    key: string,
    routeId: string,
    path: string,
    match: AgnosticDataRouteMatch
  ) {
    // Put this fetcher into it's loading state
    let loadingFetcher: FetcherStates["Loading"] = {
      state: "loading",
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      data: state.fetchers.get(key)?.data || undefined,
    };
    state.fetchers.set(key, loadingFetcher);
    updateState({ fetchers: new Map(state.fetchers) });

    // Call the loader for this fetcher route match
    let abortController = new AbortController();
    let fetchRequest = createRequest(path, abortController.signal);
    fetchControllers.set(key, abortController);
    let result: DataResult = await callLoaderOrAction(
      "loader",
      fetchRequest,
      match
    );

    // Deferred isn't supported or fetcher loads, await everything and treat it
    // as a normal load.  resolveDeferredData will return undefined if this
    // fetcher gets aborted, so we just leave result untouched and short circuit
    // below if that happens
    if (isDeferredResult(result)) {
      result =
        (await resolveDeferredData(result, fetchRequest.signal, true)) ||
        result;
    }

    // We can delete this so long as we weren't aborted by ou our own fetcher
    // re-load which would have put _new_ controller is in fetchControllers
    if (fetchControllers.get(key) === abortController) {
      fetchControllers.delete(key);
    }

    if (fetchRequest.signal.aborted) {
      return;
    }

    // If the loader threw a redirect Response, start a new REPLACE navigation
    if (isRedirectResult(result)) {
      let redirectNavigation = getLoaderRedirect(state, result);
      await startRedirectNavigation(result, redirectNavigation);
      return;
    }

    // Process any non-redirect errors thrown
    if (isErrorResult(result)) {
      let boundaryMatch = findNearestBoundary(state.matches, routeId);
      state.fetchers.delete(key);
      // TODO: In remix, this would reset to IDLE_NAVIGATION if it was a catch -
      // do we need to behave any differently with our non-redirect errors?
      // What if it was a non-redirect Response?
      updateState({
        fetchers: new Map(state.fetchers),
        errors: {
          [boundaryMatch.route.id]: result.error,
        },
      });
      return;
    }

    invariant(!isDeferredResult(result), "Unhandled fetcher deferred data");

    // Put the fetcher back into an idle state
    let doneFetcher: FetcherStates["Idle"] = {
      state: "idle",
      data: result.data,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
    };
    state.fetchers.set(key, doneFetcher);
    updateState({ fetchers: new Map(state.fetchers) });
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
    redirect: RedirectResult,
    navigation: Navigation,
    replace?: boolean
  ) {
    if (redirect.revalidate) {
      isRevalidationRequired = true;
    }
    invariant(
      navigation.location,
      "Expected a location on the redirect navigation"
    );
    // There's no need to abort on redirects, since we don't detect the
    // redirect until the action/loaders have settled
    pendingNavigationController = null;

    let redirectHistoryAction =
      replace === true ? HistoryAction.Replace : HistoryAction.Push;
    await startNavigation(redirectHistoryAction, navigation.location, {
      overrideNavigation: navigation,
    });
  }

  async function callLoadersAndMaybeResolveData(
    currentMatches: AgnosticDataRouteMatch[],
    matchesToLoad: AgnosticDataRouteMatch[],
    fetchersToLoad: RevalidatingFetcher[],
    request: Request
  ) {
    // Call all navigation loaders and revalidating fetcher loaders in parallel,
    // then slice off the results into separate arrays so we can handle them
    // accordingly
    let results = await Promise.all([
      ...matchesToLoad.map((m) => callLoaderOrAction("loader", request, m)),
      ...fetchersToLoad.map(([, href, match]) =>
        callLoaderOrAction("loader", createRequest(href, request.signal), match)
      ),
    ]);
    let loaderResults = results.slice(0, matchesToLoad.length);
    let fetcherResults = results.slice(matchesToLoad.length);

    await Promise.all([
      resolveDeferredResults(
        currentMatches,
        matchesToLoad,
        loaderResults,
        request.signal,
        false,
        state.loaderData
      ),
      resolveDeferredResults(
        currentMatches,
        fetchersToLoad.map(([, , match]) => match),
        fetcherResults,
        request.signal,
        true
      ),
    ]);

    return { results, loaderResults, fetcherResults };
  }

  function interruptActiveLoads() {
    // Every interruption triggers a revalidation
    isRevalidationRequired = true;

    // Cancel pending route-level deferreds and mark cancelled routes for
    // revalidation
    cancelledDeferredRoutes.push(...cancelActiveDeferreds());

    // Abort in-flight fetcher loads
    fetchLoadMatches.forEach((_, key) => {
      if (fetchControllers.has(key)) {
        cancelledFetcherLoads.push(key);
        abortFetcher(key);
      }
    });
  }

  function setFetcherError(key: string, routeId: string, error: any) {
    let boundaryMatch = findNearestBoundary(state.matches, routeId);
    deleteFetcher(key);
    updateState({
      errors: {
        [boundaryMatch.route.id]: error,
      },
      fetchers: new Map(state.fetchers),
    });
  }

  function deleteFetcher(key: string): void {
    if (fetchControllers.has(key)) abortFetcher(key);
    fetchLoadMatches.delete(key);
    fetchReloadIds.delete(key);
    fetchRedirectIds.delete(key);
    state.fetchers.delete(key);
  }

  function abortFetcher(key: string) {
    let controller = fetchControllers.get(key);
    invariant(controller, `Expected fetch controller: ${key}`);
    controller.abort();
    fetchControllers.delete(key);
  }

  function markFetchersDone(keys: string[]) {
    for (let key of keys) {
      let fetcher = getFetcher(key);
      let doneFetcher: FetcherStates["Idle"] = {
        state: "idle",
        data: fetcher.data,
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
      };
      state.fetchers.set(key, doneFetcher);
    }
  }

  function markFetchRedirectsDone(): void {
    let doneKeys = [];
    for (let key of fetchRedirectIds) {
      let fetcher = state.fetchers.get(key);
      invariant(fetcher, `Expected fetcher: ${key}`);
      if (fetcher.state === "loading") {
        fetchRedirectIds.delete(key);
        doneKeys.push(key);
      }
    }
    markFetchersDone(doneKeys);
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

  function cancelActiveDeferreds(
    predicate?: (routeId: string) => boolean
  ): string[] {
    let cancelledRouteIds: string[] = [];
    activeDeferreds.forEach((dfd, routeId) => {
      if (!predicate || predicate(routeId)) {
        // Cancel the deferred - but do not remove from activeDeferreds here -
        // we rely on the subscribers to do that so our tests can assert proper
        // cleanup via _internalActiveDeferreds
        dfd.cancel();
        cancelledRouteIds.push(routeId);
        activeDeferreds.delete(routeId);
      }
    });
    return cancelledRouteIds;
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
    getScrollRestorationKey = getKey || ((location) => location.key);

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

  function saveScrollPosition(
    location: Location,
    matches: AgnosticDataRouteMatch[]
  ): void {
    if (savedScrollPositions && getScrollRestorationKey && getScrollPosition) {
      let userMatches = matches.map((m) =>
        createUseMatchesMatch(m, state.loaderData)
      );
      let key = getScrollRestorationKey(location, userMatches) || location.key;
      savedScrollPositions[key] = getScrollPosition();
    }
  }

  function getSavedScrollPosition(
    location: Location,
    matches: AgnosticDataRouteMatch[]
  ): number | null {
    if (savedScrollPositions && getScrollRestorationKey && getScrollPosition) {
      let userMatches = matches.map((m) =>
        createUseMatchesMatch(m, state.loaderData)
      );
      let key = getScrollRestorationKey(location, userMatches) || location.key;
      let y = savedScrollPositions[key];
      if (typeof y === "number") {
        return y;
      }
    }
    return null;
  }

  router = {
    get basename() {
      return init.basename;
    },
    get state() {
      return state;
    },
    get routes() {
      return dataRoutes;
    },
    initialize,
    subscribe,
    enableScrollRestoration,
    navigate,
    fetch,
    revalidate,
    createHref,
    getFetcher,
    deleteFetcher,
    dispose,
    _internalFetchControllers: fetchControllers,
    _internalActiveDeferreds: activeDeferreds,
  };

  return router;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region createStaticHandler
////////////////////////////////////////////////////////////////////////////////

export function unstable_createStaticHandler(
  routes: AgnosticRouteObject[]
): StaticHandler {
  invariant(
    routes.length > 0,
    "You must provide a non-empty routes array to unstable_createStaticHandler"
  );

  let dataRoutes = convertRoutesToDataRoutes(routes);

  async function query(
    request: Request
  ): Promise<StaticHandlerContext | Response> {
    let { location, result } = await queryImpl(request);
    if (result instanceof Response) {
      return result;
    }
    // When returning StaticHandlerContext, we patch back in the location here
    // since we need it for React Context.  But this helps keep our submit and
    // loadRouteData operating on a Request instead of a Location
    return { location, ...result };
  }

  async function queryRoute(request: Request, routeId: string): Promise<any> {
    let { result } = await queryImpl(request, routeId);
    if (result instanceof Response) {
      return result;
    }

    // Pick off the right state value to return
    let routeData = [result.errors, result.actionData, result.loaderData].find(
      (v) => v
    );
    let value = Object.values(routeData || {})[0];

    if (isRouteErrorResponse(value)) {
      return new Response(value.data, {
        status: value.status,
        statusText: value.statusText,
      });
    }

    return value;
  }

  async function queryImpl(
    request: Request,
    routeId?: string
  ): Promise<{
    location: Location;
    result: Omit<StaticHandlerContext, "location"> | Response;
  }> {
    invariant(
      request.method !== "HEAD",
      "query()/queryRoute() do not support HEAD requests"
    );
    invariant(
      request.signal,
      "query()/queryRoute() requests must contain an AbortController signal"
    );

    let { location, matches, shortCircuitState } = matchRequest(
      request,
      routeId
    );

    try {
      if (shortCircuitState) {
        return { location, result: shortCircuitState };
      }

      if (request.method !== "GET") {
        let result = await submit(
          request,
          matches,
          getTargetMatch(matches, location),
          routeId != null
        );
        return { location, result };
      }

      let result = await loadRouteData(request, matches, routeId != null);
      return {
        location,
        result: {
          ...result,
          actionData: null,
          actionHeaders: {},
        },
      };
    } catch (e) {
      if (e instanceof Response) {
        return { location, result: e };
      }
      throw e;
    }
  }

  async function submit(
    request: Request,
    matches: AgnosticDataRouteMatch[],
    actionMatch: AgnosticDataRouteMatch,
    isRouteRequest: boolean
  ): Promise<Omit<StaticHandlerContext, "location"> | Response> {
    let result: DataResult;
    if (!actionMatch.route.action) {
      let href = createHref(new URL(request.url));
      result = getMethodNotAllowedResult(href);
    } else {
      result = await callLoaderOrAction(
        "action",
        request,
        actionMatch,
        true,
        isRouteRequest
      );

      if (request.signal.aborted) {
        let method = isRouteRequest ? "queryRoute" : "query";
        throw new Error(`${method}() call aborted`);
      }
    }

    if (isRedirectResult(result)) {
      // Uhhhh - this should never happen, we should always throw these from
      // calLoaderOrAction, but the type narrowing here keeps TS happy and we
      // can get back on the "throw all redirect responses" train here should
      // this ever happen :/
      throw new Response(null, {
        status: result.status,
        headers: {
          Location: result.location,
        },
      });
    }

    if (isDeferredResult(result)) {
      throw new Error("defer() is not supported in actions");
    }

    if (isRouteRequest) {
      if (isErrorResult(result)) {
        let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
        return {
          matches: [actionMatch],
          loaderData: {},
          actionData: null,
          errors: {
            [boundaryMatch.route.id]: result.error,
          },
          // Note: statusCode + headers are unused here since queryRoute will
          // return the raw Response or value
          statusCode: 500,
          loaderHeaders: {},
          actionHeaders: {},
        };
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

    if (isErrorResult(result)) {
      // Store off the pending error - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
      let context = await loadRouteData(request, matches, isRouteRequest, {
        [boundaryMatch.route.id]: result.error,
      });

      // action status codes take precedence over loader status codes
      return {
        ...context,
        statusCode: isRouteErrorResponse(result.error)
          ? result.error.status
          : 500,
        actionData: null,
        actionHeaders: {
          ...(result.headers ? { [actionMatch.route.id]: result.headers } : {}),
        },
      };
    }

    let context = await loadRouteData(request, matches, isRouteRequest);

    return {
      ...context,
      // action status codes take precedence over loader status codes
      ...(result.statusCode ? { statusCode: result.statusCode } : {}),
      actionData: {
        [actionMatch.route.id]: result.data,
      },
      actionHeaders: {
        ...(result.headers ? { [actionMatch.route.id]: result.headers } : {}),
      },
    };
  }

  async function loadRouteData(
    request: Request,
    matches: AgnosticDataRouteMatch[],
    isRouteRequest: boolean,
    pendingActionError?: RouteData
  ): Promise<
    | Omit<StaticHandlerContext, "location" | "actionData" | "actionHeaders">
    | Response
  > {
    let matchesToLoad = getLoaderMatchesUntilBoundary(
      matches,
      Object.keys(pendingActionError || {})[0]
    ).filter((m) => m.route.loader);

    // Short circuit if we have no loaders to run
    if (matchesToLoad.length === 0) {
      return {
        matches,
        loaderData: {},
        errors: pendingActionError || null,
        statusCode: 200,
        loaderHeaders: {},
      };
    }

    let results = await Promise.all([
      ...matchesToLoad.map((m) =>
        callLoaderOrAction("loader", request, m, true, isRouteRequest)
      ),
    ]);

    if (request.signal.aborted) {
      let method = isRouteRequest ? "queryRoute" : "query";
      throw new Error(`${method}() call aborted`);
    }

    // Can't do anything with these without the Remix side of things, so just
    // cancel them for now
    results.forEach((result) => {
      if (isDeferredResult(result)) {
        result.deferredData.cancel();
      }
    });

    // Process and commit output from loaders
    let context = processRouteLoaderData(
      matches,
      matchesToLoad,
      results,
      pendingActionError
    );

    return {
      ...context,
      matches,
    };
  }

  function matchRequest(
    req: Request,
    routeId?: string
  ): {
    location: Location;
    matches: AgnosticDataRouteMatch[];
    routeMatch?: AgnosticDataRouteMatch;
    shortCircuitState?: Omit<StaticHandlerContext, "location">;
  } {
    let url = new URL(req.url);
    let location = createLocation("", createPath(url), null, "default");
    let matches = matchRoutes(dataRoutes, location);
    if (matches && routeId) {
      matches = matches.filter((m) => m.route.id === routeId);
    }

    // Short circuit with a 404 if we match nothing
    if (!matches) {
      let {
        matches: notFoundMatches,
        route,
        error,
      } = getNotFoundMatches(dataRoutes);
      return {
        location,
        matches: notFoundMatches,
        shortCircuitState: {
          matches: notFoundMatches,
          loaderData: {},
          actionData: null,
          errors: {
            [route.id]: error,
          },
          statusCode: 404,
          loaderHeaders: {},
          actionHeaders: {},
        },
      };
    }

    return { location, matches };
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
 */
export function getStaticContextFromError(
  routes: AgnosticDataRouteObject[],
  context: StaticHandlerContext,
  error: any
) {
  let newContext: StaticHandlerContext = {
    ...context,
    statusCode: 500,
    errors: {
      [context._deepestRenderedBoundaryId || routes[0].id]: error,
    },
  };
  return newContext;
}

// Normalize navigation options by converting formMethod=GET formData objects to
// URLSearchParams so they behave identically to links with query params
function normalizeNavigateOptions(
  to: To,
  opts?: RouterNavigateOptions
): {
  path: string;
  submission?: Submission;
  error?: ErrorResponse;
} {
  let path = typeof to === "string" ? to : createPath(to);

  // Return location verbatim on non-submission navigations
  if (!opts || (!("formMethod" in opts) && !("formData" in opts))) {
    return { path };
  }

  // Create a Submission on non-GET navigations
  if (opts.formMethod != null && opts.formMethod !== "get") {
    return {
      path,
      submission: {
        formMethod: opts.formMethod,
        formAction: createHref(parsePath(path)),
        formEncType: opts?.formEncType || "application/x-www-form-urlencoded",
        formData: opts.formData,
      },
    };
  }

  // No formData to flatten for GET submission
  if (!opts.formData) {
    return { path };
  }

  // Flatten submission onto URLSearchParams for GET submissions
  let parsedPath = parsePath(path);
  try {
    let searchParams = convertFormDataToSearchParams(opts.formData);
    parsedPath.search = `?${searchParams}`;
  } catch (e) {
    return {
      path,
      error: new ErrorResponse(
        400,
        "Bad Request",
        "Cannot submit binary form data using GET"
      ),
    };
  }

  return { path: createPath(parsedPath) };
}

function getLoaderRedirect(
  state: RouterState,
  redirect: RedirectResult
): Navigation {
  let { formMethod, formAction, formEncType, formData } = state.navigation;
  let navigation: NavigationStates["Loading"] = {
    state: "loading",
    location: createLocation(state.location, redirect.location),
    formMethod: formMethod || undefined,
    formAction: formAction || undefined,
    formEncType: formEncType || undefined,
    formData: formData || undefined,
  };
  return navigation;
}

// Filter out all routes below any caught error as they aren't going to
// render so we don't need to load them
function getLoaderMatchesUntilBoundary(
  matches: AgnosticDataRouteMatch[],
  boundaryId?: string
) {
  let boundaryMatches = matches;
  if (boundaryId) {
    let index = matches.findIndex((m) => m.route.id === boundaryId);
    if (index >= 0) {
      boundaryMatches = matches.slice(0, index);
    }
  }
  return boundaryMatches;
}

function getMatchesToLoad(
  state: RouterState,
  matches: AgnosticDataRouteMatch[],
  submission: Submission | undefined,
  location: Location,
  isRevalidationRequired: boolean,
  cancelledDeferredRoutes: string[],
  cancelledFetcherLoads: string[],
  pendingActionData?: RouteData,
  pendingError?: RouteData,
  fetchLoadMatches?: Map<string, FetchLoadMatch>
): [AgnosticDataRouteMatch[], RevalidatingFetcher[]] {
  let actionResult = pendingError
    ? Object.values(pendingError)[0]
    : pendingActionData
    ? Object.values(pendingActionData)[0]
    : null;

  // Pick navigation matches that are net-new or qualify for revalidation
  let boundaryId = pendingError ? Object.keys(pendingError)[0] : undefined;
  let boundaryMatches = getLoaderMatchesUntilBoundary(matches, boundaryId);
  let navigationMatches = boundaryMatches.filter(
    (match, index) =>
      match.route.loader != null &&
      (isNewLoader(state.loaderData, state.matches[index], match) ||
        // If this route had a pending deferred cancelled it must be revalidated
        cancelledDeferredRoutes.some((id) => id === match.route.id) ||
        shouldRevalidateLoader(
          state.location,
          state.matches[index],
          submission,
          location,
          match,
          isRevalidationRequired,
          actionResult
        ))
  );

  // Pick fetcher.loads that need to be revalidated
  let revalidatingFetchers: RevalidatingFetcher[] = [];
  fetchLoadMatches?.forEach(([href, match], key) => {
    // This fetcher was cancelled from a prior action submission - force reload
    if (cancelledFetcherLoads.includes(key)) {
      revalidatingFetchers.push([key, href, match]);
    } else if (isRevalidationRequired) {
      let shouldRevalidate = shouldRevalidateLoader(
        href,
        match,
        submission,
        href,
        match,
        isRevalidationRequired,
        actionResult
      );
      if (shouldRevalidate) {
        revalidatingFetchers.push([key, href, match]);
      }
    }
  });

  return [navigationMatches, revalidatingFetchers];
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
  // from a prior error or from a cancelled pending deferred
  let isMissingData = currentLoaderData[match.route.id] === undefined;

  // Always load if this is a net-new route or we don't yet have data
  return isNew || isMissingData;
}

function isNewRouteInstance(
  currentMatch: AgnosticDataRouteMatch,
  match: AgnosticDataRouteMatch
) {
  return (
    // param change for this match, /users/123 -> /users/456
    currentMatch.pathname !== match.pathname ||
    // splat param changed, which is not present in match.path
    // e.g. /files/images/avatar.jpg -> files/finances.xls
    (currentMatch.route.path?.endsWith("*") &&
      currentMatch.params["*"] !== match.params["*"])
  );
}

function shouldRevalidateLoader(
  currentLocation: string | Location,
  currentMatch: AgnosticDataRouteMatch,
  submission: Submission | undefined,
  location: string | Location,
  match: AgnosticDataRouteMatch,
  isRevalidationRequired: boolean,
  actionResult: DataResult | undefined
) {
  let currentUrl = createURL(currentLocation);
  let currentParams = currentMatch.params;
  let nextUrl = createURL(location);
  let nextParams = match.params;

  // This is the default implementation as to when we revalidate.  If the route
  // provides it's own implementation, then we give them full control but
  // provide this value so they can leverage it if needed after they check
  // their own specific use cases
  // Note that fetchers always provide the same current/next locations so the
  // URL-based checks here don't apply to fetcher shouldRevalidate calls
  let defaultShouldRevalidate =
    isNewRouteInstance(currentMatch, match) ||
    // Clicked the same link, resubmitted a GET form
    currentUrl.toString() === nextUrl.toString() ||
    // Search params affect all loaders
    currentUrl.search !== nextUrl.search ||
    // Forced revalidation due to submission, useRevalidate, or X-Remix-Revalidate
    isRevalidationRequired;

  if (match.route.shouldRevalidate) {
    let routeChoice = match.route.shouldRevalidate({
      currentUrl,
      currentParams,
      nextUrl,
      nextParams,
      ...submission,
      actionResult,
      defaultShouldRevalidate,
    });
    if (typeof routeChoice === "boolean") {
      return routeChoice;
    }
  }

  return defaultShouldRevalidate;
}

async function callLoaderOrAction(
  type: "loader" | "action",
  request: Request,
  match: AgnosticDataRouteMatch,
  skipRedirects: boolean = false,
  isRouteRequest: boolean = false
): Promise<DataResult> {
  let resultType;
  let result;

  // Setup a promise we can race against so that abort signals short circuit
  let reject: () => void;
  let abortPromise = new Promise((_, r) => (reject = r));
  let onReject = () => reject();
  request.signal.addEventListener("abort", onReject);

  try {
    let handler = match.route[type];
    invariant<Function>(
      handler,
      `Could not find the ${type} to run on the "${match.route.id}" route`
    );

    result = await Promise.race([
      handler({ request, params: match.params }),
      abortPromise,
    ]);
  } catch (e) {
    resultType = ResultType.error;
    result = e;
  } finally {
    request.signal.removeEventListener("abort", onReject);
  }

  if (result instanceof Response) {
    // Process redirects
    let status = result.status;
    let location = result.headers.get("Location");

    // For SSR single-route requests, we want to hand Responses back directly
    // without unwrapping
    if (isRouteRequest) {
      throw result;
    }

    if (status >= 300 && status <= 399 && location != null) {
      // Don't process redirects in the router during SSR document requests.
      // Instead, throw the Response and let the server handle it with an HTTP
      // redirect
      if (skipRedirects) {
        throw result;
      }
      return {
        type: ResultType.redirect,
        status,
        location,
        revalidate: result.headers.get("X-Remix-Revalidate") !== null,
      };
    }

    let data: any;
    if (result.headers.get("Content-Type")?.startsWith("application/json")) {
      data = await result.json();
    } else {
      data = await result.text();
    }

    if (resultType === ResultType.error) {
      return {
        type: resultType,
        error: new ErrorResponse(status, result.statusText, data),
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

  if (resultType === ResultType.error) {
    return { type: resultType, error: result };
  }

  if (result instanceof DeferredData) {
    return { type: ResultType.deferred, deferredData: result };
  }

  return { type: ResultType.data, data: result };
}

function createRequest(
  location: string | Location,
  signal: AbortSignal,
  submission?: Submission
): Request {
  let url = createURL(location).toString();
  let init: RequestInit = { signal };

  if (submission) {
    let { formMethod, formEncType, formData } = submission;
    init.method = formMethod.toUpperCase();
    init.body =
      formEncType === "application/x-www-form-urlencoded"
        ? convertFormDataToSearchParams(formData)
        : formData;
  }

  // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
  return new Request(url, init);
}

function convertFormDataToSearchParams(formData: FormData): URLSearchParams {
  let searchParams = new URLSearchParams();

  for (let [key, value] of formData.entries()) {
    invariant(
      typeof value === "string",
      'File inputs are not supported with encType "application/x-www-form-urlencoded", ' +
        'please use "multipart/form-data" instead.'
    );
    searchParams.append(key, value);
  }

  return searchParams;
}

function processRouteLoaderData(
  matches: AgnosticDataRouteMatch[],
  matchesToLoad: AgnosticDataRouteMatch[],
  results: DataResult[],
  pendingError: RouteData | undefined,
  activeDeferreds?: Map<string, DeferredData>
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

  // Process loader results into state.loaderData/state.errors
  results.forEach((result, index) => {
    let id = matchesToLoad[index].route.id;
    invariant(
      !isRedirectResult(result),
      "Cannot handle redirect results in processLoaderData"
    );
    if (isErrorResult(result)) {
      // Look upwards from the matched route for the closest ancestor
      // error boundary, defaulting to the root match
      let boundaryMatch = findNearestBoundary(matches, id);
      let error = result.error;
      // If we have a pending action error, we report it at the highest-route
      // that throws a loader error, and then clear it out to indicate that
      // it was consumed
      if (pendingError) {
        error = Object.values(pendingError)[0];
        pendingError = undefined;
      }
      errors = Object.assign(errors || {}, {
        [boundaryMatch.route.id]: error,
      });
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
    } else if (isDeferredResult(result)) {
      activeDeferreds?.set(id, result.deferredData);
      loaderData[id] = result.deferredData.data;
      // TODO: Add statusCode/headers once we wire up streaming in Remix
    } else {
      loaderData[id] = result.data;
      // Error status codes always override success status codes, but if all
      // loaders are successful we take the deepest status code.
      if (result.statusCode !== 200 && !foundError) {
        statusCode = result.statusCode;
      }
      if (result.headers) {
        loaderHeaders[id] = result.headers;
      }
    }
  });

  // If we didn't consume the pending action error (i.e., all loaders
  // resolved), then consume it here
  if (pendingError) {
    errors = pendingError;
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
  matchesToLoad: AgnosticDataRouteMatch[],
  results: DataResult[],
  pendingError: RouteData | undefined,
  revalidatingFetchers: RevalidatingFetcher[],
  fetcherResults: DataResult[],
  activeDeferreds: Map<string, DeferredData>
): {
  loaderData: RouterState["loaderData"];
  errors?: RouterState["errors"];
} {
  let { loaderData, errors } = processRouteLoaderData(
    matches,
    matchesToLoad,
    results,
    pendingError,
    activeDeferreds
  );

  // Process results from our revalidating fetchers
  for (let index = 0; index < revalidatingFetchers.length; index++) {
    let [key, , match] = revalidatingFetchers[index];
    invariant(
      fetcherResults !== undefined && fetcherResults[index] !== undefined,
      "Did not find corresponding fetcher result"
    );
    let result = fetcherResults[index];

    // Process fetcher non-redirect errors
    if (isErrorResult(result)) {
      let boundaryMatch = findNearestBoundary(state.matches, match.route.id);
      if (!errors?.[boundaryMatch.route.id]) {
        errors = {
          ...errors,
          [boundaryMatch.route.id]: result.error,
        };
      }
      state.fetchers.delete(key);
    } else if (isRedirectResult(result)) {
      // Should never get here, redirects should get processed above, but we
      // keep this to type narrow to a success result in the else
      throw new Error("Unhandled fetcher revalidation redirect");
    } else if (isDeferredResult(result)) {
      // Should never get here, deferred data should be awaited for fetchers
      // in resolveDeferredResults
      throw new Error("Unhandled fetcher deferred data");
    } else {
      let doneFetcher: FetcherStates["Idle"] = {
        state: "idle",
        data: result.data,
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
      };
      state.fetchers.set(key, doneFetcher);
    }
  }

  return { loaderData, errors };
}

function mergeLoaderData(
  loaderData: RouteData,
  newLoaderData: RouteData,
  matches: AgnosticDataRouteMatch[]
): RouteData {
  let mergedLoaderData = { ...newLoaderData };
  matches.forEach((match) => {
    let id = match.route.id;
    if (newLoaderData[id] === undefined && loaderData[id] !== undefined) {
      mergedLoaderData[id] = loaderData[id];
    }
  });
  return mergedLoaderData;
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

function getNotFoundMatches(routes: AgnosticDataRouteObject[]): {
  matches: AgnosticDataRouteMatch[];
  route: AgnosticDataRouteObject;
  error: ErrorResponse;
} {
  // Prefer a root layout route if present, otherwise shim in a route object
  let route = routes.find(
    (r) => r.index || r.path === "" || r.path === "/"
  ) || {
    id: "__shim-404-route__",
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
    error: new ErrorResponse(404, "Not Found", null),
  };
}

function getMethodNotAllowedResult(path: Location | string): ErrorResult {
  let href = typeof path === "string" ? path : createHref(path);
  console.warn(
    "You're trying to submit to a route that does not have an action.  To " +
      "fix this, please add an `action` function to the route for " +
      `[${href}]`
  );
  return {
    type: ResultType.error,
    error: new ErrorResponse(
      405,
      "Method Not Allowed",
      `No action found for [${href}]`
    ),
  };
}

// Find any returned redirect errors, starting from the lowest match
function findRedirect(results: DataResult[]): RedirectResult | undefined {
  for (let i = results.length - 1; i >= 0; i--) {
    let result = results[i];
    if (isRedirectResult(result)) {
      return result;
    }
  }
}

// Create an href to represent a "server" URL without the hash
function createHref(location: Partial<Path> | Location | URL) {
  return (location.pathname || "") + (location.search || "");
}

function isHashChangeOnly(a: Location, b: Location): boolean {
  return (
    a.pathname === b.pathname && a.search === b.search && a.hash !== b.hash
  );
}

function isDeferredResult(result: DataResult): result is DeferredResult {
  return result.type === ResultType.deferred;
}

function isErrorResult(result: DataResult): result is ErrorResult {
  return result.type === ResultType.error;
}

function isRedirectResult(result?: DataResult): result is RedirectResult {
  return result?.type === ResultType.redirect;
}

async function resolveDeferredResults(
  currentMatches: AgnosticDataRouteMatch[],
  matchesToLoad: AgnosticDataRouteMatch[],
  results: DataResult[],
  signal: AbortSignal,
  isFetcher: boolean,
  currentLoaderData?: RouteData
) {
  for (let index = 0; index < results.length; index++) {
    let result = results[index];
    let match = matchesToLoad[index];
    let currentMatch = currentMatches.find(
      (m) => m.route.id === match.route.id
    );
    let isRevalidatingLoader =
      currentMatch != null &&
      !isNewRouteInstance(currentMatch, match) &&
      currentLoaderData?.[match.route.id] !== undefined;

    if (isDeferredResult(result) && (isFetcher || isRevalidatingLoader)) {
      // Note: we do not have to touch activeDeferreds here since we race them
      // against the signal in resolveDeferredData and they'll get aborted
      // there if needed
      await resolveDeferredData(result, signal, isFetcher).then((result) => {
        if (result) {
          results[index] = result || results[index];
        }
      });
    }
  }
}

async function resolveDeferredData(
  result: DeferredResult,
  signal: AbortSignal,
  unwrap = false
): Promise<SuccessResult | ErrorResult | undefined> {
  let aborted = await result.deferredData.resolveData(signal);
  if (aborted) {
    return;
  }

  if (unwrap) {
    try {
      return {
        type: ResultType.data,
        data: result.deferredData.unwrappedData,
      };
    } catch (e) {
      // Handle any TrackedPromise._error values encountered while unwrapping
      return {
        type: ResultType.error,
        error: e,
      };
    }
  }

  return {
    type: ResultType.data,
    data: result.deferredData.data,
  };
}

function hasNakedIndexQuery(search: string): boolean {
  return new URLSearchParams(search).getAll("index").some((v) => v === "");
}

// Note: This should match the format exported by useMatches, so if you change
// this please also change that :)  Eventually we'll DRY this up
function createUseMatchesMatch(
  match: AgnosticDataRouteMatch,
  loaderData: RouteData
): UseMatchesMatch {
  let { route, pathname, params } = match;
  return {
    id: route.id,
    pathname,
    params,
    data: loaderData[route.id] as unknown,
    handle: route.handle as unknown,
  };
}

function getTargetMatch(
  matches: AgnosticDataRouteMatch[],
  location: Location | string
) {
  let search =
    typeof location === "string" ? parsePath(location).search : location.search;
  if (
    matches[matches.length - 1].route.index &&
    !hasNakedIndexQuery(search || "")
  ) {
    return matches.slice(-2)[0];
  }
  return matches.slice(-1)[0];
}

function createURL(location: Location | string): URL {
  let base =
    typeof window !== "undefined" && typeof window.location !== "undefined"
      ? window.location.origin
      : "unknown://unknown";
  let href = typeof location === "string" ? location : createHref(location);
  return new URL(href, base);
}
//#endregion
