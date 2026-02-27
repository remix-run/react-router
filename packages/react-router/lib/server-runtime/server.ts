import type { StaticHandler, StaticHandlerContext } from "../router/router";
import type { ErrorResponse } from "../router/utils";
import { RouterContextProvider } from "../router/utils";
import {
  isRouteErrorResponse,
  ErrorResponseImpl,
  stripBasename,
} from "../router/utils";
import {
  getStaticContextFromError,
  createStaticHandler,
  isRedirectResponse,
  isResponse,
} from "../router/router";
import type { AppLoadContext } from "./data";
import type { HandleErrorFunction, ServerBuild } from "./build";
import type { CriticalCss, EntryContext } from "../dom/ssr/entry";
import { createEntryRouteModules } from "./entry";
import { sanitizeErrors, serializeError, serializeErrors } from "./errors";
import { ServerMode, isServerMode } from "./mode";
import type { RouteMatch } from "./routeMatching";
import { matchServerRoutes } from "./routeMatching";
import type { ServerRoute } from "./routes";
import { createStaticHandlerDataRoutes, createRoutes } from "./routes";
import type { ServerHandoff } from "./serverHandoff";
import { createServerHandoffString } from "./serverHandoff";
import { getBuildTimeHeader, getDevServerHooks } from "./dev";
import {
  encodeViaTurboStream,
  singleFetchAction,
  singleFetchLoaders,
  SERVER_NO_BODY_STATUS_CODES,
  generateSingleFetchRedirectResponse,
} from "./single-fetch";
import { getDocumentHeaders } from "./headers";
import type { EntryRoute } from "../dom/ssr/routes";
import type { MiddlewareEnabled } from "../types/future";
import { getManifestPath } from "../dom/ssr/fog-of-war";
import type { unstable_InstrumentRequestHandlerFunction } from "../router/instrumentation";
import { instrumentHandler } from "../router/instrumentation";
import { throwIfPotentialCSRFAttack } from "../actions";

export type RequestHandler = (
  request: Request,
  loadContext?: MiddlewareEnabled extends true
    ? RouterContextProvider
    : AppLoadContext,
) => Promise<Response>;

export type CreateRequestHandlerFunction = (
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>),
  mode?: string,
) => RequestHandler;

function derive(build: ServerBuild, mode?: string) {
  let routes = createRoutes(build.routes);
  let dataRoutes = createStaticHandlerDataRoutes(build.routes, build.future);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;
  let staticHandler = createStaticHandler(dataRoutes, {
    basename: build.basename,
    unstable_instrumentations: build.entry.module.unstable_instrumentations,
  });

  let errorHandler =
    build.entry.module.handleError ||
    ((error, { request }) => {
      if (serverMode !== ServerMode.Test && !request.signal.aborted) {
        console.error(
          // @ts-expect-error This is "private" from users but intended for internal use
          isRouteErrorResponse(error) && error.error ? error.error : error,
        );
      }
    });

  let requestHandler: RequestHandler = async (request, initialContext) => {
    let params: RouteMatch<ServerRoute>["params"] = {};
    let loadContext: AppLoadContext | RouterContextProvider;

    let handleError = (error: unknown) => {
      if (mode === ServerMode.Development) {
        getDevServerHooks()?.processRequestError?.(error);
      }

      errorHandler(error, {
        context: loadContext,
        params,
        request,
      });
    };

    if (build.future.v8_middleware) {
      if (
        initialContext &&
        !(initialContext instanceof RouterContextProvider)
      ) {
        let error = new Error(
          "Invalid `context` value provided to `handleRequest`. When middleware " +
            "is enabled you must return an instance of `RouterContextProvider` " +
            "from your `getLoadContext` function.",
        );
        handleError(error);
        return returnLastResortErrorResponse(error, serverMode);
      }
      loadContext = initialContext || new RouterContextProvider();
    } else {
      loadContext = initialContext || {};
    }

    let url = new URL(request.url);

    let normalizedBasename = build.basename || "/";

    // Normalize pathname to prevent malformed URL attacks.
    // Converts backslashes, collapses multiple slashes, ensures leading slash.
    // Intentional single trailing slashes are preserved.
    let originalPathname = url.pathname;

    // Custom normalization that preserves intentional trailing slashes
    let normalizedPathname = originalPathname
      // Convert backslashes to forward slashes
      .replace(/\\/g, "/")
      // Collapse multiple consecutive slashes into one
      .replace(/\/{2,}/g, "/");

    // Ensure path starts with "/"
    if (!normalizedPathname.startsWith("/")) {
      normalizedPathname = "/" + normalizedPathname;
    }

    // Redirect to canonical path if normalization changed the path
    if (normalizedPathname !== url.pathname) {
      return new Response(null, {
        status: 308,
        headers: {
          Location: normalizedPathname + url.search + url.hash,
        },
      });
    }
    
    let normalizedPath = normalizedPathname;
    if (build.future.unstable_trailingSlashAwareDataRequests) {
      if (normalizedPath.endsWith("/_.data")) {
        // Handle trailing slash URLs: /about/_.data -> /about/
        normalizedPath = normalizedPath.replace(/_.data$/, "");
      } else {
        normalizedPath = normalizedPath.replace(/\.data$/, "");
      }
    } else {
      if (stripBasename(normalizedPath, normalizedBasename) === "/_root.data") {
        normalizedPath = normalizedBasename;
      } else if (normalizedPath.endsWith(".data")) {
        normalizedPath = normalizedPath.replace(/\.data$/, "");
      }

      if (
        stripBasename(normalizedPath, normalizedBasename) !== "/" &&
        normalizedPath.endsWith("/")
      ) {
        normalizedPath = normalizedPath.slice(0, -1);
      }
    }

    let isSpaMode =
      getBuildTimeHeader(request, "X-React-Router-SPA-Mode") === "yes";

    // When runtime SSR is disabled, make our dev server behave like the deployed
    // pre-rendered site would
    if (!build.ssr) {
      // Decode the URL path before checking against the prerender config
      let decodedPath = decodeURI(normalizedPath);

      if (normalizedBasename !== "/") {
        let strippedPath = stripBasename(decodedPath, normalizedBasename);
        if (strippedPath == null) {
          errorHandler(
            new ErrorResponseImpl(
              404,
              "Not Found",
              `Refusing to prerender the \`${decodedPath}\` path because it does ` +
                `not start with the basename \`${normalizedBasename}\``,
            ),
            {
              context: loadContext,
              params,
              request,
            },
          );
          return new Response("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }
        decodedPath = strippedPath;
      }

      // When SSR is disabled this, file can only ever run during dev because we
      // delete the server build at the end of the build
      if (build.prerender.length === 0) {
        // ssr:false and no prerender config indicates "SPA Mode"
        isSpaMode = true;
      } else if (
        !build.prerender.includes(decodedPath) &&
        !build.prerender.includes(decodedPath + "/")
      ) {
        if (url.pathname.endsWith(".data")) {
          // 404 on non-pre-rendered `.data` requests
          errorHandler(
            new ErrorResponseImpl(
              404,
              "Not Found",
              `Refusing to SSR the path \`${decodedPath}\` because \`ssr:false\` is set and the path is not included in the \`prerender\` config, so in production the path will be a 404.`,
            ),
            {
              context: loadContext,
              params,
              request,
            },
          );
          return new Response("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        } else {
          // Serve a SPA fallback for non-pre-rendered document requests
          isSpaMode = true;
        }
      }
    }

    // Manifest request for fog of war
    let manifestUrl = getManifestPath(
      build.routeDiscovery.manifestPath,
      normalizedBasename,
    );
    if (url.pathname === manifestUrl) {
      try {
        let res = await handleManifestRequest(build, routes, url);
        return res;
      } catch (e) {
        handleError(e);
        return new Response("Unknown Server Error", { status: 500 });
      }
    }

    let matches = matchServerRoutes(routes, normalizedPath, build.basename);
    if (matches && matches.length > 0) {
      Object.assign(params, matches[0].params);
    }

    let response: Response;
    if (url.pathname.endsWith(".data")) {
      let handlerUrl = new URL(request.url);
      handlerUrl.pathname = normalizedPath;

      let singleFetchMatches = matchServerRoutes(
        routes,
        handlerUrl.pathname,
        build.basename,
      );

      response = await handleSingleFetchRequest(
        serverMode,
        build,
        staticHandler,
        request,
        handlerUrl,
        loadContext,
        handleError,
      );

      if (isRedirectResponse(response)) {
        response = generateSingleFetchRedirectResponse(
          response,
          request,
          build,
          serverMode,
        );
      }

      if (build.entry.module.handleDataRequest) {
        response = await build.entry.module.handleDataRequest(response, {
          context: loadContext,
          params: singleFetchMatches ? singleFetchMatches[0].params : {},
          request,
        });

        if (isRedirectResponse(response)) {
          response = generateSingleFetchRedirectResponse(
            response,
            request,
            build,
            serverMode,
          );
        }
      }
    } else if (
      !isSpaMode &&
      matches &&
      matches[matches.length - 1].route.module.default == null &&
      matches[matches.length - 1].route.module.ErrorBoundary == null
    ) {
      response = await handleResourceRequest(
        serverMode,
        build,
        staticHandler,
        matches.slice(-1)[0].route.id,
        request,
        loadContext,
        handleError,
      );
    } else {
      let { pathname } = url;

      let criticalCss: CriticalCss | undefined = undefined;
      if (build.unstable_getCriticalCss) {
        criticalCss = await build.unstable_getCriticalCss({ pathname });
      } else if (
        mode === ServerMode.Development &&
        getDevServerHooks()?.getCriticalCss
      ) {
        criticalCss = await getDevServerHooks()?.getCriticalCss?.(pathname);
      }

      response = await handleDocumentRequest(
        serverMode,
        build,
        staticHandler,
        request,
        loadContext,
        handleError,
        isSpaMode,
        criticalCss,
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

  if (build.entry.module.unstable_instrumentations) {
    requestHandler = instrumentHandler(
      requestHandler,
      build.entry.module.unstable_instrumentations
        .map((i) => i.handler)
        .filter(Boolean) as unstable_InstrumentRequestHandlerFunction[],
    );
  }

  return {
    routes,
    dataRoutes,
    serverMode,
    staticHandler,
    errorHandler,
    requestHandler,
  };
}

export const createRequestHandler: CreateRequestHandlerFunction = (
  build,
  mode,
) => {
  let _build: ServerBuild;
  let routes: ServerRoute[];
  let serverMode: ServerMode;
  let staticHandler: StaticHandler;
  let errorHandler: HandleErrorFunction;
  let _requestHandler: RequestHandler;

  return async function requestHandler(request, initialContext) {
    _build = typeof build === "function" ? await build() : build;

    if (typeof build === "function") {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    } else if (
      !routes ||
      !serverMode ||
      !staticHandler ||
      !errorHandler ||
      !_requestHandler
    ) {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    }

    return _requestHandler(request, initialContext);
  };
};

async function handleManifestRequest(
  build: ServerBuild,
  routes: ServerRoute[],
  url: URL,
) {
  if (build.assets.version !== url.searchParams.get("version")) {
    return new Response(null, {
      status: 204,
      headers: {
        "X-Remix-Reload-Document": "true",
      },
    });
  }

  let patches: Record<string, EntryRoute> = {};

  if (url.searchParams.has("paths")) {
    let paths = new Set<string>();

    // In addition to responding with the patches for the requested paths, we
    // need to include patches for each partial path so that we pick up any
    // pathless/index routes below ancestor segments.  So if we
    // get a request for `/parent/child`, we need to look for a match on `/parent`
    // so that if a `parent._index` route exists we return it so it's available
    // for client side matching if the user routes back up to `/parent`.
    // This is the same thing we do on initial load in <Scripts> via
    // `getPartialManifest()`
    let pathParam = url.searchParams.get("paths") || "";
    let requestedPaths = pathParam.split(",").filter(Boolean);
    requestedPaths.forEach((path) => {
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      let segments = path.split("/").slice(1);
      segments.forEach((_, i) => {
        let partialPath = segments.slice(0, i + 1).join("/");
        paths.add(`/${partialPath}`);
      });
    });

    for (let path of paths) {
      let matches = matchServerRoutes(routes, path, build.basename);
      if (matches) {
        for (let match of matches) {
          let routeId = match.route.id;
          let route = build.assets.routes[routeId];
          if (route) {
            patches[routeId] = route;
          }
        }
      }
    }

    return Response.json(patches, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response("Invalid Request", { status: 400 });
}

async function handleSingleFetchRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext | RouterContextProvider,
  handleError: (err: unknown) => void,
): Promise<Response> {
  let response =
    request.method !== "GET"
      ? await singleFetchAction(
          build,
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext,
          handleError,
        )
      : await singleFetchLoaders(
          build,
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext,
          handleError,
        );

  return response;
}

async function handleDocumentRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  request: Request,
  loadContext: AppLoadContext | RouterContextProvider,
  handleError: (err: unknown) => void,
  isSpaMode: boolean,
  criticalCss?: CriticalCss,
) {
  try {
    if (request.method === "POST") {
      try {
        throwIfPotentialCSRFAttack(
          request.headers,
          Array.isArray(build.allowedActionOrigins)
            ? build.allowedActionOrigins
            : [],
        );
      } catch (e) {
        handleError(e);
        return new Response("Bad Request", { status: 400 });
      }
    }
    let result = await staticHandler.query(request, {
      requestContext: loadContext,
      generateMiddlewareResponse: build.future.v8_middleware
        ? async (query) => {
            try {
              let innerResult = await query(request);
              if (!isResponse(innerResult)) {
                innerResult = await renderHtml(innerResult, isSpaMode);
              }
              return innerResult;
            } catch (error: unknown) {
              handleError(error);
              return new Response(null, { status: 500 });
            }
          }
        : undefined,
    });

    if (!isResponse(result)) {
      result = await renderHtml(result, isSpaMode);
    }
    return result;
  } catch (error: unknown) {
    handleError(error);
    return new Response(null, { status: 500 });
  }

  async function renderHtml(context: StaticHandlerContext, isSpaMode: boolean) {
    let headers = getDocumentHeaders(context, build);

    // Skip response body for unsupported status codes
    if (SERVER_NO_BODY_STATUS_CODES.has(context.statusCode)) {
      return new Response(null, { status: context.statusCode, headers });
    }

    // Sanitize errors outside of development environments
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        // @ts-expect-error This is "private" from users but intended for internal use
        if (!isRouteErrorResponse(err) || err.error) {
          handleError(err);
        }
      });
      context.errors = sanitizeErrors(context.errors, serverMode);
    }

    // Server UI state to send to the client.
    // - When single fetch is enabled, this is streamed down via `serverHandoffStream`
    // - Otherwise it's stringified into `serverHandoffString`
    let state = {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: serializeErrors(context.errors, serverMode),
    };
    let baseServerHandoff: ServerHandoff = {
      basename: build.basename,
      future: build.future,
      routeDiscovery: build.routeDiscovery,
      ssr: build.ssr,
      isSpaMode,
    };
    let entryContext: EntryContext = {
      manifest: build.assets,
      routeModules: createEntryRouteModules(build.routes),
      staticHandlerContext: context,
      criticalCss,
      serverHandoffString: createServerHandoffString({
        ...baseServerHandoff,
        criticalCss,
      }),
      serverHandoffStream: encodeViaTurboStream(
        state,
        request.signal,
        build.entry.module.streamTimeout,
        serverMode,
      ),
      renderMeta: {},
      future: build.future,
      ssr: build.ssr,
      routeDiscovery: build.routeDiscovery,
      isSpaMode,
      serializeError: (err) => serializeError(err, serverMode),
    };

    let handleDocumentRequestFunction = build.entry.module.default;
    try {
      return await handleDocumentRequestFunction(
        request,
        context.statusCode,
        headers,
        entryContext,
        loadContext as MiddlewareEnabled extends true
          ? RouterContextProvider
          : AppLoadContext,
      );
    } catch (error: unknown) {
      handleError(error);

      let errorForSecondRender = error;

      // If they threw a response, unwrap it into an ErrorResponse like we would
      // have for a loader/action
      if (isResponse(error)) {
        try {
          let data = await unwrapResponse(error);
          errorForSecondRender = new ErrorResponseImpl(
            error.status,
            error.statusText,
            data,
          );
        } catch (e) {
          // If we can't unwrap the response - just leave it as-is
        }
      }

      // Get a new StaticHandlerContext that contains the error at the right boundary
      context = getStaticContextFromError(
        staticHandler.dataRoutes,
        context,
        errorForSecondRender,
      );

      // Sanitize errors outside of development environments
      if (context.errors) {
        context.errors = sanitizeErrors(context.errors, serverMode);
      }

      // Get a new entryContext for the second render pass
      // Server UI state to send to the client.
      // - When single fetch is enabled, this is streamed down via `serverHandoffStream`
      // - Otherwise it's stringified into `serverHandoffString`
      let state = {
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: serializeErrors(context.errors, serverMode),
      };
      entryContext = {
        ...entryContext,
        staticHandlerContext: context,
        serverHandoffString: createServerHandoffString(baseServerHandoff),
        serverHandoffStream: encodeViaTurboStream(
          state,
          request.signal,
          build.entry.module.streamTimeout,
          serverMode,
        ),
        renderMeta: {},
      };

      try {
        return await handleDocumentRequestFunction(
          request,
          context.statusCode,
          headers,
          entryContext,
          loadContext as MiddlewareEnabled extends true
            ? RouterContextProvider
            : AppLoadContext,
        );
      } catch (error: any) {
        handleError(error);
        return returnLastResortErrorResponse(error, serverMode);
      }
    }
  }
}

async function handleResourceRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  routeId: string,
  request: Request,
  loadContext: AppLoadContext | RouterContextProvider,
  handleError: (err: unknown) => void,
) {
  try {
    // Note we keep the routeId here to align with the Remix handling of
    // resource routes which doesn't take ?index into account and just takes
    // the leaf match
    let result = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
      generateMiddlewareResponse: build.future.v8_middleware
        ? async (queryRoute) => {
            try {
              let innerResult = await queryRoute(request);
              return handleQueryRouteResult(innerResult);
            } catch (error) {
              return handleQueryRouteError(error);
            }
          }
        : undefined,
    });

    return handleQueryRouteResult(result);
  } catch (error: unknown) {
    return handleQueryRouteError(error);
  }

  function handleQueryRouteResult(
    result: Awaited<ReturnType<StaticHandler["queryRoute"]>>,
  ) {
    if (isResponse(result)) {
      return result;
    }

    if (typeof result === "string") {
      return new Response(result);
    }

    return Response.json(result);
  }

  function handleQueryRouteError(error: unknown) {
    if (isResponse(error)) {
      return error;
    }

    if (isRouteErrorResponse(error)) {
      handleError(error);
      return errorResponseToJson(error, serverMode);
    }

    if (
      error instanceof Error &&
      error.message === "Expected a response from queryRoute"
    ) {
      let newError = new Error(
        "Expected a Response to be returned from resource route handler",
      );
      handleError(newError);
      return returnLastResortErrorResponse(newError, serverMode);
    }

    handleError(error);
    return returnLastResortErrorResponse(error, serverMode);
  }
}

function errorResponseToJson(
  errorResponse: ErrorResponse,
  serverMode: ServerMode,
): Response {
  return Response.json(
    serializeError(
      // @ts-expect-error This is "private" from users but intended for internal use
      errorResponse.error || new Error("Unexpected Server Error"),
      serverMode,
    ),
    {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
    },
  );
}

function returnLastResortErrorResponse(error: any, serverMode?: ServerMode) {
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

function unwrapResponse(response: Response) {
  let contentType = response.headers.get("Content-Type");
  // Check between word boundaries instead of startsWith() due to the last
  // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
  return contentType && /\bapplication\/json\b/.test(contentType)
    ? response.body == null
      ? null
      : response.json()
    : response.text();
}
