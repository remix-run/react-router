import type { History, Location, To } from "./history";
import { Action as HistoryAction, createLocation } from "./history";

import {
  ActionFormMethod,
  ActionSubmission,
  DataRouteObject,
  FormEncType,
  FormMethod,
  invariant,
  LoaderFormMethod,
  RouteMatch,
  RouteObject,
  Submission,
} from "./utils";
import { matchRoutes } from "./utils";

////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////

/**
 * Map of routeId -> data returned from a loader/action/exception
 */
export interface RouteData {
  [routeId: string]: any;
}

export interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}

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
   * Tracks the state of the current transition
   */
  transition: Transition;

  /**
   * Data from the loaders for the current matches
   */
  loaderData: RouteData;

  /**
   * Data from the action for the current matches
   */
  actionData: RouteData | null;

  /**
   * Exceptions caught from loaders for the current matches
   */
  exceptions: RouteData | null;
}

/**
 * Data that can be passed into hydrate a Router from SSR
 */
export type HydrationState = Partial<
  Pick<RouterState, "loaderData" | "actionData" | "exceptions">
>;

/**
 * Initialization options for createRouter
 */
export interface RouterInit {
  basename?: string;
  routes: RouteObject[];
  history: History;
  hydrationData?: HydrationState;
}

export interface RouterSubscriber {
  (state: RouterState): void;
}

/**
 * Options for a navigate() call for a Link navigation
 */
type LinkNavigateOptions = {
  replace?: boolean;
  state?: any;
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
export type NavigateOptions = LinkNavigateOptions | SubmissionNavigateOptions;

/**
 * Potential states for state.transition
 */
export type TransitionStates = {
  Idle: {
    state: "idle";
    type: "idle";
    location: undefined;
    formMethod: undefined;
    formEncType: undefined;
    formData: undefined;
  };
  Loading: {
    state: "loading";
    type: "normalLoad";
    location: Location;
    formMethod: undefined;
    formEncType: undefined;
    formData: undefined;
  };
  LoadingRedirect: {
    state: "loading";
    type: "normalRedirect";
    location: Location;
    formMethod: undefined;
    formEncType: undefined;
    formData: undefined;
  };
  SubmittingLoader: {
    state: "submitting";
    type: "loaderSubmission";
    location: Location;
    formMethod: LoaderFormMethod;
    formEncType: "application/x-www-form-urlencoded";
    formData: FormData;
  };
  SubmissionRedirect: {
    state: "loading";
    type: "submissionRedirect";
    location: Location;
    formMethod: FormMethod;
    formEncType: FormEncType;
    formData: FormData;
  };
  SubmittingAction: {
    state: "submitting";
    type: "actionSubmission";
    location: Location;
    formMethod: ActionFormMethod;
    formEncType: FormEncType;
    formData: FormData;
  };
  LoadingAction: {
    state: "loading";
    type: "actionReload";
    location: Location;
    formMethod: ActionFormMethod;
    formEncType: FormEncType;
    formData: FormData;
  };
};

export type Transition = TransitionStates[keyof TransitionStates];

export type Router = ReturnType<typeof createRouter>;

/**
 * Successful result from a loader or action
 */
export interface DataSuccess {
  isError: false;
  data: any;
}

/**
 * Unsuccessful result from a loader or action
 */
export interface DataException {
  isError: true;
  exception: any;
}

/**
 * Result from a loader or action - potentially successful or unsuccessful
 */
export type DataResult = DataSuccess | DataException;

interface RedirectResult {
  status: number;
  location: string;
  response: Response;
}

interface ShortCircuitable {
  /**
   * startNavigation does not need to complete the navigation because we
   * redirected or got interrupted
   */
  shortCircuited?: boolean;
}

interface HandleActionResult extends ShortCircuitable {
  /**
   * Exception thrown from the current action, keyed by the route containing the
   * exceptionElement to render the exception.  To be committed to the state after
   * loaders have completed
   */
  pendingActionException?: RouteData;
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
   * exceptions thrown from the current set of loaders
   */
  exceptions?: RouterState["exceptions"];
}

export const IDLE_TRANSITION: TransitionStates["Idle"] = {
  state: "idle",
  location: undefined,
  type: "idle",
  formMethod: undefined,
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
export function createRouter(init: RouterInit) {
  invariant(
    init.routes.length > 0,
    "You must provide a non-empty routes array to use Data Routers"
  );

  let dataRoutes = convertRoutesToDataRoutes(init.routes);
  let subscriber: RouterSubscriber | null = null;

  let initialMatches =
    matchRoutes(dataRoutes, init.history.location, init.basename) ||
    getNotFoundMatches(dataRoutes);

  // If we received hydration data without exceptions - detect if any matched
  // routes with loaders did not get provided loaderData, and if so launch an
  // initial data re-load to fetch everything
  let foundMissingHydrationData =
    init.hydrationData?.exceptions == null &&
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

  let state: RouterState = {
    historyAction: init.history.action,
    location: init.history.location,
    // If we do not match a user-provided-route, fall back to the root
    // to allow the exceptionElement to take over
    matches: initialMatches,
    initialized: init.hydrationData != null && !foundMissingHydrationData,
    transition: IDLE_TRANSITION,
    loaderData: foundMissingHydrationData
      ? {}
      : init.hydrationData?.loaderData || {},
    actionData: init.hydrationData?.actionData || null,
    exceptions: init.hydrationData?.exceptions || null,
  };

  // Stateful internal variables to manage navigations
  let pendingNavigationController: AbortController | null;

  // If history informs us of a POP navigation, start the transition but do not update
  // state.  We'll update our own state once the transition completes
  init.history.listen(({ action: historyAction, location }) =>
    startNavigation(historyAction, location)
  );

  // Kick off initial data load if needed.  Use Pop to avoid modifying history
  if (!state.initialized) {
    startNavigation(HistoryAction.Pop, state.location);
  }

  // Update our state and notify the calling context of the change
  function updateState(newState: Partial<RouterState>): void {
    state = {
      ...state,
      ...newState,
    };
    subscriber?.(state);
  }

  // Complete a navigation returning the state.transition back to the IDLE_TRANSITION
  // and setting state.[historyAction/location/matches] to the new route.
  // - HistoryAction and Location are required params
  // - Transition will always be set to IDLE_TRANSITION
  // - Can pass any other state in newState
  function completeNavigation(
    historyAction: HistoryAction,
    location: Location,
    newState: Partial<Omit<RouterState, "action" | "location" | "transition">>
  ): void {
    updateState({
      // Clear existing actionData on any completed navigation beyond the original
      // action.  Do this prior to spearing in newState in case we've gotten back
      // to back actions
      ...(state.actionData != null && state.transition.type !== "actionReload"
        ? { actionData: null }
        : {}),
      ...newState,
      historyAction,
      location,
      initialized: true,
      transition: IDLE_TRANSITION,
      // Always preserve any existing loaderData from re-used routes
      loaderData: mergeLoaderData(state, newState),
    });

    if (historyAction === HistoryAction.Push) {
      init.history.push(location, location.state);
    } else if (historyAction === HistoryAction.Replace) {
      init.history.replace(location, location.state);
    } else {
      // Do nothing for POP - URL has already been updated
    }
  }

  // Pop Navigation
  async function navigate(path: number): Promise<void>;
  // Link/Form navigation
  async function navigate(path: To, opts?: NavigateOptions): Promise<void>;
  async function navigate(
    path: number | To,
    opts?: NavigateOptions
  ): Promise<void> {
    if (typeof path === "number") {
      init.history.go(path);
      return;
    }

    let location = createLocation(state.location, path, opts?.state);
    let historyAction = opts?.replace
      ? HistoryAction.Replace
      : HistoryAction.Push;

    if (isSubmissionNavigation(opts)) {
      let formMethod = opts.formMethod || "get";
      return await startNavigation(historyAction, location, {
        submission: {
          formMethod,
          formEncType: opts?.formEncType || "application/x-www-form-urlencoded",
          formData: opts.formData,
        },
      });
    }

    return await startNavigation(historyAction, location);
  }

  // Start a navigation to the given action/location.  Can optionally provide a
  // overrideTransition which will override the normalLoad in the case of a redirect
  // navigation
  async function startNavigation(
    historyAction: HistoryAction,
    location: Location,
    opts?: {
      submission?: Submission;
      overrideTransition?: Transition;
    }
  ): Promise<void> {
    // Abort any in-progress navigations and start a new one
    if (pendingNavigationController) {
      pendingNavigationController.abort();
    }

    let matches = matchRoutes(dataRoutes, location, init.basename);

    // Short circuit with a 404 on the root error boundary if we match nothing
    if (!matches) {
      completeNavigation(historyAction, location, {
        matches: getNotFoundMatches(dataRoutes),
        exceptions: {
          [dataRoutes[0].id]: new Response(null, { status: 404 }),
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
    let pendingActionException: RouteData | null = null;

    if (opts?.submission && isActionSubmission(opts.submission)) {
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
      pendingActionException = actionOutput.pendingActionException || null;
    }

    // Call loaders
    let { shortCircuited, loaderData, exceptions } = await handleLoaders(
      historyAction,
      location,
      opts?.submission,
      matches,
      opts?.overrideTransition,
      pendingActionData,
      pendingActionException
    );

    if (shortCircuited) {
      return;
    }

    completeNavigation(historyAction, location, {
      matches,
      loaderData,
      exceptions,
    });
  }

  async function handleAction(
    historyAction: HistoryAction,
    location: Location,
    submission: ActionSubmission,
    matches: DataRouteMatch[]
  ): Promise<HandleActionResult> {
    let hasNakedIndexQuery = new URLSearchParams(location.search)
      .getAll("index")
      .some((v) => v === "");
    if (matches[matches.length - 1].route.index && !hasNakedIndexQuery) {
      // Note: OK to mutate this in-place since it's a scoped var inside
      // handleAction and mutation will not impact the startNavigation matches
      // variable that we use for revalidation
      matches = matches.slice(0, -1);
    }

    let actionMatch = matches.slice(-1)[0];

    if (!actionMatch.route.action) {
      console.warn(
        "You're trying to submit to a route that does not have an action.  To " +
          "fix this, please add an `action` function to the route for " +
          `[${createHref(location)}]`
      );
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
      completeNavigation(historyAction, location, {
        matches,
        exceptions: {
          [boundaryMatch.route.id]: new Response(null, { status: 405 }),
        },
      });
      return { shortCircuited: true };
    }

    let { formMethod, formEncType, formData } = submission;
    let transition: TransitionStates["SubmittingAction"] = {
      state: "submitting",
      type: "actionSubmission",
      location,
      formMethod,
      formEncType,
      formData,
    };
    updateState({ transition });

    // Create a controller for this data load
    let actionAbortController = new AbortController();
    pendingNavigationController = actionAbortController;

    let result = await callLoaderOrAction(
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

    // If the action threw a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect([result]);
    if (redirect) {
      let redirectLocation = createLocation(state.location, redirect.location);
      let { formMethod, formEncType, formData } = submission;
      let redirectTransition: TransitionStates["SubmissionRedirect"] = {
        state: "loading",
        type: "submissionRedirect",
        location: redirectLocation,
        formMethod,
        formEncType,
        formData,
      };
      startNavigation(HistoryAction.Replace, redirectLocation, {
        overrideTransition: redirectTransition,
      });
      return { shortCircuited: true };
    }

    if (isDataException(result)) {
      // Store off the pending exception - we use it to determine which loaders
      // to call and will commit it when we complete the navigation
      let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
      return {
        pendingActionException: { [boundaryMatch.route.id]: result.exception },
      };
    }

    return {
      pendingActionData: { [actionMatch.route.id]: result.data },
    };
  }

  async function handleLoaders(
    historyAction: HistoryAction,
    location: Location,
    submission: Submission | undefined,
    matches: DataRouteMatch[],
    overrideTransition: Transition | undefined,
    pendingActionData: RouteData | null,
    pendingActionException: RouteData | null
  ): Promise<HandleLoadersResult> {
    // Figure out the right transition we want to use for data loading
    let loadingTransition =
      overrideTransition || getLoadingTransition(location, state, submission);

    // Determine which routes to run loaders for, filter out all routes below
    // any caught action exception as they aren't going to render so we don't
    // need to load them
    let deepestRenderableMatchIndex = pendingActionException
      ? matches.findIndex(
          (m) => m.route.id === Object.keys(pendingActionException)[0]
        )
      : matches.length;
    let matchesToLoad = matches.filter(
      (match, index) =>
        match.route.loader &&
        index < deepestRenderableMatchIndex &&
        shouldRunLoader(state, loadingTransition, location, match, index)
    );

    // Short circuit if we have no loaders to run
    if (matchesToLoad.length === 0) {
      completeNavigation(historyAction, location, {
        matches,
        // Commit pending action exception if we're short circuiting
        exceptions: pendingActionException || null,
        actionData: pendingActionData || null,
      });
      return { shortCircuited: true };
    }

    // Transition to our loading state and load data
    updateState({
      transition: loadingTransition,
      actionData: pendingActionData || null,
    });

    let abortController = new AbortController();
    pendingNavigationController = abortController;

    let results: DataResult[] = await Promise.all(
      matchesToLoad.map((m) =>
        callLoaderOrAction(m, location, abortController.signal)
      )
    );

    if (abortController.signal.aborted) {
      return { shortCircuited: true };
    }

    // Clean up now that the loaders have completed.  We do do not clean up if
    // we short circuited because pendingNavigationController will have already
    // been assigned to a new controller for the next navigation
    pendingNavigationController = null;

    // If any loaders threw a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect(results);
    if (redirect) {
      let { redirectLocation, redirectTransition } = getLoaderRedirect(
        state,
        redirect
      );
      await startNavigation(HistoryAction.Replace, redirectLocation, {
        overrideTransition: redirectTransition,
      });
      return { shortCircuited: true };
    }

    // Process and commit output from loaders
    let { loaderData, exceptions } = processLoaderData(
      matches,
      matchesToLoad,
      results,
      pendingActionException
    );

    return { loaderData, exceptions };
  }

  return {
    get state() {
      return state;
    },
    subscribe(fn: RouterSubscriber) {
      if (subscriber) {
        throw new Error("A router only accepts one active subscriber");
      }
      subscriber = fn;
      return () => {
        subscriber = null;
      };
    },
    navigate,
    createHref,
  };
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Helpers
////////////////////////////////////////////////////////////////////////////////

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

// Determine the proper loading transition to use for the upcoming loaders execution
function getLoadingTransition(
  location: Location,
  state: RouterState,
  submission?: Submission
): Transition {
  if (submission) {
    let { formMethod, formEncType, formData } = submission;
    if (formMethod === "get") {
      return {
        state: "submitting",
        type: "loaderSubmission",
        location,
        formMethod,
        formEncType,
        formData,
      } as TransitionStates["SubmittingLoader"];
    }

    // We're currently submitting an action, need to revalidate
    if (state.transition.type === "actionSubmission") {
      return {
        state: "loading",
        type: "actionReload",
        location,
        formMethod,
        formEncType,
        formData,
      } as TransitionStates["LoadingAction"];
    }
  }

  return {
    state: "loading",
    type: "normalLoad",
    location,
    formMethod: undefined,
    formEncType: undefined,
    formData: undefined,
  } as TransitionStates["Loading"];
}

function getLoaderRedirect(
  state: RouterState,
  redirect: RedirectResult
): { redirectLocation: Location; redirectTransition: Transition } {
  let redirectLocation = createLocation(state.location, redirect.location);
  let redirectTransition: Transition;
  if (
    state.transition.type === "loaderSubmission" ||
    state.transition.type === "actionReload"
  ) {
    let { formMethod, formEncType, formData } = state.transition;
    let transition: TransitionStates["SubmissionRedirect"] = {
      state: "loading",
      type: "submissionRedirect",
      location: redirectLocation,
      formMethod,
      formEncType,
      formData,
    };
    redirectTransition = transition;
  } else {
    let transition: TransitionStates["LoadingRedirect"] = {
      state: "loading",
      type: "normalRedirect",
      location: redirectLocation,
      formMethod: undefined,
      formEncType: undefined,
      formData: undefined,
    };
    redirectTransition = transition;
  }
  return { redirectLocation, redirectTransition };
}

function shouldRunLoader(
  state: RouterState,
  loadingTransition: Transition,
  location: Location,
  match: DataRouteMatch,
  index: number
): boolean {
  let currentMatches = state.matches;

  let isNew =
    // [a] -> [a, b]
    !currentMatches[index] ||
    // [a, b] -> [a, c]
    match.route.id !== currentMatches[index].route.id;

  let matchPathChanged =
    !isNew &&
    // param change, /users/123 -> /users/456
    (currentMatches[index].pathname !== match.pathname ||
      // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      (currentMatches[index].route.path?.endsWith("*") &&
        currentMatches[index].params["*"] !== match.params["*"]));

  // Handle the case that we don't have data for a re-used route, potentially
  // from a prior exception
  let isMissingData = state.loaderData[match.route.id] === undefined;

  if (isNew || matchPathChanged || isMissingData) {
    return true;
  }

  let isReload =
    loadingTransition.type === "actionReload" ||
    loadingTransition.type === "submissionRedirect" ||
    // Clicked the same link, resubmitted a GET form
    createHref(location) === createHref(state.location) ||
    // Search affects all loaders
    location.search !== state.location.search;

  // Let routes control only when it's a data reload
  if (isReload && match.route.shouldReload) {
    let { formData } = state.transition;
    return match.route.shouldReload?.({
      url: createHref(location),
      ...(formData ? { formData } : {}),
    });
  }

  return isReload;
}

async function callLoaderOrAction(
  match: DataRouteMatch,
  location: Location,
  signal: AbortSignal,
  submission?: Submission
): Promise<DataResult> {
  try {
    let type: "loader" | "action" = submission ? "action" : "loader";
    let handler: Function | undefined = match.route[type];
    invariant<Function>(
      handler,
      `Could not find the ${type} to run on the "${match.route.id}" route`
    );
    let data = await handler({
      params: match.params,
      request: new Request(location.pathname + location.search),
      signal,
      ...(submission || {}),
    });
    return { isError: false, data };
  } catch (exception) {
    return { isError: true, exception };
  }
}

function processLoaderData(
  matches: DataRouteMatch[],
  matchesToLoad: DataRouteMatch[],
  results: DataResult[],
  pendingActionException: RouteData | null
): {
  loaderData: RouterState["loaderData"];
  exceptions: RouterState["exceptions"];
} {
  // Fill in loaderData/exceptions from our loaders
  let loaderData: RouterState["loaderData"] = {};
  let exceptions: RouterState["exceptions"] = null;

  // Process loader results into state.loaderData/state.exceptions
  results.forEach((result, index) => {
    let id = matchesToLoad[index].route.id;
    if (isDataException(result)) {
      // Look upwards from the matched route for the closest ancestor
      // exceptionElement, defaulting to the root match
      let boundaryMatch = findNearestBoundary(matches, id);
      let exception = result.exception;
      // If we have a pending action exception, we report it at the highest-route
      // that throws a loader exception, and then clear it out to indicate that
      // it was consumed
      if (pendingActionException) {
        exception = Object.values(pendingActionException)[0];
        pendingActionException = null;
      }
      exceptions = Object.assign(exceptions || {}, {
        [boundaryMatch.route.id]: exception,
      });
    } else {
      loaderData[id] = result.data;
    }
  });

  // If we didn't consume the pending action exception (i.e., all loaders
  // resolved), then consume it here
  if (pendingActionException) {
    exceptions = pendingActionException;
  }

  return { loaderData, exceptions };
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

// Find the nearest exception boundary, looking upwards from the matched route
// for the closest ancestor exceptionElement, defaulting to the root match
function findNearestBoundary(
  matches: DataRouteMatch[],
  routeId: string
): DataRouteMatch {
  return (
    matches
      .slice(0, matches.findIndex((m) => m.route.id === routeId) + 1)
      .reverse()
      .find((m) => m.route.exceptionElement) || matches[0]
  );
}

function getNotFoundMatches(routes: DataRouteObject[]): DataRouteMatch[] {
  return [
    {
      params: {},
      pathname: "",
      pathnameBase: "",
      route: routes[0],
    },
  ];
}

// Find any returned redirect exceptions, starting from the lowest match
function findRedirect(results: DataResult[]): RedirectResult | undefined {
  for (let i = results.length - 1; i >= 0; i--) {
    let result = results[i];
    let maybeRedirect = result.isError ? result.exception : result.data;
    if (maybeRedirect && maybeRedirect instanceof Response) {
      let status = maybeRedirect.status;
      let location = maybeRedirect.headers.get("Location");
      if (status >= 300 && status <= 399 && location != null) {
        return {
          status,
          location,
          response: maybeRedirect,
        };
      }
    }
  }
}

// Create an href to represent a "server" URL without the hash
function createHref(location: Location | URL) {
  return location.pathname + location.search;
}

function isHashChangeOnly(a: Location, b: Location): boolean {
  return (
    a.pathname === b.pathname && a.search === b.search && a.hash !== b.hash
  );
}

function isDataException(result: DataResult): result is DataException {
  return result.isError;
}

function isSubmissionNavigation(
  opts?: NavigateOptions
): opts is SubmissionNavigateOptions {
  return opts != null && "formData" in opts && opts.formData != null;
}

function isActionSubmission(
  submission: Submission
): submission is ActionSubmission {
  return submission && submission.formMethod !== "get";
}
//#endregion
