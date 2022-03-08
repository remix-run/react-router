import type { History, Location, Path } from "history";
import { Action, createLocation } from "history";

import type { RouteMatch, RouteObject } from "./utils";
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
   * Exceptions caught from loaders for the current matches
   */
  exceptions: RouteData;
}

/**
 * Data that can be passed into hydrate a Remix Router from a SSR
 */
export type HydrationState = Partial<
  Pick<RemixRouterState, "loaderData" | "exceptions">
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
 * Options for a navigate() call
 */
export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

/**
 * Potential states for state.transition
 */
export type TransitionStates = {
  Idle: {
    state: "idle";
    type: "idle";
    submission: undefined;
    location: undefined;
  };
  Loading: {
    state: "loading";
    type: "normalLoad";
    location: Location;
    submission: undefined;
  };
  LoadingRedirect: {
    state: "loading";
    type: "normalRedirect";
    submission: undefined;
    location: Location;
  };
};

export type Transition = TransitionStates[keyof TransitionStates];

export type RemixRouter = ReturnType<typeof createRemixRouter>;

export interface DataSuccess {
  isError: false;
  data: any;
}

export interface DataException {
  isError: true;
  exception: any;
}

export type DataResult = DataSuccess | DataException;

export const IDLE_TRANSITION: TransitionStates["Idle"] = {
  state: "idle",
  submission: undefined,
  location: undefined,
  type: "idle",
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
      // Always preserve any existing loaderData from re-used routes
      loaderData: mergeLoaderData(state, newState),
      action,
      location,
      transition: IDLE_TRANSITION,
    });

    // Update history if this was push/replace - do nothing if this was a pop
    // since it's already been updated
    if (action === Action.Push) {
      init.history.push(location, location.state);
    } else if (action === Action.Replace) {
      init.history.replace(location, location.state);
    }
  }

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
    console.debug(`[remix-router] navigate() - ${action} ${location.pathname}`);

    return await startNavigation(action, location);
  }

  // Start a navigation to the given action/location.  Can optionally provide a
  // overrideTransition which will override the normalLoad in the case of a redirect
  // navigation
  async function startNavigation(
    action: Action,
    location: Location,
    overrideTransition?: Transition
  ): Promise<void> {
    console.debug("[remix-router]   handling link navigation");

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

    // At this point, we're planning to load data, so we can start with fresh
    // empty objects here
    let loaderData: RouteData = {};
    let exceptions: RouteData = {};

    // Short circuit if we have no loaders to run
    const matchesToLoad = matches.filter(
      (match, index) =>
        match.route.loader && shouldRunLoader(state, location, match, index)
    );
    if (matchesToLoad.length === 0) {
      console.debug(
        "[remix-router]   completing navigation - no loaders to run"
      );
      completeNavigation(action, location, {
        matches,
        exceptions,
        loaderData,
      });
      return;
    }

    // Transition to a loading state
    let defaultTransition: TransitionStates["Loading"] = {
      state: "loading",
      type: "normalLoad",
      location,
      submission: undefined,
    };
    updateState({
      transition: overrideTransition || defaultTransition,
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
      let redirectTransition: TransitionStates["LoadingRedirect"] = {
        state: "loading",
        type: "normalRedirect",
        location: redirectLocation,
        submission: undefined,
      };
      await startNavigation(
        Action.Replace,
        redirectLocation,
        redirectTransition
      );
      return;
    }

    // Process loader results into state.loaderData/state.exceptions
    results.forEach((result, index) => {
      let id = matchesToLoad[index].route.id;
      if (isDataException(result)) {
        // Look upwards from the matched route for the closest ancestor
        // exceptionElement, defaulting to the root match
        let boundaryMatch = findNearestBoundary(matches!, id);
        exceptions[boundaryMatch!.route.id] = result.exception;
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

function shouldRunLoader(
  state: RemixRouterState,
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

  // Clicked the same link, resubmitted a GET form
  let isSamePath = createHref(location) === createHref(state.location);

  // Search affects all loaders
  let searchParamsChanged = location.search !== state.location.search;

  // Let routes control only when it's the same path, if the path changed
  if ((isSamePath || searchParamsChanged) && match.route.shouldReload) {
    return match.route.shouldReload?.({
      request: new Request(createHref(location)),
      prevRequest: new Request(createHref(state.location)),
      params: match.params,
    });
  }

  return Boolean(
    isNew ||
      matchPathChanged ||
      isMissingData ||
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

function findRedirect(results: DataResult[]): DataException | null {
  let redirect = [...results]
    .reverse()
    .find(
      (r) =>
        isDataException(r) &&
        r.exception instanceof Response &&
        r.exception.status >= 300 &&
        r.exception.status <= 399 &&
        r.exception.headers.get("location") != null
    );
  return (redirect as DataException) || null;
}

function createHref(location: Location | URL) {
  return location.pathname + location.search;
}

function isDataException(result: DataResult): result is DataException {
  return result.isError;
}
//#endregion
