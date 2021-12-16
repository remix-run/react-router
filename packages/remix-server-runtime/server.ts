import type { AppLoadContext } from "./data";
import { callRouteAction, callRouteLoader, extractData } from "./data";
import type { AppState } from "./errors";
import type { HandleDataRequestFunction, ServerBuild } from "./build";
import type { EntryContext } from "./entry";
import { createEntryMatches, createEntryRouteModules } from "./entry";
import { serializeError } from "./errors";
import { getDocumentHeaders } from "./headers";
import type { ServerPlatform } from "./platform";
import type { RouteMatch } from "./routeMatching";
import { matchServerRoutes } from "./routeMatching";
import { ServerMode, isServerMode } from "./mode";
import type { ServerRoute } from "./routes";
import { createRoutes } from "./routes";
import { json, isRedirectResponse, isCatchResponse } from "./responses";
import { createServerHandoffString } from "./serverHandoff";

/**
 * The main request handler for a Remix server. This handler runs in the context
 * of a cloud provider's server (e.g. Express on Firebase) or locally via their
 * dev tools.
 */
export interface RequestHandler {
  (request: Request, loadContext?: AppLoadContext): Promise<Response>;
}

/**
 * Creates a function that serves HTTP requests.
 */
export function createRequestHandler(
  build: ServerBuild,
  platform: ServerPlatform,
  mode?: string
): RequestHandler {
  let routes = createRoutes(build.routes);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;

  return async function requestHandler(request, loadContext) {
    let url = new URL(request.url);
    let matches = matchServerRoutes(routes, url.pathname);
    let requestType = getRequestType(url, matches);

    let response: Response;
    switch (requestType) {
      case "data":
        response = await handleDataRequest({
          request,
          loadContext,
          matches: matches!,
          handleDataRequest: build.entry.module.handleDataRequest,
          serverMode
        });
        break;
      case "document":
        response = await renderDocumentRequest({
          build,
          loadContext,
          matches,
          request,
          routes,
          serverMode
        });
        break;
      case "resource":
        response = await handleResourceRequest({
          request,
          loadContext,
          matches: matches!,
          serverMode
        });
        break;
    }

    if (request.method.toLowerCase() === "head") {
      return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      });
    }

    return response;
  };
}
async function handleDataRequest({
  handleDataRequest,
  loadContext,
  matches,
  request,
  serverMode
}: {
  handleDataRequest?: HandleDataRequestFunction;
  loadContext: unknown;
  matches: RouteMatch<ServerRoute>[];
  request: Request;
  serverMode: ServerMode;
}): Promise<Response> {
  if (!isValidRequestMethod(request)) {
    return errorBoundaryError(
      new Error(`Invalid request method "${request.method}"`),
      405
    );
  }

  let url = new URL(request.url);

  if (!matches) {
    return errorBoundaryError(
      new Error(`No route matches URL "${url.pathname}"`),
      404
    );
  }

  let response: Response;
  let match: RouteMatch<ServerRoute>;
  try {
    if (isActionRequest(request)) {
      match = getActionRequestMatch(url, matches);

      response = await callRouteAction({
        loadContext,
        match,
        request: request
      });
    } else {
      let routeId = url.searchParams.get("_data");
      if (!routeId) {
        return errorBoundaryError(new Error(`Missing route id in ?_data`), 403);
      }

      let tempMatch = matches.find(match => match.route.id === routeId);
      if (!tempMatch) {
        return errorBoundaryError(
          new Error(`Route "${routeId}" does not match URL "${url.pathname}"`),
          403
        );
      }
      match = tempMatch;

      response = await callRouteLoader({ loadContext, match, request });
    }

    if (isRedirectResponse(response)) {
      // We don't have any way to prevent a fetch request from following
      // redirects. So we use the `X-Remix-Redirect` header to indicate the
      // next URL, and then "follow" the redirect manually on the client.
      let headers = new Headers(response.headers);
      headers.set("X-Remix-Redirect", headers.get("Location")!);
      headers.delete("Location");

      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (handleDataRequest) {
      response = await handleDataRequest(response.clone(), {
        context: loadContext,
        params: match.params,
        request: request.clone()
      });
    }

    return response;
  } catch (error: unknown) {
    if (serverMode !== ServerMode.Test) {
      console.error(error);
    }

    if (serverMode === ServerMode.Development) {
      return errorBoundaryError(error as Error, 500);
    }

    return errorBoundaryError(new Error("Unexpected Server Error"), 500);
  }
}

async function renderDocumentRequest({
  build,
  loadContext,
  matches,
  request,
  routes,
  serverMode
}: {
  build: ServerBuild;
  loadContext: unknown;
  matches: RouteMatch<ServerRoute>[] | null;
  request: Request;
  routes: ServerRoute[];
  serverMode?: ServerMode;
}): Promise<Response> {
  let url = new URL(request.url);

  let appState: AppState = {
    trackBoundaries: true,
    trackCatchBoundaries: true,
    catchBoundaryRouteId: null,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
    error: undefined,
    catch: undefined
  };

  if (!isValidRequestMethod(request)) {
    matches = null;
    appState.trackCatchBoundaries = false;
    appState.catch = {
      data: null,
      status: 405,
      statusText: "Method Not Allowed"
    };
  } else if (!matches) {
    appState.trackCatchBoundaries = false;
    appState.catch = {
      data: null,
      status: 404,
      statusText: "Not Found"
    };
  }

  let actionStatus: { status: number; statusText: string } | undefined;
  let actionData: Record<string, unknown> | undefined;
  let actionMatch: RouteMatch<ServerRoute> | undefined;
  let actionResponse: Response | undefined;

  if (matches && isActionRequest(request)) {
    actionMatch = getActionRequestMatch(url, matches);

    try {
      actionResponse = await callRouteAction({
        loadContext,
        match: actionMatch,
        request: request
      });

      if (isRedirectResponse(actionResponse)) {
        return actionResponse;
      }

      actionStatus = {
        status: actionResponse.status,
        statusText: actionResponse.statusText
      };

      if (isCatchResponse(actionResponse)) {
        appState.catchBoundaryRouteId = getDeepestRouteIdWithBoundary(
          matches,
          "CatchBoundary"
        );
        appState.trackCatchBoundaries = false;
        appState.catch = {
          ...actionStatus,
          data: await extractData(actionResponse)
        };
      } else {
        actionData = {
          [actionMatch.route.id]: await extractData(actionResponse)
        };
      }
    } catch (error: any) {
      appState.loaderBoundaryRouteId = getDeepestRouteIdWithBoundary(
        matches,
        "ErrorBoundary"
      );
      appState.trackBoundaries = false;
      appState.error = await serializeError(error);

      if (serverMode !== ServerMode.Test) {
        console.error(
          `There was an error running the action for route ${actionMatch.route.id}`
        );
      }
    }
  }

  let routeModules = createEntryRouteModules(build.routes);

  let matchesToLoad = matches || [];
  if (appState.catch) {
    matchesToLoad = getMatchesUpToDeepestBoundary(
      // get rid of the action, we don't want to call it's loader either
      // because we'll be rendering the catch boundary, if you can get access
      // to the loader data in the catch boundary then how the heck is it
      // supposed to deal with thrown responses?
      matchesToLoad.slice(0, -1),
      "CatchBoundary"
    );
  } else if (appState.error) {
    matchesToLoad = getMatchesUpToDeepestBoundary(
      // get rid of the action, we don't want to call it's loader either
      // because we'll be rendering the error boundary, if you can get access
      // to the loader data in the error boundary then how the heck is it
      // supposed to deal with errors in the loader, too?
      matchesToLoad.slice(0, -1),
      "ErrorBoundary"
    );
  }

  let routeLoaderResults = await Promise.allSettled(
    matchesToLoad.map(match =>
      match.route.module.loader
        ? callRouteLoader({
            loadContext,
            match,
            request
          })
        : Promise.resolve(undefined)
    )
  );

  // Store the state of the action. We will use this to determine later
  // what catch or error boundary should be rendered under cases where
  // actions don't throw but loaders do, actions throw and parent loaders
  // also throw, etc.
  let actionCatch = appState.catch;
  let actionError = appState.error;
  let actionCatchBoundaryRouteId = appState.catchBoundaryRouteId;
  let actionLoaderBoundaryRouteId = appState.loaderBoundaryRouteId;
  // Reset the app error and catch state to propogate the loader states
  // from the results into the app state.
  appState.catch = undefined;
  appState.error = undefined;

  let headerMatches: RouteMatch<ServerRoute>[] = [];
  let routeLoaderResponses: Response[] = [];
  let loaderStatusCodes: number[] = [];
  let routeData: Record<string, unknown> = {};
  for (let index = 0; index < matchesToLoad.length; index++) {
    let match = matchesToLoad[index];
    let result = routeLoaderResults[index];

    let error = result.status === "rejected" ? result.reason : undefined;
    let response = result.status === "fulfilled" ? result.value : undefined;
    let isRedirect = response ? isRedirectResponse(response) : false;
    let isCatch = response ? isCatchResponse(response) : false;

    // If a parent loader has already caught or error'd, bail because
    // we don't need any more child data.
    if (appState.catch || appState.error) {
      break;
    }

    // If there is a response and it's a redirect, do it unless there
    // is an action error or catch state, those action boundary states
    // take precedence over loader sates, this means if a loader redirects
    // after an action catches or errors we won't follow it, and instead
    // render the boundary caused by the action.
    if (!actionCatch && !actionError && response && isRedirect) {
      return response;
    }

    // Track the boundary ID's for the loaders
    if (match.route.module.CatchBoundary) {
      appState.catchBoundaryRouteId = match.route.id;
    }
    if (match.route.module.ErrorBoundary) {
      appState.loaderBoundaryRouteId = match.route.id;
    }

    if (error) {
      loaderStatusCodes.push(500);
      appState.trackBoundaries = false;
      appState.error = await serializeError(error);

      if (serverMode !== ServerMode.Test) {
        console.error(
          `There was an error running the data loader for route ${match.route.id}`
        );
      }
      break;
    } else if (response) {
      headerMatches.push(match);
      routeLoaderResponses.push(response);
      loaderStatusCodes.push(response.status);

      if (isCatch) {
        // If it's a catch response, store it in app state, and bail
        appState.trackCatchBoundaries = false;
        appState.catch = {
          data: await extractData(response),
          status: response.status,
          statusText: response.statusText
        };
        break;
      } else {
        // Extract and store the loader data
        routeData[match.route.id] = await extractData(response);
      }
    }
  }

  // If there was not a loader catch or error state triggered reset the
  // boundaries as they are probably deeper in the tree if the action
  // initially triggered a boundary as that match would not exist in the
  // matches to load.
  if (!appState.catch) {
    appState.catchBoundaryRouteId = actionCatchBoundaryRouteId;
  }
  if (!appState.error) {
    appState.loaderBoundaryRouteId = actionLoaderBoundaryRouteId;
  }
  // If there was an action error or catch, we will reset the state to the
  // initial values, otherwise we will use whatever came out of the loaders.
  appState.catch = actionCatch || appState.catch;
  appState.error = actionError || appState.error;

  let renderableMatches = getRenderableMatches(matches, appState);
  if (!renderableMatches) {
    renderableMatches = [];

    let root = routes[0];
    if (root?.module.CatchBoundary) {
      appState.catchBoundaryRouteId = "root";
      renderableMatches.push({
        params: {},
        pathname: "",
        route: routes[0]
      });
    }
  }

  // Handle responses with a non-200 status code. The first loader with a
  // non-200 status code determines the status code for the whole response.
  let notOkResponse =
    actionStatus && actionStatus.status !== 200
      ? actionStatus.status
      : loaderStatusCodes.find(status => status !== 200);

  let responseStatusCode = appState.error
    ? 500
    : typeof notOkResponse === "number"
    ? notOkResponse
    : appState.catch
    ? appState.catch.status
    : 200;

  let responseHeaders = getDocumentHeaders(
    build,
    renderableMatches,
    routeLoaderResponses,
    actionResponse
  );

  let entryMatches = createEntryMatches(renderableMatches, build.assets.routes);

  let serverHandoff = {
    actionData,
    appState: appState,
    matches: entryMatches,
    routeData
  };

  let entryContext: EntryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules,
    serverHandoffString: createServerHandoffString(serverHandoff)
  };

  let handleDocumentRequest = build.entry.module.default;
  try {
    return await handleDocumentRequest(
      request.clone(),
      responseStatusCode,
      responseHeaders,
      entryContext
    );
  } catch (error: any) {
    responseStatusCode = 500;

    // Go again, this time with the componentDidCatch emulation. As it rendered
    // last time we mutated `componentDidCatch.routeId` for the last rendered
    // route, now we know where to render the error boundary (feels a little
    // hacky but that's how hooks work). This tells the emulator to stop
    // tracking the `routeId` as we render because we already have an error to
    // render.
    appState.trackBoundaries = false;
    appState.error = await serializeError(error);
    entryContext.serverHandoffString = createServerHandoffString(serverHandoff);

    try {
      return await handleDocumentRequest(
        request.clone(),
        responseStatusCode,
        responseHeaders,
        entryContext
      );
    } catch (error: any) {
      if (serverMode !== ServerMode.Test) {
        console.error(error);
      }

      let message = "Unexpected Server Error";

      if (serverMode === ServerMode.Development) {
        message += `\n\n${String(error)}`;
      }

      // Good grief folks, get your act together 😂!
      return new Response(message, {
        status: 500,
        headers: {
          "Content-Type": "text/plain"
        }
      });
    }
  }
}

async function handleResourceRequest({
  loadContext,
  matches,
  request,
  serverMode
}: {
  request: Request;
  loadContext: unknown;
  matches: RouteMatch<ServerRoute>[];
  serverMode: ServerMode;
}): Promise<Response> {
  let match = matches.slice(-1)[0];

  try {
    if (isActionRequest(request)) {
      return await callRouteAction({ match, loadContext, request });
    } else {
      return await callRouteLoader({ match, loadContext, request });
    }
  } catch (error: any) {
    if (serverMode !== ServerMode.Test) {
      console.error(error);
    }

    let message = "Unexpected Server Error";

    if (serverMode === ServerMode.Development) {
      message += `\n\n${String(error)}`;
    }

    // Good grief folks, get your act together 😂!
    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
}

type RequestType = "data" | "document" | "resource";

function getRequestType(
  url: URL,
  matches: RouteMatch<ServerRoute>[] | null
): RequestType {
  if (url.searchParams.has("_data")) {
    return "data";
  }

  if (!matches) {
    return "document";
  }

  let match = matches.slice(-1)[0];
  if (!match.route.module.default) {
    return "resource";
  }

  return "document";
}

function isActionRequest(request: Request): boolean {
  let method = request.method.toLowerCase();
  return (
    method === "post" ||
    method === "put" ||
    method === "patch" ||
    method === "delete"
  );
}

function isHeadRequest(request: Request): boolean {
  return request.method.toLowerCase() === "head";
}

function isValidRequestMethod(request: Request): boolean {
  return (
    request.method.toLowerCase() === "get" ||
    isHeadRequest(request) ||
    isActionRequest(request)
  );
}

async function errorBoundaryError(error: Error, status: number) {
  return json(await serializeError(error), {
    status,
    headers: {
      "X-Remix-Error": "yes"
    }
  });
}

function isIndexRequestUrl(url: URL) {
  let indexRequest = false;

  for (let param of url.searchParams.getAll("index")) {
    if (!param) {
      indexRequest = true;
    }
  }

  return indexRequest;
}

function getActionRequestMatch(url: URL, matches: RouteMatch<ServerRoute>[]) {
  let match = matches.slice(-1)[0];

  if (!isIndexRequestUrl(url) && match.route.id.endsWith("/index")) {
    return matches.slice(-2)[0];
  }

  return match;
}

function getDeepestRouteIdWithBoundary(
  matches: RouteMatch<ServerRoute>[],
  key: "CatchBoundary" | "ErrorBoundary"
) {
  let matched = getMatchesUpToDeepestBoundary(matches, key).slice(-1)[0];
  return matched ? matched.route.id : null;
}

function getMatchesUpToDeepestBoundary(
  matches: RouteMatch<ServerRoute>[],
  key: "CatchBoundary" | "ErrorBoundary"
) {
  let deepestBoundaryIndex: number = -1;

  matches.forEach((match, index) => {
    if (match.route.module[key]) {
      deepestBoundaryIndex = index;
    }
  });

  if (deepestBoundaryIndex === -1) {
    // no route error boundaries, don't need to call any loaders
    return [];
  }

  return matches.slice(0, deepestBoundaryIndex + 1);
}

// This prevents `<Outlet/>` from rendering anything below where the error threw
// TODO: maybe do this in <RemixErrorBoundary + context>
function getRenderableMatches(
  matches: RouteMatch<ServerRoute>[] | null,
  appState: AppState
) {
  if (!matches) {
    return null;
  }

  // no error, no worries
  if (!appState.catch && !appState.error) {
    return matches;
  }

  let lastRenderableIndex: number = -1;

  matches.forEach((match, index) => {
    let id = match.route.id;
    if (
      appState.renderBoundaryRouteId === id ||
      appState.loaderBoundaryRouteId === id ||
      appState.catchBoundaryRouteId === id
    ) {
      lastRenderableIndex = index;
    }
  });

  return matches.slice(0, lastRenderableIndex + 1);
}
