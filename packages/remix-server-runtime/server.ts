import type { StaticHandler, StaticHandlerContext } from "@remix-run/router";
import {
  getStaticContextFromError,
  isRouteErrorResponse,
  createStaticHandler,
} from "@remix-run/router";

import type { AppLoadContext } from "./data";
import type { ServerBuild } from "./build";
import type { EntryContext } from "./entry";
import { createEntryRouteModules } from "./entry";
import { serializeError, serializeErrors } from "./errors";
import { getDocumentHeadersRR } from "./headers";
import invariant from "./invariant";
import { ServerMode, isServerMode } from "./mode";
import { matchServerRoutes } from "./routeMatching";
import type { ServerRouteManifest } from "./routes";
import { createStaticHandlerDataRoutes, createRoutes } from "./routes";
import { json, isRedirectResponse, isResponse } from "./responses";
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
  let dataRoutes = createStaticHandlerDataRoutes(build.routes);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;
  let staticHandler = createStaticHandler(dataRoutes);

  return async function requestHandler(request, loadContext = {}) {
    let url = new URL(request.url);
    let matches = matchServerRoutes(routes, url.pathname);

    let response: Response;
    if (url.searchParams.has("_data")) {
      let routeId = url.searchParams.get("_data")!;

      response = await handleDataRequestRR(
        serverMode,
        staticHandler,
        routeId,
        request,
        loadContext
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
        staticHandler,
        matches.slice(-1)[0].route.id,
        request,
        loadContext
      );
    } else {
      response = await handleDocumentRequestRR(
        serverMode,
        build,
        staticHandler,
        request,
        loadContext
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
  request: Request,
  loadContext: AppLoadContext
) {
  try {
    let response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
    });

    if (isRedirectResponse(response)) {
      // We don't have any way to prevent a fetch request from following
      // redirects. So we use the `X-Remix-Redirect` header to indicate the
      // next URL, and then "follow" the redirect manually on the client.
      let headers = new Headers(response.headers);
      headers.set("X-Remix-Redirect", headers.get("Location")!);
      headers.set("X-Remix-Status", response.status);
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
  } catch (error: unknown) {
    if (isResponse(error)) {
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
  request: Request,
  loadContext: AppLoadContext
) {
  let context;
  try {
    context = await staticHandler.query(request, {
      requestContext: loadContext,
    });
  } catch (error: unknown) {
    if (!request.signal.aborted && serverMode !== ServerMode.Test) {
      console.error(error);
    }

    return new Response(null, { status: 500 });
  }

  if (isResponse(context)) {
    return context;
  }

  // Restructure context.errors to the right Catch/Error Boundary
  differentiateCatchVersusErrorBoundaries(build, context);

  let headers = getDocumentHeadersRR(build, context);

  let entryContext: EntryContext = {
    manifest: build.assets,
    routeModules: createEntryRouteModules(build.routes),
    staticHandlerContext: context,
    serverHandoffString: createServerHandoffString({
      state: {
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: serializeErrors(context.errors),
      },
      future: build.future,
    }),
    future: build.future,
  };

  let handleDocumentRequestFunction = build.entry.module.default;
  try {
    return await handleDocumentRequestFunction(
      request,
      context.statusCode,
      headers,
      entryContext
    );
  } catch (error: unknown) {
    // Get a new StaticHandlerContext that contains the error at the right boundary
    context = getStaticContextFromError(
      staticHandler.dataRoutes,
      context,
      error
    );

    // Restructure context.errors to the right Catch/Error Boundary
    differentiateCatchVersusErrorBoundaries(build, context);

    // Update entryContext for the second render pass
    entryContext = {
      ...entryContext,
      staticHandlerContext: context,
      serverHandoffString: createServerHandoffString({
        state: {
          loaderData: context.loaderData,
          actionData: context.actionData,
          errors: serializeErrors(context.errors),
        },
        future: build.future,
      }),
    };

    try {
      return await handleDocumentRequestFunction(
        request,
        context.statusCode,
        headers,
        entryContext
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
  request: Request,
  loadContext: AppLoadContext
) {
  try {
    // Note we keep the routeId here to align with the Remix handling of
    // resource routes which doesn't take ?index into account and just takes
    // the leaf match
    let response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
    });
    // callRouteLoader/callRouteAction always return responses
    invariant(
      isResponse(response),
      "Expected a Response to be returned from queryRoute"
    );
    return response;
  } catch (error: unknown) {
    if (isResponse(error)) {
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
