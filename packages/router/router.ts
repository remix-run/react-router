import { createPath, History, Location, Path, To } from "./history";
import { Action as HistoryAction, createLocation, parsePath } from "./history";

import {
  DataRouteObject,
  FormEncType,
  FormMethod,
  invariant,
  RouteMatch,
  RouteObject,
  Submission,
} from "./utils";
import { ErrorResponse, matchRoutes } from "./utils";

////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////

/**
 * Map of routeId -> data returned from a loader/action/error
 */
export interface RouteData {
  [routeId: string]: any;
}

export interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}

/**
 * A Router instance manages all navigation and data loading/mutations
 */
export interface Router {
  /**
   * Return the current state of the router
   */
  get state(): RouterState;

  /**
   * Initialize the router, including adding history listeners and kicking off
   * initial data fetches.  Returns a function to cleanup listeners and abort
   * any in-progress loads
   */
  initialize(): Router;

  /**
   * Subscribe to router.state updates
   *
   * @param fn function to call with the new state
   */
  subscribe(fn: RouterSubscriber): () => void;

  /**
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
   * Navigate forward/backward in the history stack
   * @param path Delta to move in the history stack
   */
  navigate(path: number): void;

  /**
   * Navigate to the given path
   * @param path Path to navigate to
   * @param opts Navigation options (method, submission, etc.)
   */
  navigate(path: To, opts?: RouterNavigateOptions): void;

  /**
   * Trigger a fetcher load/submission
   *
   * @param key Fetcher key
   * @param href href to fetch
   * @param opts Fetcher options, (method, submission, etc.)
   */
  fetch(key: string, href: string, opts?: RouterNavigateOptions): void;

  /**
   * Trigger a revalidation of all current route loaders and fetcher loads
   */
  revalidate(): void;

  /**
   * Utility function to create an href for the given location
   * @param location
   */
  createHref(location: Location | URL): string;

  /**
   * Get/create a fetcher for the given key
   * @param key
   */
  getFetcher<TData = any>(key?: string): Fetcher<TData>;

  /**
   * Delete the fetcher for a given key
   * @param key
   */
  deleteFetcher(key?: string): void;

  /**
   * Cleanup listeners and abort any in-progress loads
   */
  dispose(): void;

  /**
   * Internal fetch AbortControllers accessed by unit tests
   * @private
   */
  _internalFetchControllers: Map<string, AbortController>;
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
  matches: DataRouteMatch[];

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
   * Indicate whether this navigation should reset the scroll position if we
   * are unable to restore the scroll position
   */
  resetScrollPosition: boolean;

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
  routes: RouteObject[];
  history: History;
  hydrationData?: HydrationState;
}

/**
 * Subscriber function signature for changes to router state
 */
export interface RouterSubscriber {
  (state: RouterState): void;
}

/**
 * Function signature for determining the key to be used in scroll restoration
 * for a given location
 */
export interface GetScrollRestorationKeyFunction {
  (location: Location, matches: DataRouteMatch[]): string | null;
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
  resetScroll?: boolean;
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

enum ResultType {
  data = "data",
  redirect = "redirect",
  error = "error",
}

/**
 * Successful result from a loader or action
 */
export interface SuccessResult {
  type: ResultType.data;
  data: any;
}

/**
 * Redirect result from a loader or action
 */
export interface RedirectResult {
  type: ResultType.redirect;
  status: number;
  location: string;
  revalidate: boolean;
}

/**
 * Unsuccessful result from a loader or action
 */
export interface ErrorResult {
  type: ResultType.error;
  error: any;
}

/**
 * Result from a loader or action - potentially successful or unsuccessful
 */
export type DataResult = SuccessResult | RedirectResult | ErrorResult;

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
   * errorElement to render the error.  To be committed to the state after
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
    "You must provide a non-empty routes array to use Data Routers"
  );

  let dataRoutes = convertRoutesToDataRoutes(init.routes);
  // Cleanup function for history
  let unlistenHistory: (() => void) | null = null;
  // Externally-provided function to call on all state changes
  let subscriber: RouterSubscriber | null = null;
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

  let initialMatches = matchRoutes(dataRoutes, init.history.location);
  let initialErrors: RouteData | null = null;

  if (initialMatches == null) {
    let { matches, route, error } = getNotFoundMatches(dataRoutes);
    initialMatches = matches;
    initialErrors = { [route.id]: error };
  }

  // If we received hydration data without errors - detect if any matched
  // routes with loaders did not get provided loaderData, and if so launch an
  // initial data re-load to fetch everything
  let foundMissingHydrationData =
    init.hydrationData?.errors == null &&
    init.hydrationData?.loaderData != null &&
    initialMatches
      .filter((m) => m.route.loader)
      .some((m) => init.hydrationData?.loaderData?.[m.route.id] === undefined);

  if (foundMissingHydrationData) {
    console.warn(
      `The provided hydration data did not find loaderData for all matched ` +
        `routes with loaders.  Performing a full initial data load`
    );
  }

  let router: Router;
  let state: RouterState = {
    historyAction: init.history.action,
    location: init.history.location,
    // If we do not match a user-provided-route, fall back to the root
    // to allow the errorElement to take over
    matches: initialMatches,
    initialized: init.hydrationData != null && !foundMissingHydrationData,
    navigation: IDLE_NAVIGATION,
    restoreScrollPosition: null,
    resetScrollPosition: true,
    revalidation: "idle",
    loaderData: foundMissingHydrationData
      ? {}
      : init.hydrationData?.loaderData || {},
    actionData: init.hydrationData?.actionData || null,
    errors: init.hydrationData?.errors || initialErrors,
    fetchers: new Map(),
  };

  // -- Stateful internal variables to manage navigations --
  // Current navigation in progress (to be committed in completeNavigation)
  let pendingAction: HistoryAction | null = null;
  // Should the current navigation reset the scroll position if scroll cannot
  // be restored?
  let pendingResetScroll = true;
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
  // AbortControllers for any in-flight fetchers
  let fetchControllers = new Map();
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
  let fetchLoadMatches = new Map<string, [string, DataRouteMatch]>();

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
    subscriber = null;
    pendingNavigationController?.abort();
    for (let [, controller] of fetchControllers) {
      controller.abort();
    }
  }

  // Subscribe to state updates for the router
  function subscribe(fn: RouterSubscriber) {
    if (subscriber) {
      throw new Error("A router only accepts one active subscriber");
    }
    subscriber = fn;
    return () => {
      subscriber = null;
    };
  }

  // Update our state and notify the calling context of the change
  function updateState(newState: Partial<RouterState>): void {
    state = {
      ...state,
      ...newState,
    };
    subscriber?.(state);
  }

  // Complete a navigation returning the state.navigation back to the IDLE_NAVIGATION
  // and setting state.[historyAction/location/matches] to the new route.
  // - HistoryAction and Location are required params
  // - Navigation will always be set to IDLE_NAVIGATION
  // - Can pass any other state in newState
  function completeNavigation(
    historyAction: HistoryAction,
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

    updateState({
      // Clear existing actionData on any completed navigation beyond the original
      // action, unless we're currently finishing the loading/actionReload state.
      // Do this prior to spreading in newState in case we got back to back actions
      ...(isActionReload ? {} : { actionData: null }),
      ...newState,
      historyAction,
      location,
      initialized: true,
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      // Always preserve any existing loaderData from re-used routes
      loaderData: mergeLoaderData(state, newState),
      // Don't restore on submission navigations
      restoreScrollPosition: state.navigation.formData
        ? false
        : getSavedScrollPosition(location, newState.matches || state.matches),
      // Always reset scroll unless explicitly told not to
      resetScrollPosition: pendingResetScroll,
    });

    if (isUninterruptedRevalidation) {
      // If this was an uninterrupted revalidation then do not touch history
    } else if (historyAction === HistoryAction.Pop) {
      // Do nothing for POP - URL has already been updated
    } else if (historyAction === HistoryAction.Push) {
      init.history.push(location, location.state);
    } else if (historyAction === HistoryAction.Replace) {
      init.history.replace(location, location.state);
    }

    // Reset stateful navigation vars
    pendingAction = null;
    pendingResetScroll = true;
    isUninterruptedRevalidation = false;
    isRevalidationRequired = false;
  }

  // Trigger a navigation event, which can either be a numerical POP or a PUSH
  // replace with an optional submission
  async function navigate(
    path: number | To,
    opts?: RouterNavigateOptions
  ): Promise<void> {
    if (typeof path === "number") {
      init.history.go(path);
      return;
    }

    let {
      path: normalizedPath,
      submission,
      error,
    } = normalizeNavigateOptions(
      typeof path === "string" ? parsePath(path) : path,
      opts
    );

    let location = createLocation(state.location, normalizedPath, opts?.state);
    let historyAction = opts?.replace
      ? HistoryAction.Replace
      : HistoryAction.Push;
    let resetScroll =
      opts && "resetScroll" in opts ? opts.resetScroll : undefined;

    return await startNavigation(historyAction, location, {
      submission,
      // Send through the formData serialization error if we have one so we can
      // render at the right errorElement after we match routes
      pendingError: error,
      resetScroll,
    });
  }

  // Revalidate all current loaders.  If a navigation is in progress or if this
  // is interrupted by a navigation, allow this to "succeed" by calling all
  // loaders during the next loader round
  function revalidate() {
    // Toggle isRevalidationRequired so the next data load will call all loaders,
    // and mark us in a revalidating state
    isRevalidationRequired = true;
    updateState({ revalidation: "loading" });

    // If we're currently submitting an action, we don't need to start a new
    // navigation, we'll just let the follow up loader execution call all loaders
    if (
      state.navigation.state === "submitting" &&
      state.navigation.formMethod !== "get"
    ) {
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
      resetScroll?: boolean;
    }
  ): Promise<void> {
    // Abort any in-progress navigations and start a new one
    pendingNavigationController?.abort();
    pendingAction = historyAction;

    // Unset any ongoing uninterrupted revalidations (unless told otherwise),
    // since we want this new navigation to update history normally
    isUninterruptedRevalidation = opts?.startUninterruptedRevalidation === true;

    // Save the current scroll position every time we start a new navigation
    saveScrollPosition(state.location, state.matches);

    // Track whether we should reset scroll on completion
    pendingResetScroll = opts?.resetScroll !== false;

    let loadingNavigation = opts?.overrideNavigation;
    let matches = matchRoutes(dataRoutes, location);

    // Short circuit with a 404 on the root error boundary if we match nothing
    if (!matches) {
      let {
        matches: notFoundMatches,
        route,
        error,
      } = getNotFoundMatches(dataRoutes);
      completeNavigation(historyAction, location, {
        matches: notFoundMatches,
        errors: {
          [route.id]: error,
        },
      });
      return;
    }

    if (opts?.pendingError) {
      let boundaryMatch = findNearestBoundary(matches);
      completeNavigation(historyAction, location, {
        matches,
        errors: {
          [boundaryMatch.route.id]: opts?.pendingError,
        },
      });
      return;
    }

    // Short circuit if it's only a hash change
    if (isHashChangeOnly(state.location, location)) {
      completeNavigation(historyAction, location, {
        matches,
      });
      return;
    }

    // Call action if we received an action submission
    let pendingActionData: RouteData | null = null;
    let pendingActionError: RouteData | null = null;

    if (opts?.submission) {
      let actionOutput = await handleAction(
        historyAction,
        location,
        opts.submission,
        matches
      );

      if (actionOutput.shortCircuited) {
        return;
      }

      pendingActionData = actionOutput.pendingActionData || null;
      pendingActionError = actionOutput.pendingActionError || null;
      let navigation: NavigationStates["Loading"] = {
        state: "loading",
        location,
        ...opts.submission,
      };
      loadingNavigation = navigation;
    }

    // Call loaders
    let { shortCircuited, loaderData, errors } = await handleLoaders(
      historyAction,
      location,
      opts?.submission,
      matches,
      loadingNavigation,
      pendingActionData,
      pendingActionError
    );

    if (shortCircuited) {
      return;
    }

    completeNavigation(historyAction, location, {
      matches,
      loaderData,
      errors,
    });
  }

  // Call the action matched by the leaf route for this navigation and handle
  // redirects/errors
  async function handleAction(
    historyAction: HistoryAction,
    location: Location,
    submission: Submission,
    matches: DataRouteMatch[]
  ): Promise<HandleActionResult> {
    isRevalidationRequired = true;

    if (
      matches[matches.length - 1].route.index &&
      !hasNakedIndexQuery(location.search)
    ) {
      // Note: OK to mutate this in-place since it's a scoped var inside
      // handleAction and mutation will not impact the startNavigation matches
      // variable that we use for revalidation
      matches = matches.slice(0, -1);
    }

    // Put us in a submitting state
    let navigation: NavigationStates["Submitting"] = {
      state: "submitting",
      location,
      ...submission,
    };
    updateState({ navigation });

    // Call our action and get the result
    let result: DataResult;

    let actionMatch = matches.slice(-1)[0];
    if (!actionMatch.route.action) {
      if (__DEV__) {
        console.warn(
          "You're trying to submit to a route that does not have an action.  To " +
            "fix this, please add an `action` function to the route for " +
            `[${createHref(location)}]`
        );
      }
      result = {
        type: ResultType.error,
        error: new ErrorResponse(
          405,
          "Method Not Allowed",
          `No action found for [${createHref(location)}]`
        ),
      };
    } else {
      // Create a controller for this data load
      let actionAbortController = new AbortController();
      pendingNavigationController = actionAbortController;

      result = await callLoaderOrAction(
        actionMatch,
        location,
        actionAbortController.signal,
        submission
      );

      if (actionAbortController.signal.aborted) {
        return { shortCircuited: true };
      }

      // Clean up now that the loaders have completed.  We do do not clean up if
      // we short circuited because pendingNavigationController will have already
      // been assigned to a new controller for the next navigation
      pendingNavigationController = null;
    }

    // If the action threw a redirect Response, start a new REPLACE navigation
    if (isRedirectResult(result)) {
      let redirectNavigation: NavigationStates["Loading"] = {
        state: "loading",
        location: createLocation(state.location, result.location),
        ...submission,
      };
      await startRedirectNavigation(result, redirectNavigation);
      return { shortCircuited: true };
    }

    if (isErrorResult(result)) {
      // Store off the pending error - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
      return {
        pendingActionError: { [boundaryMatch.route.id]: result.error },
      };
    }

    return {
      pendingActionData: { [actionMatch.route.id]: result.data },
    };
  }

  // Call all applicable loaders for the given matches, handling redirects,
  // errors, etc.
  async function handleLoaders(
    historyAction: HistoryAction,
    location: Location,
    submission: Submission | undefined,
    matches: DataRouteMatch[],
    overrideNavigation: Navigation | undefined,
    pendingActionData: RouteData | null,
    pendingActionError: RouteData | null
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
      pendingActionData,
      pendingActionError,
      fetchLoadMatches
    );

    // Short circuit if we have no loaders to run
    if (matchesToLoad.length === 0 && revalidatingFetchers.length === 0) {
      completeNavigation(historyAction, location, {
        matches,
        // Commit pending action error if we're short circuiting
        errors: pendingActionError || null,
        actionData: pendingActionData || null,
      });
      return { shortCircuited: true };
    }

    // If this is an uninterrupted revalidation, remain in our current idle state.
    // Otherwise, switch to our loading state and load data, preserving any
    // new action data or existing action data (in the case of a revalidation
    // interrupting an actionReload)
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

    // Start the data load
    let abortController = new AbortController();
    pendingNavigationController = abortController;
    pendingNavigationLoadId = ++incrementingLoadId;
    revalidatingFetchers.forEach(([key]) =>
      fetchControllers.set(key, abortController)
    );

    // Call all navigation loaders and revalidating fetcher loaders in parallel,
    // then slice off the results into separate arrays so we can handle them
    // accordingly
    let results = await Promise.all([
      ...matchesToLoad.map((m) =>
        callLoaderOrAction(m, location, abortController.signal)
      ),
      ...revalidatingFetchers.map(([, href, match]) =>
        callLoaderOrAction(match, href, abortController.signal)
      ),
    ]);
    let navigationResults = results.slice(0, matchesToLoad.length);
    let fetcherResults = results.slice(matchesToLoad.length);

    if (abortController.signal.aborted) {
      return { shortCircuited: true };
    }

    // Clean up now that the loaders have completed.  We do do not clean up if
    // we short circuited because pendingNavigationController will have already
    // been assigned to a new controller for the next navigation
    pendingNavigationController = null;
    revalidatingFetchers.forEach((key) => fetchControllers.delete(key));

    // If any loaders returned a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect(results);
    if (redirect) {
      let redirectNavigation = getLoaderRedirect(state, redirect);
      await startRedirectNavigation(redirect, redirectNavigation);
      return { shortCircuited: true };
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      matches,
      matchesToLoad,
      navigationResults,
      pendingActionError,
      revalidatingFetchers,
      fetcherResults
    );

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
  function fetch(key: string, href: string, opts?: RouterNavigateOptions) {
    if (typeof AbortController === "undefined") {
      throw new Error(
        "router.fetch() was called during the server render, but it shouldn't be. " +
          "You are likely calling a useFetcher() method in the body of your component. " +
          "Try moving it to a useEffect or a callback."
      );
    }

    let matches = matchRoutes(dataRoutes, href);
    invariant(matches, `No matches found for fetch url: ${href}`);

    if (fetchControllers.has(key)) abortFetcher(key);

    let match =
      matches[matches.length - 1].route.index &&
      !hasNakedIndexQuery(parsePath(href).search || "")
        ? matches.slice(-2)[0]
        : matches.slice(-1)[0];

    let { path, submission } = normalizeNavigateOptions(parsePath(href), opts);

    if (submission) {
      handleFetcherAction(key, href, match, submission);
      return;
    }

    let loadingFetcher: FetcherStates["Loading"] = {
      state: "loading",
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      data: state.fetchers.get(key)?.data || undefined,
    };
    handleFetcherLoader(key, createPath(path), match, loadingFetcher);
  }

  // Call the action for the matched fetcher.submit(), and then handle redirects,
  // errors, and revalidation
  async function handleFetcherAction(
    key: string,
    href: string,
    match: DataRouteMatch,
    submission: Submission
  ) {
    isRevalidationRequired = true;
    fetchLoadMatches.delete(key);

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
    fetchControllers.set(key, abortController);

    let actionResult = await callLoaderOrAction(
      match,
      href,
      abortController.signal,
      submission
    );

    if (abortController.signal.aborted) {
      return;
    }

    if (isRedirectResult(actionResult)) {
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
      let boundaryMatch = findNearestBoundary(state.matches, match.route.id);
      state.fetchers.delete(key);
      updateState({
        fetchers: new Map(state.fetchers),
        errors: {
          [boundaryMatch.route.id]: actionResult.error,
        },
      });
      return;
    }

    // Start the data load for current matches, or the next location if we're
    // in the middle of a navigation
    let nextLocation = state.navigation.location || state.location;
    let matches =
      state.navigation.state !== "idle"
        ? matchRoutes(dataRoutes, state.navigation.location)
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
      { [match.route.id]: actionResult.data },
      null, // No need to send through errors since we short circuit above
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
          data: state.fetchers.get(key)?.data,
          formMethod: undefined,
          formAction: undefined,
          formEncType: undefined,
          formData: undefined,
        };
        state.fetchers.set(staleKey, revalidatingFetcher);
        fetchControllers.set(staleKey, abortController);
      });

    updateState({ fetchers: new Map(state.fetchers) });

    // Call all navigation loaders and revalidating fetcher loaders in parallel,
    // then slice off the results into separate arrays so we can handle them
    // accordingly
    let results = await Promise.all([
      ...matchesToLoad.map((m) =>
        callLoaderOrAction(m, nextLocation, abortController.signal)
      ),
      ...revalidatingFetchers.map(([, href, match]) =>
        callLoaderOrAction(match, href, abortController.signal)
      ),
    ]);
    let loaderResults = results.slice(0, matchesToLoad.length);
    let fetcherResults = results.slice(matchesToLoad.length);

    if (abortController.signal.aborted) {
      return;
    }

    fetchReloadIds.delete(key);
    fetchControllers.delete(key);
    revalidatingFetchers.forEach((staleKey) =>
      fetchControllers.delete(staleKey)
    );

    let loaderRedirect = findRedirect(loaderResults);
    if (loaderRedirect) {
      let redirectNavigation = getLoaderRedirect(state, loaderRedirect);
      await startRedirectNavigation(loaderRedirect, redirectNavigation);
      return;
    }

    // Process and commit output from loaders
    let { loaderData, errors } = processLoaderData(
      state,
      state.matches,
      matchesToLoad,
      loaderResults,
      null,
      revalidatingFetchers,
      fetcherResults
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

      completeNavigation(pendingAction, state.navigation.location, {
        matches,
        loaderData,
        errors,
        fetchers: new Map(state.fetchers),
      });
    } else {
      // otherwise just update with the fetcher data
      updateState({
        errors,
        loaderData,
        ...(didAbortFetchLoads ? { fetchers: new Map(state.fetchers) } : {}),
      });
      isRevalidationRequired = false;
    }
  }

  // Call the matched loader for fetcher.load(), handling redirects, errors, etc.
  async function handleFetcherLoader(
    key: string,
    href: string,
    match: DataRouteMatch,
    loadingFetcher: Fetcher
  ) {
    // Put this fetcher into it's loading state
    state.fetchers.set(key, loadingFetcher);
    updateState({ fetchers: new Map(state.fetchers) });

    // Store off the match so we can call it's shouldRevalidate on subsequent
    // revalidations
    fetchLoadMatches.set(key, [href, match]);

    // Call the loader for this fetcher route match
    let abortController = new AbortController();
    fetchControllers.set(key, abortController);
    let result: DataResult = await callLoaderOrAction(
      match,
      href,
      abortController.signal
    );

    if (abortController.signal.aborted) return;
    fetchControllers.delete(key);

    // If the loader threw a redirect Response, start a new REPLACE navigation
    if (isRedirectResult(result)) {
      let redirectNavigation = getLoaderRedirect(state, result);
      await startRedirectNavigation(result, redirectNavigation);
      return;
    }

    // Process any non-redirect errors thrown
    if (isErrorResult(result)) {
      let boundaryMatch = findNearestBoundary(state.matches, match.route.id);
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

  // Utility function to handle redirects returned from an action or loader
  async function startRedirectNavigation(
    redirect: RedirectResult,
    navigation: Navigation
  ) {
    if (redirect.revalidate) {
      isRevalidationRequired = true;
    }
    invariant(
      navigation.location,
      "Expected a location on the redirect navigation"
    );
    await startNavigation(HistoryAction.Replace, navigation.location, {
      overrideNavigation: navigation,
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
    matches: DataRouteMatch[]
  ): void {
    if (savedScrollPositions && getScrollRestorationKey && getScrollPosition) {
      let key = getScrollRestorationKey(location, matches) || location.key;
      savedScrollPositions[key] = getScrollPosition();
    }
  }

  function getSavedScrollPosition(
    location: Location,
    matches: DataRouteMatch[]
  ): number | null {
    if (savedScrollPositions && getScrollRestorationKey && getScrollPosition) {
      let key = getScrollRestorationKey(location, matches) || location.key;
      let y = savedScrollPositions[key];
      if (typeof y === "number") {
        return y;
      }
    }
    return null;
  }

  router = {
    get state() {
      return state;
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
  };

  return router;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Helpers
////////////////////////////////////////////////////////////////////////////////

// Walk the route tree generating unique IDs where necessary so we are working
// solely with DataRouteObject's within the Router
function convertRoutesToDataRoutes(
  routes: RouteObject[],
  parentPath: number[] = [],
  allIds: Set<string> = new Set<string>()
): DataRouteObject[] {
  return routes.map((route, index) => {
    let treePath = [...parentPath, index];
    let id = typeof route.id === "string" ? route.id : treePath.join("-");
    invariant(
      !allIds.has(id),
      `Found a route id collision on id "${id}".  Route ` +
        "id's must be globally unique within Data Router usages"
    );
    allIds.add(id);
    let dataRoute: DataRouteObject = {
      ...route,
      id,
      children: route.children
        ? convertRoutesToDataRoutes(route.children, treePath, allIds)
        : undefined,
    };
    return dataRoute;
  });
}

// Normalize navigation options by converting formMethod=GET formData objects to
// URLSearchParams so they behave identically to links with query params
function normalizeNavigateOptions(
  path: Partial<Path>,
  opts?: RouterNavigateOptions
): {
  path: Partial<Path>;
  submission?: Submission;
  error?: ErrorResponse;
} {
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
        formAction: createHref(path),
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
  let searchParams = new URLSearchParams(path.search);
  for (let [name, value] of opts.formData) {
    if (typeof value === "string") {
      searchParams.append(name, value);
    } else {
      return {
        path,
        error: new ErrorResponse(
          400,
          "Bad Request",
          "Cannot submit binary form data using GET"
        ),
      };
    }
  }

  return {
    path: { ...path, search: `?${searchParams}` },
  };
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

function getMatchesToLoad(
  state: RouterState,
  matches: DataRouteMatch[],
  submission: Submission | undefined,
  location: Location,
  isRevalidationRequired: boolean,
  pendingActionData: RouteData | null,
  pendingActionError: RouteData | null,
  revalidatingFetcherMatches: Map<string, [string, DataRouteMatch]>
): [DataRouteMatch[], [string, string, DataRouteMatch][]] {
  // Determine which routes to run loaders for, filter out all routes below
  // any caught action error as they aren't going to render so we don't
  // need to load them
  let deepestRenderableMatchIndex = pendingActionError
    ? matches.findIndex(
        (m) => m.route.id === Object.keys(pendingActionError)[0]
      )
    : matches.length;

  let actionResult = pendingActionError
    ? Object.values(pendingActionError)[0]
    : pendingActionData
    ? Object.values(pendingActionData)[0]
    : null;

  // Pick navigation matches that are net-new or qualify for revalidation
  let navigationMatches = matches.filter((match, index) => {
    if (!match.route.loader || index >= deepestRenderableMatchIndex) {
      return false;
    }
    return (
      isNewLoader(state.loaderData, state.matches[index], match) ||
      shouldRevalidateLoader(
        state.location,
        state.matches[index],
        submission,
        location,
        match,
        isRevalidationRequired,
        actionResult
      )
    );
  });

  // If revalidation is required, pick fetchers that qualify
  let revalidatingFetchers: [string, string, DataRouteMatch][] = [];
  if (isRevalidationRequired) {
    for (let entry of revalidatingFetcherMatches.entries()) {
      let [key, [href, match]] = entry;
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
  }

  return [navigationMatches, revalidatingFetchers];
}

function isNewLoader(
  currentLoaderData: RouteData,
  currentMatch: DataRouteMatch,
  match: DataRouteMatch
) {
  let isNew =
    // [a] -> [a, b]
    !currentMatch ||
    // [a, b] -> [a, c]
    match.route.id !== currentMatch.route.id;

  // Handle the case that we don't have data for a re-used route, potentially
  // from a prior error
  let isMissingData = currentLoaderData[match.route.id] === undefined;

  // Always load if this is a net-new route or we don't yet have data
  return isNew || isMissingData;
}

function shouldRevalidateLoader(
  currentLocation: string | Location,
  currentMatch: DataRouteMatch,
  submission: Submission | undefined,
  location: string | Location,
  match: DataRouteMatch,
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
    // param change for this match, /users/123 -> /users/456
    currentMatch.pathname !== match.pathname ||
    // splat param changed, which is not present in match.path
    // e.g. /files/images/avatar.jpg -> files/finances.xls
    (currentMatch.route.path?.endsWith("*") &&
      currentMatch.params["*"] !== match.params["*"]) ||
    // Clicked the same link, resubmitted a GET form
    currentUrl.toString() === nextUrl.toString() ||
    // Search params affect all loaders
    currentUrl.search !== nextUrl.search ||
    // Forced revalidation due to submission, useRevalidate, or X-Remix-Revalidate
    isRevalidationRequired;

  if (match.route.shouldRevalidate) {
    return match.route.shouldRevalidate({
      currentUrl,
      currentParams,
      nextUrl,
      nextParams,
      ...submission,
      actionResult,
      defaultShouldRevalidate,
    });
  }

  return defaultShouldRevalidate;
}

async function callLoaderOrAction(
  match: DataRouteMatch,
  location: string | Location,
  signal: AbortSignal,
  submission?: Submission
): Promise<DataResult> {
  let resultType = ResultType.data;
  let result;

  try {
    let type: "action" | "loader" = submission ? "action" : "loader";
    let handler = match.route[type];
    invariant<Function>(
      handler,
      `Could not find the ${type} to run on the "${match.route.id}" route`
    );

    result = await handler({
      params: match.params,
      request: createRequest(location, submission),
      signal,
    });
  } catch (e) {
    resultType = ResultType.error;
    result = e;
  }

  if (result instanceof Response) {
    // Process redirects
    let status = result.status;
    let location = result.headers.get("Location");
    if (status >= 300 && status <= 399 && location != null) {
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
      };
    }

    return { type: resultType, data };
  }

  if (resultType === ResultType.error) {
    return { type: resultType, error: result };
  }

  return { type: resultType, data: result };
}

function createRequest(
  location: string | Location,
  submission?: Submission
): Request {
  let url = createURL(location).toString();

  if (!submission) {
    return new Request(url);
  }

  let { formMethod, formEncType, formData } = submission;
  let body = formData;

  // If we're submitting application/x-www-form-urlencoded, then body should
  // be of type URLSearchParams
  if (formEncType === "application/x-www-form-urlencoded") {
    body = new URLSearchParams();

    for (let [key, value] of formData.entries()) {
      invariant(
        typeof value === "string",
        'File inputs are not supported with encType "application/x-www-form-urlencoded", ' +
          'please use "multipart/form-data" instead.'
      );
      body.append(key, value);
    }
  }

  return new Request(url, {
    method: formMethod.toUpperCase(),
    headers: {
      "Content-Type": formEncType,
    },
    body,
  });
}

function processLoaderData(
  state: RouterState,
  matches: DataRouteMatch[],
  matchesToLoad: DataRouteMatch[],
  results: DataResult[],
  pendingActionError: RouteData | null,
  revalidatingFetchers: [string, string, DataRouteMatch][],
  fetcherResults: DataResult[]
): {
  loaderData: RouterState["loaderData"];
  errors: RouterState["errors"];
} {
  // Fill in loaderData/errors from our loaders
  let loaderData: RouterState["loaderData"] = {};
  let errors: RouterState["errors"] = null;

  // Process loader results into state.loaderData/state.errors
  results.forEach((result, index) => {
    let id = matchesToLoad[index].route.id;
    invariant(
      !isRedirectResult(result),
      "Cannot handle redirect results in processLoaderData"
    );
    if (isErrorResult(result)) {
      // Look upwards from the matched route for the closest ancestor
      // errorElement, defaulting to the root match
      let boundaryMatch = findNearestBoundary(matches, id);
      let error = result.error;
      // If we have a pending action error, we report it at the highest-route
      // that throws a loader error, and then clear it out to indicate that
      // it was consumed
      if (pendingActionError) {
        error = Object.values(pendingActionError)[0];
        pendingActionError = null;
      }
      errors = Object.assign(errors || {}, {
        [boundaryMatch.route.id]: error,
      });
    } else {
      loaderData[id] = result.data;
    }
  });

  // If we didn't consume the pending action error (i.e., all loaders
  // resolved), then consume it here
  if (pendingActionError) {
    errors = pendingActionError;
  }

  // Process results from our revalidating fetchers
  revalidatingFetchers.forEach(([key, href, match], index) => {
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
      invariant(false, "Unhandled fetcher revalidation redirect");
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
  });

  return { loaderData, errors };
}

function mergeLoaderData(
  state: RouterState,
  newState: Partial<RouterState>
): RouteData {
  // Identify active routes that have current loaderData and didn't receive new
  // loaderData
  let reusedRoutesWithData = (newState.matches || state.matches).filter(
    (match) =>
      state.loaderData[match.route.id] !== undefined &&
      newState.loaderData?.[match.route.id] === undefined
  );
  return {
    ...newState.loaderData,
    ...reusedRoutesWithData.reduce(
      (acc, match) =>
        Object.assign(acc, {
          [match.route.id]: state.loaderData[match.route.id],
        }),
      {}
    ),
  };
}

// Find the nearest error boundary, looking upwards from the leaf route (or the
// route specified by routeId) for the closest ancestor errorElement, defaulting
// to the root match
function findNearestBoundary(
  matches: DataRouteMatch[],
  routeId?: string
): DataRouteMatch {
  let eligibleMatches = routeId
    ? matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1)
    : [...matches];
  return (
    eligibleMatches.reverse().find((m) => m.route.errorElement) || matches[0]
  );
}

function getNotFoundMatches(routes: DataRouteObject[]): {
  matches: DataRouteMatch[];
  route: DataRouteObject;
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

function isErrorResult(result: DataResult): result is ErrorResult {
  return result.type === ResultType.error;
}

function isRedirectResult(result?: DataResult): result is RedirectResult {
  return result?.type === ResultType.redirect;
}

function hasNakedIndexQuery(search: string): boolean {
  return new URLSearchParams(search).getAll("index").some((v) => v === "");
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
