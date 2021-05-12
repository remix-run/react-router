import type { AppLoadContext } from "./data";
import { loadRouteData, callRouteAction } from "./data";
import type { ComponentDidCatchEmulator } from "./errors";
import { serializeError } from "./errors";
import type { ServerBuild } from "./build";
import type { EntryContext } from "./entry";
import { createEntryMatches, createEntryRouteModules } from "./entry";
import { Response, Request } from "./fetch";
import { getDocumentHeaders } from "./headers";
import type { RouteMatch } from "./routeMatching";
import { matchServerRoutes } from "./routeMatching";
import { ServerMode, isServerMode } from "./mode";
import type { ServerRoute } from "./routes";
import { createRoutes } from "./routes";
import { createRouteData } from "./routeData";
import { json } from "./responses";
import { createServerHandoffString } from "./serverHandoff";
import { RequestInit } from "node-fetch";

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
  mode?: string
): RequestHandler {
  let routes = createRoutes(build.routes);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;

  return (request, loadContext = {}) =>
    isDataRequest(request)
      ? handleDataRequest(request, loadContext, build, routes)
      : handleDocumentRequest(request, loadContext, build, routes, serverMode);
}

async function handleDataRequest(
  request: Request,
  loadContext: AppLoadContext,
  build: ServerBuild,
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

  let clonedRequest = await stripDataParam(request);

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
    return json(serializeError(error), {
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
    let locationHeader = response.headers.get("Location");
    response.headers.delete("Location");

    return new Response("", {
      status: 204,
      headers: {
        ...Object.fromEntries(response.headers),
        "X-Remix-Redirect": locationHeader!
      }
    });
  }

  return response;
}

async function handleDocumentRequest(
  request: Request,
  loadContext: AppLoadContext,
  build: ServerBuild,
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

  if (isActionRequest(request)) {
    let leafMatch = matches[matches.length - 1];
    let response = await callRouteAction(
      build,
      leafMatch.route.id,
      request,
      loadContext,
      leafMatch.params
    );

    // TODO: How do we handle errors here?

    return response;
  }

  let componentDidCatchEmulator: ComponentDidCatchEmulator = {
    trackBoundaries: true,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
    error: undefined
  };

  // Run all data loaders in parallel. Await them in series below.
  // Note: This code is a little weird due to the way unhandled promise
  // rejections are handled in node. We use a .catch() handler on each
  // promise to avoid the warning, then handle errors manually afterwards.
  let routeLoaderPromises: Promise<Response | Error>[] = matches.map(match =>
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
    if (componentDidCatchEmulator.error) {
      continue;
    }

    let route = matches[index].route;
    let routeModule = build.routes[route.id].module;

    if (routeModule.ErrorBoundary) {
      componentDidCatchEmulator.loaderBoundaryRouteId = route.id;
    }

    if (response instanceof Error) {
      if (serverMode !== ServerMode.Test) {
        console.error(
          `There was an error running the data loader for route ${route.id}`
        );
      }

      componentDidCatchEmulator.error = serializeError(response);
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

  let statusCode = notOkResponse
    ? notOkResponse.status
    : matches[matches.length - 1].route.id === "routes/404"
    ? 404
    : 200;

  let serverEntryModule = build.entry.module;
  let headers = getDocumentHeaders(build, matches, routeLoaderResponses);
  let entryMatches = createEntryMatches(matches, build.assets.routes);
  let routeData = await createRouteData(matches, routeLoaderResponses);
  let routeModules = createEntryRouteModules(build.routes);
  let serverHandoff = {
    matches: entryMatches,
    componentDidCatchEmulator,
    routeData
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
    if (serverMode !== ServerMode.Test) {
      console.error(error);
    }

    statusCode = 500;

    // Go again, this time with the componentDidCatch emulation. Remember, the
    // routes `componentDidCatch.routeId` because we can't know that here. (Well
    // ... maybe we could, we could search the error.stack lines for the first
    // file matching the id of a route from the route manifest, but that would
    // require us to have source maps installed so the filenames don't get
    // changed when we bundle, and just feels a little too shakey for me right
    // now. I'm okay with tracking our position in the route tree while
    // rendering, that's pretty much how hooks work 😂)
    componentDidCatchEmulator.trackBoundaries = false;
    componentDidCatchEmulator.error = serializeError(error);
    entryContext.serverHandoffString = createServerHandoffString(serverHandoff);

    try {
      response = serverEntryModule.default(
        request,
        statusCode,
        headers,
        entryContext
      );
    } catch (error) {
      if (serverMode !== ServerMode.Test) {
        console.error(error);
      }

      // Good grief folks, get your act together 😂!
      // TODO: Something is wrong in serverEntryModule, use the default root error handler
      response = new Response(`Unexpected Server Error\n\n${error.message}`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain"
        }
      });
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

async function stripDataParam(og: Request) {
  let url = new URL(og.url);
  url.searchParams.delete("_data");
  let init: RequestInit = {
    method: og.method,
    headers: og.headers
  };
  if (og.method.toLowerCase() !== "get") {
    init.body = await og.text();
  }
  return new Request(url, init);
}
