import type { History, Location, Path } from "history";
import { Action, createLocation } from "history";

import {
  ActionFormMethod,
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

/**
 * State maintained internally by the remix router.  During a navigation, all states
 * reflect the the "old" location unless otherwise noted.
 */
export interface RemixRouterState {
  /**
   * The action of the most recent navigation
   */
  action: Action;

  /**
   * The current location reflected by the router
   */
  location: Location;

  /**
   * The current set of route matches
   */
  matches: RouteMatch[];

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
  exceptions: RouteData;
}

/**
 * Data that can be passed into hydrate a Remix Router from a SSR
 */
export type HydrationState = Partial<
  Pick<RemixRouterState, "loaderData" | "actionData" | "exceptions">
>;

/**
 * Initialization options for createRemixRouter
 */
export interface RemixRouterInit {
  routes: RouteObject[];
  history: History;
  hydrationData?: HydrationState;
  onChange: (state: RemixRouterState) => void;
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

export type RemixRouter = ReturnType<typeof createRemixRouter>;

/**
 * Successful result from a loader
 */
export interface DataSuccess {
  isError: false;
  data: any;
}

/**
 * Unsuccessful result from a loader
 */
export interface DataException {
  isError: true;
  exception: any;
}

export type DataResult = DataSuccess | DataException;

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
//#region createRemixRouter
////////////////////////////////////////////////////////////////////////////////

export function createRemixRouter(init: RemixRouterInit) {
  let { routes } = init;

  // If we do not match a user-provided-route, fall back to the root
  // to allow the exceptionElement to take over
  let matches = matchRoutes(routes, init.history.location) || [
    {
      params: {},
      pathname: "",
      pathnameBase: "",
      route: routes[0],
    },
  ];

  let state: RemixRouterState = {
    action: init.history.action,
    location: init.history.location,
    matches,
    transition: IDLE_TRANSITION,
    loaderData: init.hydrationData?.loaderData || {},
    actionData: init.hydrationData?.actionData || null,
    exceptions: init.hydrationData?.exceptions || {},
  };

  // Stateful internal variables to manage navigations
  let pendingLoadController: AbortController | null;

  // If history informs us of a POP navigation, start the transition but do not update
  // state.  We'll update our own state once the transition completes
  init.history.listen(({ action, location }) =>
    startNavigation(action, location)
  );

  // Update our state and notify the calling context of the change
  function updateState(newState: Partial<RemixRouterState>): void {
    if (newState.transition) {
      let t = newState.transition;
      console.debug(`[remix-router]   transition set to ${t.state}/${t.type}`);
    }
    state = {
      ...state,
      ...newState,
    };
    init.onChange(state);
  }

  // Complete a navigation returning the state.transition back to the IDLE_TRANSITION
  // and setting state.[action/location/matches] to the new route.
  // - Action and Location are required params
  // - Transition will always be set to IDLE_TRANSITION
  // - Can pass any other state in newState
  function completeNavigation(
    action: Action,
    location: Location,
    newState: Partial<
      Omit<RemixRouterState, "action" | "location" | "transition">
    >
  ): void {
    updateState({
      ...newState,
      action,
      location,
      transition: IDLE_TRANSITION,
      // Always preserve any existing loaderData from re-used routes
      loaderData: mergeLoaderData(state, newState),
      // Reset actionData on any completed navigation beyond the original action
      ...(state.actionData != null && state.transition.type !== "actionReload"
        ? { actionData: null }
        : {}),
    });

    // Update history if this was push/replace - do nothing if this was a pop
    // since it's already been updated
    if (action === Action.Push) {
      init.history.push(location, location.state);
    } else if (action === Action.Replace) {
      init.history.replace(location, location.state);
    }
  }

  // Pop Navigation
  async function navigate(path: number): Promise<void>;
  // Link/Form navigation
  async function navigate(
    path: string | Path,
    opts?: NavigateOptions
  ): Promise<void>;
  async function navigate(
    path: number | string | Path,
    opts?: NavigateOptions
  ): Promise<void> {
    if (typeof path === "number") {
      console.debug(`[remix-router] navigate() - history.go(${path})`);
      init.history.go(path);
      return;
    }

    let location = createLocation(state.location, path, opts?.state);
    let action = opts?.replace ? Action.Replace : Action.Push;

    if (isSubmissionNavigation(opts)) {
      let formMethod = opts.formMethod || "GET";
      console.debug(
        `[remix-router] navigate() with ${formMethod} submission - ${action} ${location.pathname}`
      );
      return await startNavigation(action, location, {
        submission: {
          formMethod,
          formEncType: opts?.formEncType || "application/x-www-form-urlencoded",
          formData: opts.formData,
        },
      });
    }

    console.debug(`[remix-router] navigate() - ${action} ${location.pathname}`);
    return await startNavigation(action, location);
  }

  // Start a navigation to the given action/location.  Can optionally provide a
  // overrideTransition which will override the normalLoad in the case of a redirect
  // navigation
  async function startNavigation(
    action: Action,
    location: Location,
    opts?: {
      submission?: Submission;
      overrideTransition?: Transition;
    }
  ): Promise<void> {
    console.debug(
      `[remix-router]   startTransition ${action} ${location.pathname}`
    );

    // Abort any in-progress navigations and start a new one
    if (pendingLoadController) {
      console.debug("[remix-router]   aborting in-progress navigation");
      pendingLoadController.abort();
      pendingLoadController = null;
    }

    let matches = matchRoutes(routes, location);

    // If we match nothing, short circuit with a 404 on the root error boundary
    if (!matches) {
      console.debug("[remix-router]   completing navigation - 404");
      completeNavigation(action, location, {
        matches: [
          {
            params: {},
            pathname: "",
            pathnameBase: "",
            route: routes[0],
          },
        ],
        loaderData: {},
        exceptions: {
          [init.routes[0].id]: new Response(null, { status: 404 }),
        },
      });
      return;
    }

    // Short circuit if it's only a hash change
    let isHashChangeOnly =
      location.pathname === state.location.pathname &&
      location.search === state.location.search &&
      location.hash !== state.location.hash;
    if (isHashChangeOnly) {
      console.debug("[remix-router]   completing navigation - hash change");
      completeNavigation(action, location, {
        matches,
      });
      return;
    }

    // ----- Actions -----

    let pendingActionData: RouteData | null = null;
    let pendingActionException: [string, RouteData] | null = null;

    if (opts?.submission && opts?.submission.formMethod !== "GET") {
      // TODO: handle isIndexRequestAction
      let leafMatch = matches.slice(-1)[0];
      invariant(
        leafMatch.route.action,
        "You're trying to submit to a route that does not have an action.  To fix " +
          "this, please add an `action` function to the route"
      );

      let { formMethod, formEncType, formData } = opts.submission;
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
      pendingLoadController = actionAbortController;

      let result = await callAction(
        leafMatch,
        location,
        opts.submission,
        actionAbortController.signal
      );

      if (actionAbortController.signal.aborted) {
        return;
      }

      // Clean up now that the action has completed - there's nothing left to abort
      pendingLoadController = null;

      if (isDataException(result)) {
        // If the action threw a redirect Response, start a new REPLACE navigation
        if (isRedirect(result)) {
          let href = result.exception.headers.get("location");
          let redirectLocation = createLocation(state.location, href);
          let { formMethod, formEncType, formData } = opts.submission;
          let redirectTransition: TransitionStates["SubmissionRedirect"] = {
            state: "loading",
            type: "submissionRedirect",
            location: redirectLocation,
            formMethod,
            formEncType,
            formData,
          };
          startNavigation(Action.Replace, redirectLocation, {
            overrideTransition: redirectTransition,
          });
          return;
        }

        // Store off the pending exception - we use it to determine which loaders
        // to call and will commit it when we complete the navigation
        let boundaryMatch = findNearestBoundary(matches, leafMatch.route.id);
        pendingActionException = [
          leafMatch.route.id,
          {
            [boundaryMatch.route.id]: result.exception,
          },
        ];
      } else {
        pendingActionData = {
          [leafMatch.route.id]: result.data,
        };
      }
    }

    // ----- Loaders -----

    // At this point, we're planning to load data, so we can start with fresh
    // empty objects here
    let loaderData: RouteData = {};
    let exceptions: RouteData = {};

    // Figure out the right transition we want to use for loading
    let loadingTransition =
      opts?.overrideTransition ||
      getLoadingTransition(location, state, opts?.submission);

    // Filter out all routes below the problematic route as they aren't going
    // to render so we don't need to load them.
    let errorIdx = pendingActionException
      ? matches.findIndex((m) => m.route.id === pendingActionException![0])
      : matches.length;

    // Short circuit if we have no loaders to run
    let matchesToLoad = matches.filter(
      (match, index) =>
        match.route.loader &&
        index < errorIdx &&
        shouldRunLoader(state, loadingTransition, location, match, index)
    );
    if (matchesToLoad.length === 0) {
      console.debug(
        "[remix-router]   completing navigation - no loaders to run"
      );
      completeNavigation(action, location, {
        matches,
        loaderData,
        // Commit pending action exception if we're short circuiting
        exceptions: pendingActionException?.[1] || {},
        actionData: pendingActionData || {},
      });
      return;
    }

    // Transition to our loading state
    updateState({
      transition: loadingTransition,
      actionData: pendingActionData || {},
    });

    // Create a controller for this data load
    let abortController = new AbortController();
    pendingLoadController = abortController;

    let results: DataResult[] = await Promise.all(
      matchesToLoad.map((m) => callLoader(m, location, abortController.signal))
    );

    if (abortController.signal.aborted) {
      return;
    }

    // Clean up now that all loaders have completed - there's nothing left to abort
    pendingLoadController = null;

    // If any loaders threw a redirect Response, start a new REPLACE navigation
    let redirect = findRedirect(results);
    if (redirect) {
      let href = (redirect as DataException).exception.headers.get("location");
      let redirectLocation = createLocation(state.location, href);
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
      await startNavigation(Action.Replace, redirectLocation, {
        overrideTransition: redirectTransition,
      });
      return;
    }

    // Process loader results into state.loaderData/state.exceptions
    results.forEach((result, index) => {
      let id = matchesToLoad[index].route.id;
      if (isDataException(result)) {
        // Look upwards from the matched route for the closest ancestor
        // exceptionElement, defaulting to the root match
        let boundaryMatch = findNearestBoundary(matches!, id);
        exceptions[boundaryMatch!.route.id] = pendingActionException
          ? Object.values(pendingActionException[1])[0]
          : result.exception;
      } else {
        loaderData[id] = result.data;
      }
    });

    completeNavigation(action, location, {
      matches,
      loaderData,
      exceptions,
    });
  }

  return {
    get state() {
      return state;
    },
    navigate,
  };
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region createRemixRouter helpers
////////////////////////////////////////////////////////////////////////////////

// Determine the proper loading transition to use for the upcoming loaders execution
function getLoadingTransition(
  location: Location,
  state: RemixRouterState,
  submission?: Submission
): Transition {
  if (submission) {
    let { formMethod, formEncType, formData } = submission;
    if (formMethod === "GET") {
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

function shouldRunLoader(
  state: RemixRouterState,
  loadingTransition: Transition,
  location: Location,
  match: RouteMatch,
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
  let isMissingData = state.loaderData[match.route.id] == null;

  let needsSubmissionRevalidation =
    loadingTransition.type === "actionReload" ||
    loadingTransition.type === "submissionRedirect";

  // Clicked the same link, resubmitted a GET form
  let isSamePath = createHref(location) === createHref(state.location);

  // Search affects all loaders
  let searchParamsChanged = location.search !== state.location.search;

  // Let routes control only when it's the same path, if the path changed
  if ((isSamePath || searchParamsChanged) && match.route.shouldReload) {
    let { formMethod, formEncType, formData } = state.transition;
    return match.route.shouldReload?.({
      request: new Request(createHref(location)),
      prevRequest: new Request(createHref(state.location)),
      params: match.params,
      ...(formData
        ? {
            formMethod,
            formEncType,
            formData,
          }
        : {}),
    });
  }

  return Boolean(
    isNew ||
      matchPathChanged ||
      isMissingData ||
      needsSubmissionRevalidation ||
      isSamePath ||
      searchParamsChanged
  );
}

async function callLoader(
  match: RouteMatch,
  location: Location,
  signal: AbortSignal
): Promise<DataResult> {
  try {
    let data = await match.route.loader?.({
      params: match.params,
      request: new Request(location.pathname + location.search),
      signal,
    });
    return { isError: false, data };
  } catch (exception) {
    return { isError: true, exception };
  }
}

async function callAction(
  match: RouteMatch,
  location: Location,
  submission: Submission,
  signal: AbortSignal
): Promise<DataResult> {
  try {
    let data = await match.route.action?.({
      params: match.params,
      request: new Request(location.pathname + location.search),
      ...submission,
      signal,
    });
    return { isError: false, data };
  } catch (exception) {
    return { isError: true, exception };
  }
}

function mergeLoaderData(
  state: RemixRouterState,
  newState: Partial<RemixRouterState>
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

function findNearestBoundary(
  matches: RouteMatch[],
  routeId: string
): RouteMatch {
  // Look upwards from the matched route for the closest ancestor
  // exceptionElement, defaulting to the root match
  return (
    matches
      .slice(0, matches!.findIndex((m) => m.route.id === routeId) + 1)
      .reverse()
      .find((m) => m.route.exceptionElement) || matches![0]
  );
}

function isRedirect(result: DataException): boolean {
  return (
    result.exception instanceof Response &&
    result.exception.status >= 300 &&
    result.exception.status <= 399 &&
    result.exception.headers.get("location") != null
  );
}

function findRedirect(results: DataResult[]): DataException | null {
  let redirect = [...results]
    .reverse()
    .find((r) => isDataException(r) && isRedirect(r));
  return (redirect as DataException) || null;
}

function createHref(location: Location | URL) {
  return location.pathname + location.search;
}

function isDataException(result: DataResult): result is DataException {
  return result.isError;
}

function isSubmissionNavigation(
  opts?: NavigateOptions
): opts is SubmissionNavigateOptions {
  return opts != null && "formData" in opts;
}
//#endregion
