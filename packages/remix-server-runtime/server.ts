import type { AppLoadContext } from "./data";
import { loadRouteData, callRouteAction } from "./data";
import type { ComponentDidCatchEmulator } from "./errors";

import type { ServerBuild } from "./build";
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
import { createActionData, createRouteData } from "./routeData";
import { json } from "./responses";
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

  return (request, loadContext = {}) =>
    isDataRequest(request)
      ? handleDataRequest(request, loadContext, build, platform, routes)
      : handleDocumentRequest(
          request,
          loadContext,
          build,
          platform,
          routes,
          serverMode
        );
}

async function handleDataRequest(
  request: Request,
  loadContext: AppLoadContext,
  build: ServerBuild,
  platform: ServerPlatform,
  routes: ServerRoute[]
): Promise<Response> {
  let url = new URL(request.url);

  let matches = matchServerRoutes(routes, url.pathname);
  if (!matches) {
    return jsonError(`No route matches URL "${url.pathname}"`, 404);
  }

  let routeMatch: RouteMatch<ServerRoute>;
  if (isActionRequest(request)) {
    routeMatch = matches[matches.length - 1];
  } else {
    let routeId = url.searchParams.get("_data");
    if (!routeId) {
      return jsonError(`Missing route id in ?_data`, 403);
    }

    let match = matches.find(match => match.route.id === routeId);
    if (!match) {
      return jsonError(
        `Route "${routeId}" does not match URL "${url.pathname}"`,
        403
      );
    }

    routeMatch = match;
  }

  let clonedRequest = stripDataParam(request);

  let response: Response;
  try {
    response = isActionRequest(request)
      ? await callRouteAction(
          build,
          routeMatch.route.id,
          clonedRequest,
          loadContext,
          routeMatch.params
        )
      : await loadRouteData(
          build,
          routeMatch.route.id,
          clonedRequest,
          loadContext,
          routeMatch.params
        );
  } catch (error) {
    let formattedError = (await platform.formatServerError?.(error)) || error;
    return json(await serializeError(formattedError), {
      status: 500,
      headers: {
        "X-Remix-Error": "unfortunately, yes"
      }
    });
  }

  if (isRedirectResponse(response)) {
    // We don't have any way to prevent a fetch request from following
    // redirects. So we use the `X-Remix-Redirect` header to indicate the
    // next URL, and then "follow" the redirect manually on the client.
    let headers = new Headers(response.headers);
    headers.set("X-Remix-Redirect", headers.get("Location")!);
    headers.delete("Location");

    return new Response("", {
      status: 204,
      headers
    });
  }

  return response;
}

async function handleDocumentRequest(
  request: Request,
  loadContext: AppLoadContext,
  build: ServerBuild,
  platform: ServerPlatform,
  routes: ServerRoute[],
  serverMode: ServerMode
): Promise<Response> {
  let url = new URL(request.url);

  let matches = matchServerRoutes(routes, url.pathname);
  if (!matches) {
    // TODO: Provide a default 404 page
    throw new Error(
      `There is no route that matches ${url.pathname}. Please add ` +
        `a routes/404.js file`
    );
  }

  let componentDidCatchEmulator: ComponentDidCatchEmulator = {
    trackBoundaries: true,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
    error: undefined
  };

  let actionErrored: boolean = false;
  let actionResponse: Response | undefined;

  if (isActionRequest(request)) {
    let leafMatch = matches[matches.length - 1];
    try {
      actionResponse = await callRouteAction(
        build,
        leafMatch.route.id,
        request.clone(),
        loadContext,
        leafMatch.params
      );
      if (isRedirectResponse(actionResponse)) {
        return actionResponse;
      }
    } catch (error) {
      let formattedError = (await platform.formatServerError?.(error)) || error;
      actionErrored = true;
      let withBoundaries = getMatchesUpToDeepestErrorBoundary(matches);
      componentDidCatchEmulator.loaderBoundaryRouteId =
        withBoundaries[withBoundaries.length - 1].route.id;
      componentDidCatchEmulator.error = await serializeError(formattedError);
    }
  }

  let matchesToLoad = actionErrored
    ? getMatchesUpToDeepestErrorBoundary(
        // get rid of the action, we don't want to call it's loader either
        // because we'll be rendering the error boundary, if you can get access
        // to the loader data in the error boundary then how the heck is it
        // supposed to deal with errors in the loader, too?
        matches.slice(0, -1)
      )
    : matches;

  // Run all data loaders in parallel. Await them in series below.  Note: This
  // code is a little weird due to the way unhandled promise rejections are
  // handled in node. We use a .catch() handler on each promise to avoid the
  // warning, then handle errors manually afterwards.
  let routeLoaderPromises: Promise<
    Response | Error
  >[] = matchesToLoad.map(match =>
    loadRouteData(
      build,
      match.route.id,
      request.clone(),
      loadContext,
      match.params
    ).catch(error => error)
  );

  let routeLoaderResults = await Promise.all(routeLoaderPromises);
  for (let [index, response] of routeLoaderResults.entries()) {
    let route = matches[index].route;
    let routeModule = build.routes[route.id].module;

    // Rare case where an action throws an error, and then when we try to render
    // the action's page to tell the user about the the error, a loader above
    // the action route *also* threw an error or tried to redirect!
    //
    // Instead of rendering the loader error or redirecting like usual, we
    // ignore the loader error or redirect because the action error was first
    // and is higher priority to surface.  Perhaps the action error is the
    // reason the loader blows up now! It happened first and is more important
    // to address.
    //
    // We just give up and move on with rendering the error as deeply as we can,
    // which is the previous iteration of this loop
    if (
      actionErrored &&
      (response instanceof Error || isRedirectResponse(response))
    ) {
      break;
    }

    if (componentDidCatchEmulator.error) {
      continue;
    }

    if (routeModule.ErrorBoundary) {
      componentDidCatchEmulator.loaderBoundaryRouteId = route.id;
    }

    if (response instanceof Error) {
      if (serverMode !== ServerMode.Test) {
        console.error(
          `There was an error running the data loader for route ${route.id}`
        );
      }

      let formattedError =
        (await platform.formatServerError?.(response)) || response;

      componentDidCatchEmulator.error = await serializeError(formattedError);
      routeLoaderResults[index] = json(null, { status: 500 });
    } else if (isRedirectResponse(response)) {
      return response;
    }
  }

  // We already filtered out all Errors, so these are all Responses.
  let routeLoaderResponses: Response[] = routeLoaderResults as Response[];

  // Handle responses with a non-200 status code. The first loader with a
  // non-200 status code determines the status code for the whole response.
  let notOkResponse = routeLoaderResponses.find(
    response => response.status !== 200
  );

  let statusCode = actionErrored
    ? 500
    : notOkResponse
    ? notOkResponse.status
    : matches[matches.length - 1].route.id === "routes/404"
    ? 404
    : 200;

  let renderableMatches = getRenderableMatches(
    matches,
    componentDidCatchEmulator
  );
  let serverEntryModule = build.entry.module;
  let headers = getDocumentHeaders(
    build,
    renderableMatches,
    routeLoaderResponses,
    actionResponse
  );
  let entryMatches = createEntryMatches(renderableMatches, build.assets.routes);
  let routeData = await createRouteData(
    renderableMatches,
    routeLoaderResponses
  );
  let actionData = actionResponse
    ? {
        [matches[matches.length - 1].route.id]: await createActionData(
          actionResponse
        )
      }
    : undefined;
  let routeModules = createEntryRouteModules(build.routes);
  let serverHandoff = {
    matches: entryMatches,
    componentDidCatchEmulator,
    routeData,
    actionData
  };
  let entryContext: EntryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules,
    serverHandoffString: createServerHandoffString(serverHandoff)
  };

  let response: Response | Promise<Response>;
  try {
    response = serverEntryModule.default(
      request,
      statusCode,
      headers,
      entryContext
    );
  } catch (error) {
    let formattedError = (await platform.formatServerError?.(error)) || error;
    if (serverMode !== ServerMode.Test) {
      console.error(formattedError);
    }

    statusCode = 500;

    // Go again, this time with the componentDidCatch emulation. As it rendered
    // last time we mutated `componentDidCatch.routeId` for the last rendered
    // route, now we know where to render the error boundary (feels a little
    // hacky but that's how hooks work). This tells the emulator to stop
    // tracking the `routeId` as we render because we already have an error to
    // render.
    componentDidCatchEmulator.trackBoundaries = false;
    componentDidCatchEmulator.error = await serializeError(formattedError);
    entryContext.serverHandoffString = createServerHandoffString(serverHandoff);

    try {
      response = serverEntryModule.default(
        request,
        statusCode,
        headers,
        entryContext
      );
    } catch (error) {
      let formattedError = (await platform.formatServerError?.(error)) || error;
      if (serverMode !== ServerMode.Test) {
        console.error(formattedError);
      }

      // Good grief folks, get your act together 😂!
      response = new Response(
        `Unexpected Server Error\n\n${formattedError.message}`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain"
          }
        }
      );
    }
  }

  return response;
}

function jsonError(error: string, status = 403): Response {
  return json({ error }, { status });
}

function isActionRequest(request: Request): boolean {
  return request.method.toLowerCase() !== "get";
}

function isDataRequest(request: Request): boolean {
  return new URL(request.url).searchParams.has("_data");
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

function isRedirectResponse(response: Response): boolean {
  return redirectStatusCodes.has(response.status);
}

function stripDataParam(request: Request) {
  let url = new URL(request.url);
  url.searchParams.delete("_data");
  return new Request(url.toString(), request);
}

// This ensures we only load the data for the routes above an action error
function getMatchesUpToDeepestErrorBoundary(
  matches: RouteMatch<ServerRoute>[]
) {
  let deepestErrorBoundaryIndex: number = -1;

  matches.forEach((match, index) => {
    if (match.route.module.ErrorBoundary) {
      deepestErrorBoundaryIndex = index;
    }
  });

  if (deepestErrorBoundaryIndex === -1) {
    // no route error boundaries, don't need to call any loaders
    return [];
  }

  return matches.slice(0, deepestErrorBoundaryIndex + 1);
}

// This prevents `<Outlet/>` from rendering anything below where the error threw
// TODO: maybe do this in <RemixErrorBoundary + context>
function getRenderableMatches(
  matches: RouteMatch<ServerRoute>[],
  componentDidCatchEmulator: ComponentDidCatchEmulator
) {
  // no error, no worries
  if (!componentDidCatchEmulator.error) {
    return matches;
  }

  let lastRenderableIndex: number = -1;

  matches.forEach((match, index) => {
    let id = match.route.id;
    if (
      componentDidCatchEmulator.renderBoundaryRouteId === id ||
      componentDidCatchEmulator.loaderBoundaryRouteId === id
    ) {
      lastRenderableIndex = index;
    }
  });

  return matches.slice(0, lastRenderableIndex + 1);
}
