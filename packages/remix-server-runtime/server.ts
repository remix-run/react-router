import type {
  UNSAFE_DeferredData as DeferredData,
  ErrorResponse,
  StaticHandler,
  unstable_DataStrategyFunctionArgs as DataStrategyFunctionArgs,
  StaticHandlerContext,
} from "@remix-run/router";
import {
  UNSAFE_DEFERRED_SYMBOL as DEFERRED_SYMBOL,
  getStaticContextFromError,
  isRouteErrorResponse,
  createStaticHandler,
  json as routerJson,
  stripBasename,
  UNSAFE_ErrorResponseImpl as ErrorResponseImpl,
} from "@remix-run/router";
import { encode } from "turbo-stream";

import type { AppLoadContext } from "./data";
import type { HandleErrorFunction, ServerBuild } from "./build";
import type { EntryContext } from "./entry";
import { createEntryRouteModules } from "./entry";
import {
  sanitizeError,
  sanitizeErrors,
  serializeError,
  serializeErrors,
} from "./errors";
import { getDocumentHeaders } from "./headers";
import invariant from "./invariant";
import { ServerMode, isServerMode } from "./mode";
import { matchServerRoutes } from "./routeMatching";
import type { ResponseStub, ResponseStubOperation } from "./routeModules";
import { ResponseStubOperationsSymbol } from "./routeModules";
import type { ServerRoute } from "./routes";
import { createStaticHandlerDataRoutes, createRoutes } from "./routes";
import {
  createDeferredReadableStream,
  isDeferredData,
  isRedirectResponse,
  isRedirectStatusCode,
  isResponse,
} from "./responses";
import { createServerHandoffString } from "./serverHandoff";
import { getDevServerHooks } from "./dev";

export type RequestHandler = (
  request: Request,
  loadContext?: AppLoadContext
) => Promise<Response>;

export type CreateRequestHandlerFunction = (
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>),
  mode?: string
) => RequestHandler;

function derive(build: ServerBuild, mode?: string) {
  let routes = createRoutes(build.routes);
  let dataRoutes = createStaticHandlerDataRoutes(build.routes, build.future);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;
  let staticHandler = createStaticHandler(dataRoutes, {
    basename: build.basename,
    future: {
      v7_relativeSplatPath: build.future?.v3_relativeSplatPath === true,
      v7_throwAbortReason: build.future?.v3_throwAbortReason === true,
    },
  });

  let errorHandler =
    build.entry.module.handleError ||
    ((error, { request }) => {
      if (serverMode !== ServerMode.Test && !request.signal.aborted) {
        console.error(
          // @ts-expect-error This is "private" from users but intended for internal use
          isRouteErrorResponse(error) && error.error ? error.error : error
        );
      }
    });
  return {
    routes,
    dataRoutes,
    serverMode,
    staticHandler,
    errorHandler,
  };
}

export const SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");
export const ResponseStubActionSymbol = Symbol("ResponseStubAction");

export const createRequestHandler: CreateRequestHandlerFunction = (
  build,
  mode
) => {
  let _build: ServerBuild;
  let routes: ServerRoute[];
  let serverMode: ServerMode;
  let staticHandler: StaticHandler;
  let errorHandler: HandleErrorFunction;

  return async function requestHandler(request, loadContext = {}) {
    _build = typeof build === "function" ? await build() : build;
    mode ??= _build.mode;
    if (typeof build === "function") {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
    } else if (!routes || !serverMode || !staticHandler || !errorHandler) {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
    }

    let url = new URL(request.url);

    let matches = matchServerRoutes(routes, url.pathname, _build.basename);
    let params = matches && matches.length > 0 ? matches[0].params : {};
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

    let response: Response;
    if (url.searchParams.has("_data")) {
      if (_build.future.unstable_singleFetch) {
        handleError(
          new Error(
            "Warning: Single fetch-enabled apps should not be making ?_data requests, " +
              "this is likely to break in the future"
          )
        );
      }
      let routeId = url.searchParams.get("_data")!;

      response = await handleDataRequest(
        serverMode,
        _build,
        staticHandler,
        routeId,
        request,
        loadContext,
        handleError
      );

      if (_build.entry.module.handleDataRequest) {
        response = await _build.entry.module.handleDataRequest(response, {
          context: loadContext,
          params,
          request,
        });

        if (isRedirectResponse(response)) {
          response = createRemixRedirectResponse(response, _build.basename);
        }
      }
    } else if (
      _build.future.unstable_singleFetch &&
      url.pathname.endsWith(".data")
    ) {
      let handlerUrl = new URL(request.url);
      handlerUrl.pathname = handlerUrl.pathname
        .replace(/\.data$/, "")
        .replace(/^\/_root$/, "/");

      let singleFetchMatches = matchServerRoutes(
        routes,
        handlerUrl.pathname,
        _build.basename
      );

      response = await handleSingleFetchRequest(
        serverMode,
        _build,
        staticHandler,
        request,
        handlerUrl,
        loadContext,
        handleError
      );

      if (_build.entry.module.handleDataRequest) {
        response = await _build.entry.module.handleDataRequest(response, {
          context: loadContext,
          params: singleFetchMatches ? singleFetchMatches[0].params : {},
          request,
        });

        if (isRedirectResponse(response)) {
          let result: SingleFetchResult | SingleFetchResults =
            getSingleFetchRedirect(response.status, response.headers);

          if (request.method === "GET") {
            result = {
              [SingleFetchRedirectSymbol]: result,
            };
          }
          let headers = new Headers(response.headers);
          headers.set("Content-Type", "text/x-turbo");

          return new Response(
            encodeViaTurboStream(
              result,
              request.signal,
              _build.entry.module.streamTimeout,
              serverMode
            ),
            {
              status: 200,
              headers,
            }
          );
        }
      }
    } else if (
      matches &&
      matches[matches.length - 1].route.module.default == null &&
      matches[matches.length - 1].route.module.ErrorBoundary == null
    ) {
      response = await handleResourceRequest(
        serverMode,
        staticHandler,
        matches.slice(-1)[0].route.id,
        request,
        loadContext,
        handleError
      );
    } else {
      let criticalCss =
        mode === ServerMode.Development
          ? await getDevServerHooks()?.getCriticalCss?.(_build, url.pathname)
          : undefined;

      response = await handleDocumentRequest(
        serverMode,
        _build,
        staticHandler,
        request,
        loadContext,
        handleError,
        criticalCss
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

async function handleDataRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  routeId: string,
  request: Request,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
) {
  try {
    let response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
    });

    if (isRedirectResponse(response)) {
      return createRemixRedirectResponse(response, build.basename);
    }

    if (DEFERRED_SYMBOL in response) {
      let deferredData = response[DEFERRED_SYMBOL] as DeferredData;
      let body = createDeferredReadableStream(
        deferredData,
        request.signal,
        serverMode
      );
      let init = deferredData.init || {};
      let headers = new Headers(init.headers);
      headers.set("Content-Type", "text/remix-deferred");
      // Mark successful responses with a header so we can identify in-flight
      // network errors that are missing this header
      headers.set("X-Remix-Response", "yes");
      init.headers = headers;
      return new Response(body, init);
    }

    // Mark all successful responses with a header so we can identify in-flight
    // network errors that are missing this header
    response.headers.set("X-Remix-Response", "yes");
    return response;
  } catch (error: unknown) {
    if (isResponse(error)) {
      error.headers.set("X-Remix-Catch", "yes");
      return error;
    }

    if (isRouteErrorResponse(error)) {
      handleError(error);
      return errorResponseToJson(error, serverMode);
    }

    let errorInstance =
      error instanceof Error || error instanceof DOMException
        ? error
        : new Error("Unexpected Server Error");
    handleError(errorInstance);
    return routerJson(serializeError(errorInstance, serverMode), {
      status: 500,
      headers: {
        "X-Remix-Error": "yes",
      },
    });
  }
}

type SingleFetchRedirectResult = {
  redirect: string;
  status: number;
  revalidate: boolean;
  reload: boolean;
};
export type SingleFetchResult =
  | { data: unknown }
  | { error: unknown }
  | SingleFetchRedirectResult;

export type SingleFetchResults = {
  [key: string]: SingleFetchResult;
  [SingleFetchRedirectSymbol]?: SingleFetchRedirectResult;
};

async function handleSingleFetchRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
): Promise<Response> {
  let { result, headers, status } =
    request.method !== "GET"
      ? await singleFetchAction(
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext,
          handleError
        )
      : await singleFetchLoaders(
          serverMode,
          staticHandler,
          request,
          handlerUrl,
          loadContext,
          handleError
        );

  // Mark all successful responses with a header so we can identify in-flight
  // network errors that are missing this header
  let resultHeaders = new Headers(headers);
  resultHeaders.set("X-Remix-Response", "yes");
  resultHeaders.set("Content-Type", "text/x-turbo");

  // Note: Deferred data is already just Promises, so we don't have to mess
  // `activeDeferreds` or anything :)
  return new Response(
    encodeViaTurboStream(
      result,
      request.signal,
      build.entry.module.streamTimeout,
      serverMode
    ),
    {
      status: status || 200,
      headers: resultHeaders,
    }
  );
}

async function singleFetchAction(
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
): Promise<{ result: SingleFetchResult; headers: Headers; status: number }> {
  try {
    let handlerRequest = new Request(handlerUrl, {
      method: request.method,
      body: request.body,
      headers: request.headers,
      signal: request.signal,
      ...(request.body ? { duplex: "half" } : undefined),
    });

    let responseStubs = getResponseStubs();
    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      skipLoaderErrorBubbling: true,
      skipLoaders: true,
      unstable_dataStrategy: getSingleFetchDataStrategy(responseStubs),
    });

    // Unlike `handleDataRequest`, when singleFetch is enabled, queryRoute does
    // let non-Response return values through
    if (isResponse(result)) {
      return {
        result: getSingleFetchRedirect(result.status, result.headers),
        headers: result.headers,
        status: 200,
      };
    }

    let context = result;

    let singleFetchResult: SingleFetchResult;
    let { statusCode, headers } = mergeResponseStubs(context, responseStubs);

    if (isRedirectStatusCode(statusCode) && headers.has("Location")) {
      return {
        result: getSingleFetchRedirect(statusCode, headers),
        headers,
        status: 200, // Don't want the `fetch` call to follow the redirect
      };
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

    if (context.errors) {
      let error = Object.values(context.errors)[0];
      singleFetchResult = { error: isResponseStub(error) ? null : error };
    } else {
      singleFetchResult = { data: Object.values(context.actionData || {})[0] };
    }

    return {
      result: singleFetchResult,
      headers,
      status: statusCode,
    };
  } catch (error) {
    handleError(error);
    // These should only be internal remix errors, no need to deal with responseStubs
    return {
      result: { error },
      headers: new Headers(),
      status: 500,
    };
  }
}

async function singleFetchLoaders(
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
): Promise<{ result: SingleFetchResults; headers: Headers; status: number }> {
  try {
    let handlerRequest = new Request(handlerUrl, {
      headers: request.headers,
      signal: request.signal,
    });
    let loadRouteIds =
      new URL(request.url).searchParams.get("_routes")?.split(",") || undefined;

    let responseStubs = getResponseStubs();
    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      loadRouteIds,
      skipLoaderErrorBubbling: true,
      unstable_dataStrategy: getSingleFetchDataStrategy(responseStubs),
    });

    if (isResponse(result)) {
      return {
        result: {
          [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
            result.status,
            result.headers
          ),
        },
        headers: result.headers,
        status: 200, // Don't want the `fetch` call to follow the redirect
      };
    }

    let context = result;

    let { statusCode, headers } = mergeResponseStubs(context, responseStubs);

    if (isRedirectStatusCode(statusCode) && headers.has("Location")) {
      return {
        result: {
          [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
            statusCode,
            headers
          ),
        },
        headers,
        status: 200, // Don't want the `fetch` call to follow the redirect
      };
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

    // Aggregate results based on the matches we intended to load since we get
    // `null` values back in `context.loaderData` for routes we didn't load
    let results: SingleFetchResults = {};
    let loadedMatches = loadRouteIds
      ? context.matches.filter(
          (m) => m.route.loader && loadRouteIds!.includes(m.route.id)
        )
      : context.matches;

    loadedMatches.forEach((m) => {
      let data = context.loaderData?.[m.route.id];
      let error = context.errors?.[m.route.id];
      if (error !== undefined) {
        if (isResponseStub(error)) {
          results[m.route.id] = { error: null };
        } else {
          results[m.route.id] = { error };
        }
      } else if (data !== undefined) {
        results[m.route.id] = { data };
      }
    });

    return {
      result: results,
      headers,
      status: statusCode,
    };
  } catch (error: unknown) {
    handleError(error);
    // These should only be internal remix errors, no need to deal with responseStubs
    return {
      result: { root: { error } },
      headers: new Headers(),
      status: 500,
    };
  }
}

async function handleDocumentRequest(
  serverMode: ServerMode,
  build: ServerBuild,
  staticHandler: StaticHandler,
  request: Request,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void,
  criticalCss?: string
) {
  let context;
  let responseStubs = getResponseStubs();
  try {
    context = await staticHandler.query(request, {
      requestContext: loadContext,
      unstable_dataStrategy: build.future.unstable_singleFetch
        ? getSingleFetchDataStrategy(responseStubs)
        : undefined,
    });
  } catch (error: unknown) {
    handleError(error);
    return new Response(null, { status: 500 });
  }

  if (isResponse(context)) {
    return context;
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

  let statusCode: number;
  let headers: Headers;
  if (build.future.unstable_singleFetch) {
    let merged = mergeResponseStubs(context, responseStubs);
    statusCode = merged.statusCode;
    headers = merged.headers;

    if (isRedirectStatusCode(statusCode) && headers.has("Location")) {
      return new Response(null, {
        status: statusCode,
        headers,
      });
    }
  } else {
    statusCode = context.statusCode;
    headers = getDocumentHeaders(build, context);
  }

  // Server UI state to send to the client.
  // - When single fetch is enabled, this is streamed down via `serverHandoffStream`
  // - Otherwise it's stringified into `serverHandoffString`
  let state = {
    loaderData: context.loaderData,
    actionData: context.actionData,
    errors: serializeErrors(context.errors, serverMode),
  };
  let entryContext: EntryContext = {
    manifest: build.assets,
    routeModules: createEntryRouteModules(build.routes),
    staticHandlerContext: context,
    criticalCss,
    serverHandoffString: createServerHandoffString({
      url: context.location.pathname,
      basename: build.basename,
      criticalCss,
      future: build.future,
      isSpaMode: build.isSpaMode,
      ...(!build.future.unstable_singleFetch ? { state } : null),
    }),
    ...(build.future.unstable_singleFetch
      ? {
          serverHandoffStream: encodeViaTurboStream(
            state,
            request.signal,
            build.entry.module.streamTimeout,
            serverMode
          ),
          renderMeta: {},
        }
      : null),
    future: build.future,
    isSpaMode: build.isSpaMode,
    serializeError: (err) => serializeError(err, serverMode),
  };

  let handleDocumentRequestFunction = build.entry.module.default;
  try {
    return await handleDocumentRequestFunction(
      request,
      statusCode,
      headers,
      entryContext,
      loadContext
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
          data
        );
      } catch (e) {
        // If we can't unwrap the response - just leave it as-is
      }
    }

    // Get a new StaticHandlerContext that contains the error at the right boundary
    context = getStaticContextFromError(
      staticHandler.dataRoutes,
      context,
      errorForSecondRender
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
      serverHandoffString: createServerHandoffString({
        url: context.location.pathname,
        basename: build.basename,
        future: build.future,
        isSpaMode: build.isSpaMode,
        ...(!build.future.unstable_singleFetch ? { state } : null),
      }),
      ...(build.future.unstable_singleFetch
        ? {
            serverHandoffStream: encodeViaTurboStream(
              state,
              request.signal,
              build.entry.module.streamTimeout,
              serverMode
            ),
            renderMeta: {},
          }
        : null),
    };

    try {
      return await handleDocumentRequestFunction(
        request,
        context.statusCode,
        headers,
        entryContext,
        loadContext
      );
    } catch (error: any) {
      handleError(error);
      return returnLastResortErrorResponse(error, serverMode);
    }
  }
}

async function handleResourceRequest(
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  routeId: string,
  request: Request,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
) {
  try {
    // Note we keep the routeId here to align with the Remix handling of
    // resource routes which doesn't take ?index into account and just takes
    // the leaf match
    let response = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
    });
    if (typeof response === "object") {
      invariant(
        !(DEFERRED_SYMBOL in response),
        `You cannot return a \`defer()\` response from a Resource Route.  Did you ` +
          `forget to export a default UI component from the "${routeId}" route?`
      );
    }
    // callRouteLoader/callRouteAction always return responses (w/o single fetch).
    // With single fetch, users should always be Responses from resource routes
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

    if (isRouteErrorResponse(error)) {
      if (error) {
        handleError(error);
      }
      return errorResponseToJson(error, serverMode);
    }

    handleError(error);
    return returnLastResortErrorResponse(error, serverMode);
  }
}

function errorResponseToJson(
  errorResponse: ErrorResponse,
  serverMode: ServerMode
): Response {
  return routerJson(
    serializeError(
      // @ts-expect-error This is "private" from users but intended for internal use
      errorResponse.error || new Error("Unexpected Server Error"),
      serverMode
    ),
    {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers: {
        "X-Remix-Error": "yes",
      },
    }
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

function getResponseStub(status?: number) {
  let headers = new Headers();
  let operations: ResponseStubOperation[] = [];
  let headersProxy = new Proxy(headers, {
    get(target, prop, receiver) {
      if (prop === "set" || prop === "append" || prop === "delete") {
        return (name: string, value: string) => {
          operations.push([prop, name, value]);
          Reflect.apply(target[prop], target, [name, value]);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  return {
    status,
    headers: headersProxy,
    [ResponseStubOperationsSymbol]: operations,
  };
}

function getSingleFetchDataStrategy(
  responseStubs: ReturnType<typeof getResponseStubs>
) {
  return async ({ request, matches }: DataStrategyFunctionArgs) => {
    let results = await Promise.all(
      matches.map(async (match) => {
        let responseStub: ResponseStub | undefined;
        if (request.method !== "GET") {
          responseStub = responseStubs[ResponseStubActionSymbol];
        } else {
          responseStub = responseStubs[match.route.id];
        }

        let result = await match.resolve(async (handler) => {
          let data = await handler({ response: responseStub });
          return { type: "data", result: data };
        });

        // Transfer raw Response status/headers to responseStubs
        if (isResponse(result.result)) {
          proxyResponseToResponseStub(
            result.result.status,
            result.result.headers,
            responseStub
          );
        } else if (isDeferredData(result.result) && result.result.init) {
          proxyResponseToResponseStub(
            result.result.init.status,
            new Headers(result.result.init.headers),
            responseStub
          );
        }

        return result;
      })
    );
    return results;
  };
}

function proxyResponseToResponseStub(
  status: number | undefined,
  headers: Headers,
  responseStub: ResponseStub
) {
  if (status != null && responseStub.status == null) {
    responseStub.status = status;
  }
  for (let [k, v] of headers) {
    if (k.toLowerCase() !== "set-cookie") {
      responseStub.headers.set(k, v);
    }
  }

  // Unsure why this is complaining?  It's fine in VSCode but fails with tsc...
  // @ts-ignore - ignoring instead of expecting because otherwise build fails locally
  for (let v of headers.getSetCookie()) {
    responseStub.headers.append("Set-Cookie", v);
  }
}

function isResponseStub(value: any): value is ResponseStub {
  return (
    value && typeof value === "object" && ResponseStubOperationsSymbol in value
  );
}

function getResponseStubs() {
  return new Proxy({} as Record<string | symbol, ResponseStub>, {
    get(responseStubCache, prop) {
      let cached = responseStubCache[prop];
      if (!cached) {
        responseStubCache[prop] = cached = getResponseStub();
      }
      return cached;
    },
  });
}

function mergeResponseStubs(
  context: StaticHandlerContext,
  responseStubs: ReturnType<typeof getResponseStubs>
) {
  let statusCode: number | undefined = undefined;
  let headers = new Headers();

  // Action followed by top-down loaders
  let actionStub = responseStubs[ResponseStubActionSymbol];
  let stubs = [
    actionStub,
    ...context.matches.map((m) => responseStubs[m.route.id]),
  ];

  for (let stub of stubs) {
    // Take the highest error/redirect, or the lowest success value - preferring
    // action 200's over loader 200s
    if (
      // first status found on the way down
      (statusCode === undefined && stub.status) ||
      // deeper 2xx status found while not overriding the action status
      (statusCode !== undefined &&
        statusCode < 300 &&
        stub.status &&
        statusCode !== actionStub?.status)
    ) {
      statusCode = stub.status;
    }

    // Replay headers operations in order
    let ops = stub[ResponseStubOperationsSymbol];
    for (let [op, ...args] of ops) {
      // @ts-expect-error
      headers[op](...args);
    }
  }

  // If no response stubs set it, use whatever we got back from the router
  // context which handles internal ErrorResponse cases like 404/405's where
  // we may never run a loader/action
  if (statusCode === undefined) {
    statusCode = context.statusCode;
  }
  if (statusCode === undefined) {
    statusCode = 200;
  }

  return { statusCode, headers };
}

function getSingleFetchRedirect(
  status: number,
  headers: Headers
): SingleFetchRedirectResult {
  return {
    redirect: headers.get("Location")!,
    status,
    revalidate:
      // Technically X-Remix-Revalidate isn't needed here - that was an implementation
      // detail of ?_data requests as our way to tell the front end to revalidate when
      // we didn't have a response body to include that information in.
      // With single fetch, we tell the front end via this revalidate boolean field.
      // However, we're respecting it for now because it may be something folks have
      // used in their own responses
      // TODO(v3): Consider removing or making this official public API
      headers.has("X-Remix-Revalidate") || headers.has("Set-Cookie"),
    reload: headers.has("X-Remix-Reload-Document"),
  };
}

// Note: If you change this function please change the corresponding
// decodeViaTurboStream function in server-runtime
function encodeViaTurboStream(
  data: any,
  requestSignal: AbortSignal,
  streamTimeout: number | undefined,
  serverMode: ServerMode
) {
  let controller = new AbortController();
  // How long are we willing to wait for all of the promises in `data` to resolve
  // before timing out?  We default this to 50ms shorter than the default value for
  // `ABORT_DELAY` in our built-in `entry.server.tsx` so that once we reject we
  // have time to flush the rejections down through React's rendering stream before `
  // we call abort() on that.  If the user provides their own it's up to them to
  // decouple the aborting of the stream from the aborting of React's renderToPipeableStream
  let timeoutId = setTimeout(
    () => controller.abort(new Error("Server Timeout")),
    typeof streamTimeout === "number" ? streamTimeout : 4950
  );
  requestSignal.addEventListener("abort", () => clearTimeout(timeoutId));

  return encode(data, {
    signal: controller.signal,
    plugins: [
      (value) => {
        // Even though we sanitized errors on context.errors prior to responding,
        // we still need to handle this for any deferred data that rejects with an
        // Error - as those will not be sanitized yet
        if (value instanceof Error) {
          let { name, message, stack } =
            serverMode === ServerMode.Production
              ? sanitizeError(value, serverMode)
              : value;
          return ["SanitizedError", name, message, stack];
        }

        if (value instanceof ErrorResponseImpl) {
          let { data, status, statusText } = value;
          return ["ErrorResponse", data, status, statusText];
        }

        if (
          value &&
          typeof value === "object" &&
          SingleFetchRedirectSymbol in value
        ) {
          return ["SingleFetchRedirect", value[SingleFetchRedirectSymbol]];
        }
      },
    ],
  });
}

function createRemixRedirectResponse(
  response: Response,
  basename: string | undefined
) {
  // We don't have any way to prevent a fetch request from following
  // redirects. So we use the `X-Remix-Redirect` header to indicate the
  // next URL, and then "follow" the redirect manually on the client.
  let headers = new Headers(response.headers);
  let redirectUrl = headers.get("Location")!;
  headers.set(
    "X-Remix-Redirect",
    basename ? stripBasename(redirectUrl, basename) || redirectUrl : redirectUrl
  );
  headers.set("X-Remix-Status", String(response.status));
  headers.delete("Location");
  if (response.headers.get("Set-Cookie") !== null) {
    headers.set("X-Remix-Revalidate", "yes");
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
