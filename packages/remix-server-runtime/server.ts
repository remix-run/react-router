// TODO: RRR - Change import to @remix-run/router
import type { StaticHandler, StaticHandlerContext } from "./router";
import { isRouteErrorResponse } from "./router";
import { unstable_createStaticHandler } from "./router";
import type { AppLoadContext } from "./data";
import type { AppState } from "./errors";
import type { ServerBuild, HandleDocumentRequestFunction } from "./build";
import type { EntryContext } from "./entry";
import { createEntryMatches, createEntryRouteModules } from "./entry";
import { serializeError } from "./errors";
import { getDocumentHeadersRR } from "./headers";
import invariant from "./invariant";
import { ServerMode, isServerMode } from "./mode";
import type { RouteMatch } from "./routeMatching";
import { matchServerRoutes } from "./routeMatching";
import type { ServerRoute, ServerRouteManifest } from "./routes";
import { createStaticHandlerDataRoutes, createRoutes } from "./routes";
import { json, isRedirectResponse } from "./responses";
import { createServerHandoffString } from "./serverHandoff";

export type RequestHandler = (
  request: Request,
  loadContext?: AppLoadContext
) => Promise<Response>;

export type CreateRequestHandlerFunction = (
  build: ServerBuild,
  mode?: string
) => RequestHandler;

export const createRequestHandler: CreateRequestHandlerFunction = (
  build,
  mode
) => {
  let routes = createRoutes(build.routes);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;

  return async function requestHandler(request, loadContext = {}) {
    let url = new URL(request.url);
    let matches = matchServerRoutes(routes, url.pathname);

    let staticHandler = unstable_createStaticHandler(
      createStaticHandlerDataRoutes(build.routes, loadContext)
    );

    let response: Response;
    if (url.searchParams.has("_data")) {
      let routeId = url.searchParams.get("_data")!;

      response = await handleDataRequestRR(
        serverMode,
        staticHandler!,
        routeId,
        request
      );

      if (build.entry.module.handleDataRequest) {
        let match = matches!.find((match) => match.route.id == routeId)!;
        response = await build.entry.module.handleDataRequest(response, {
          context: loadContext,
          params: match.params,
          request,
        });
      }
    } else if (
      matches &&
      matches[matches.length - 1].route.module.default == null
    ) {
      response = await handleResourceRequestRR(
        serverMode,
        staticHandler!,
        matches.slice(-1)[0].route.id,
        request
      );
    } else {
      response = await handleDocumentRequestRR(
        serverMode,
        build,
        staticHandler!,
        request
      );
    }

    if (request.method === "HEAD") {
      return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  };
};

async function handleDataRequestRR(
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  routeId: string,
  request: Request
) {
  try {
    let response = await staticHandler.queryRoute(request, routeId);

    if (isRedirectResponse(response)) {
      // We don't have any way to prevent a fetch request from following
      // redirects. So we use the `X-Remix-Redirect` header to indicate the
      // next URL, and then "follow" the redirect manually on the client.
      let headers = new Headers(response.headers);
      headers.set("X-Remix-Redirect", headers.get("Location")!);
      headers.delete("Location");
      if (response.headers.get("Set-Cookie") !== null) {
        headers.set("X-Remix-Revalidate", "yes");
      }

      return new Response(null, {
        status: 204,
        headers,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Response) {
      error.headers.set("X-Remix-Catch", "yes");
      return error;
    }

    let status = 500;
    let errorInstance = error;

    if (isRouteErrorResponse(error)) {
      status = error.status;
      errorInstance = error.error || errorInstance;
    }

    if (serverMode !== ServerMode.Test && !request.signal.aborted) {
      console.error(errorInstance);
    }

    if (
      serverMode === ServerMode.Development &&
      errorInstance instanceof Error
    ) {
      return errorBoundaryError(errorInstance, status);
    }

    return errorBoundaryError(new Error("Unexpected Server Error"), status);
  }
}

function findParentBoundary(
  routes: ServerRouteManifest,
  routeId: string,
  error: any
): string {
  // Fall back to the root route if we don't match any routes, since Remix
  // has default error/catch boundary handling.  This handles the case where
  // react-router doesn't have a matching "root" route to assign the error to
  // so it returns context.errors = { __shim-error-route__: ErrorResponse }
  let route = routes[routeId] || routes["root"];
  // Router-thrown ErrorResponses will have the error instance.  User-thrown
  // Responses will not have an error. The one exception here is internal 404s
  // which we handle the same as user-thrown 404s
  let isCatch =
    isRouteErrorResponse(error) && (!error.error || error.status === 404);
  if (
    (isCatch && route.module.CatchBoundary) ||
    (!isCatch && route.module.ErrorBoundary) ||
    !route.parentId
  ) {
    return route.id;
  }

  return findParentBoundary(routes, route.parentId, error);
}

// Re-generate a remix-friendly context.errors structure.  The Router only
// handles generic errors and does not distinguish error versus catch.  We
// may have a thrown response tagged to a route that only exports an
// ErrorBoundary or vice versa.  So we adjust here and ensure that
// data-loading errors are properly associated with routes that have the right
// type of boundaries.
export function differentiateCatchVersusErrorBoundaries(
  build: ServerBuild,
  context: StaticHandlerContext
) {
  if (!context.errors) {
    return;
  }

  let errors: Record<string, any> = {};
  for (let routeId of Object.keys(context.errors)) {
    let error = context.errors[routeId];
    let handlingRouteId = findParentBoundary(build.routes, routeId, error);
    errors[handlingRouteId] = error;
  }
  context.errors = errors;
}

async function handleDocumentRequestRR(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  request: Request
) {
  let context;
  try {
    context = await staticHandler.query(request);
  } catch (error) {
    if (!request.signal.aborted && serverMode !== ServerMode.Test) {
      console.error(error);
    }

    return new Response(null, { status: 500 });
  }

  if (context instanceof Response) {
    return context;
  }

  // Restructure context.errors to the right Catch/Error Boundary
  differentiateCatchVersusErrorBoundaries(build, context);

  let appState: AppState = {
    trackBoundaries: true,
    trackCatchBoundaries: true,
    catchBoundaryRouteId: null,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
  };

  // Copy staticContext.errors to catch/error boundaries in appState
  // Note: Only assign the boundary id if this module has a boundary.  This
  // should be true in almost all cases, except for cases in which no
  // boundaries exist and the router "assigns" the catch/error to the root
  // route for lack of a better place to put it.  If the root doesn't have a
  // catch/error boundary, then we leave the boundaryId null to bubble to the
  // default boundary at render time
  for (let match of context.matches) {
    let route = match.route as ServerRoute;
    let id = route.id;
    let error = context.errors?.[id];
    let hasCatchBoundary = build.routes[id]?.module.CatchBoundary != null;
    let hasErrorBoundary = build.routes[id]?.module.ErrorBoundary != null;

    if (!error) {
      continue;
    } else if (isRouteErrorResponse(error)) {
      // Internal Router errors will throw an ErrorResponse with the actual
      // error instance, while user-thrown ErrorResponses will not have the
      // instance.  We also exclude 404s so we can handle them as CatchBoundary
      // errors so the user has a singular location for 404 UI
      if (error.internal && error.error && error.status !== 404) {
        if (hasErrorBoundary) {
          appState.loaderBoundaryRouteId = id;
        }
        appState.trackBoundaries = false;
        appState.error = await serializeError(error.error);

        if (
          error.status === 405 &&
          error.error.message.includes("Invalid request method")
        ) {
          // Note: Emptying this out ensures our response matches the Remix-flow
          // exactly, but functionally both end up using the root error boundary
          // if it exists.  Might be able to clean this up eventually.
          context.matches = [];
        }
        break;
      }

      // ErrorResponse's without an error were thrown by the user action/loader
      if (hasCatchBoundary) {
        appState.catchBoundaryRouteId = id;
      }
      appState.trackCatchBoundaries = false;
      appState.catch = {
        // Order is important for response matching assertions!
        data:
          error.error && error.status === 404
            ? error.error.message
            : error.data,
        status: error.status,
        statusText: error.statusText,
      };
      break;
    } else {
      if (hasErrorBoundary) {
        appState.loaderBoundaryRouteId = id;
      }
      appState.trackBoundaries = false;
      appState.error = await serializeError(error);
      break;
    }
  }

  let renderableMatches = getRenderableMatches(
    context.matches as unknown as RouteMatch<ServerRoute>[],
    appState
  );

  if (!renderableMatches) {
    renderableMatches = [];

    let root = staticHandler.dataRoutes[0] as ServerRoute;
    if (root?.module?.CatchBoundary) {
      appState.catchBoundaryRouteId = "root";
      renderableMatches.push({
        params: {},
        pathname: "",
        route: staticHandler.dataRoutes[0] as ServerRoute,
      });
    }
  }

  let headers = getDocumentHeadersRR(build, context, renderableMatches);

  let serverHandoff: Pick<
    EntryContext,
    "actionData" | "appState" | "matches" | "routeData" | "future"
  > = {
    actionData: context.actionData || undefined,
    appState,
    matches: createEntryMatches(renderableMatches, build.assets.routes),
    routeData: context.loaderData || {},
    future: build.future,
  };

  let entryContext: EntryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules: createEntryRouteModules(build.routes),
    serverHandoffString: createServerHandoffString(serverHandoff),
  };

  let handleDocumentRequestParameters: Parameters<HandleDocumentRequestFunction> =
    [request, context.statusCode, headers, entryContext];

  let handleDocumentRequestFunction = build.entry.module.default;
  try {
    return await handleDocumentRequestFunction(
      ...handleDocumentRequestParameters
    );
  } catch (error) {
    handleDocumentRequestParameters[1] = 500;
    appState.trackBoundaries = false;
    appState.error = await serializeError(error as Error);
    entryContext.serverHandoffString = createServerHandoffString(serverHandoff);

    try {
      return await handleDocumentRequestFunction(
        ...handleDocumentRequestParameters
      );
    } catch (error: any) {
      return returnLastResortErrorResponse(error, serverMode);
    }
  }
}

async function handleResourceRequestRR(
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  routeId: string,
  request: Request
) {
  try {
    // Note we keep the routeId here to align with the Remix handling of
    // resource routes which doesn't take ?index into account and just takes
    // the leaf match
    let response = await staticHandler.queryRoute(request, routeId);
    // callRouteLoader/callRouteAction always return responses
    invariant(
      response instanceof Response,
      "Expected a Response to be returned from queryRoute"
    );
    return response;
  } catch (error) {
    if (error instanceof Response) {
      // Note: Not functionally required but ensures that our response headers
      // match identically to what Remix returns
      error.headers.set("X-Remix-Catch", "yes");
      return error;
    }
    return returnLastResortErrorResponse(error, serverMode);
  }
}

async function errorBoundaryError(error: Error, status: number) {
  return json(await serializeError(error), {
    status,
    headers: {
      "X-Remix-Error": "yes",
    },
  });
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

function returnLastResortErrorResponse(error: any, serverMode?: ServerMode) {
  if (serverMode !== ServerMode.Test) {
    console.error(error);
  }

  let message = "Unexpected Server Error";

  if (serverMode !== ServerMode.Production) {
    message += `\n\n${String(error)}`;
  }

  // Good grief folks, get your act together 😂!
  return new Response(message, {
    status: 500,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
