import { encode } from "turbo-stream";

import type { StaticHandler, StaticHandlerContext } from "../router/router";
import {
  isRedirectResponse,
  isRedirectStatusCode,
  isResponse,
} from "../router/router";
import type {
  DataStrategyFunctionArgs,
  DataStrategyFunction,
} from "../router/utils";
import {
  isRouteErrorResponse,
  ErrorResponseImpl,
  data as routerData,
  stripBasename,
} from "../router/utils";
import type {
  SingleFetchRedirectResult,
  SingleFetchResult,
  SingleFetchResults,
} from "../dom/ssr/single-fetch";
import { SingleFetchRedirectSymbol } from "../dom/ssr/single-fetch";
import type { AppLoadContext } from "./data";
import { sanitizeError, sanitizeErrors } from "./errors";
import { ServerMode } from "./mode";
import { getDocumentHeaders } from "./headers";
import type { ServerBuild } from "./build";
import invariant from "./invariant";

export type { SingleFetchResult, SingleFetchResults };
export { SingleFetchRedirectSymbol };

// Do not include a response body if the status code is one of these,
// otherwise `undici` will throw an error when constructing the Response:
//   https://github.com/nodejs/undici/blob/bd98a6303e45d5e0d44192a93731b1defdb415f3/lib/web/fetch/response.js#L522-L528
//
// Specs:
//   https://datatracker.ietf.org/doc/html/rfc9110#name-informational-1xx
//   https://datatracker.ietf.org/doc/html/rfc9110#name-204-no-content
//   https://datatracker.ietf.org/doc/html/rfc9110#name-205-reset-content
//   https://datatracker.ietf.org/doc/html/rfc9110#name-304-not-modified
export const NO_BODY_STATUS_CODES = new Set([100, 101, 204, 205, 304]);

// We can't use a 3xx status or else the `fetch()` would follow the redirect.
// We need to communicate the redirect back as data so we can act on it in the
// client side router.  We use a 202 to avoid any automatic caching we might
// get from a 200 since a "temporary" redirect should not be cached.  This lets
// the user control cache behavior via Cache-Control
export const SINGLE_FETCH_REDIRECT_STATUS = 202;

// TODO: Add this logic as flags to query() and remove this function
export function getSingleFetchDataStrategy({
  isActionDataRequest,
  loadRouteIds,
}: {
  isActionDataRequest?: boolean;
  loadRouteIds?: string[];
} = {}): DataStrategyFunction {
  return async ({ request, matches }: DataStrategyFunctionArgs) => {
    // Don't call loaders on action data requests
    if (isActionDataRequest && request.method === "GET") {
      return {};
    }

    // Only run opt-in loaders when fine-grained revalidation is enabled
    let matchesToLoad = loadRouteIds
      ? matches.filter((m) => loadRouteIds.includes(m.route.id))
      : matches;

    let results = await Promise.all(
      matchesToLoad.map((match) => match.resolve())
    );
    return results.reduce(
      (acc, result, i) =>
        Object.assign(acc, { [matchesToLoad[i].route.id]: result }),
      {}
    );
  };
}

export async function singleFetchAction(
  build: ServerBuild,
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
): Promise<Response> {
  try {
    let handlerRequest = new Request(handlerUrl, {
      method: request.method,
      body: request.body,
      headers: request.headers,
      signal: request.signal,
      ...(request.body ? { duplex: "half" } : undefined),
    });

    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      skipLoaderErrorBubbling: true,
      async respond(context: StaticHandlerContext) {
        let headers = getDocumentHeaders(build, context);

        if (
          isRedirectStatusCode(context.statusCode) &&
          headers.has("Location")
        ) {
          return generateSingleFetchResponse(request, build, serverMode, {
            result: getSingleFetchRedirect(
              context.statusCode,
              headers,
              build.basename
            ),
            headers,
            status: SINGLE_FETCH_REDIRECT_STATUS,
          });
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

        let singleFetchResult: SingleFetchResult;
        if (context.errors) {
          singleFetchResult = { error: Object.values(context.errors)[0] };
        } else {
          singleFetchResult = {
            data: Object.values(context.actionData || {})[0],
          };
        }

        return generateSingleFetchResponse(request, build, serverMode, {
          result: singleFetchResult,
          headers,
          status: context.statusCode,
        });
      },
    });

    invariant(isResponse(result), " Expected a Response from query()");

    // Unlike `handleDataRequest`, when singleFetch is enabled, query does
    // let non-Response return values through
    if (isRedirectResponse(result)) {
      return generateSingleFetchResponse(request, build, serverMode, {
        result: getSingleFetchRedirect(
          result.status,
          result.headers,
          build.basename
        ),
        headers: result.headers,
        status: SINGLE_FETCH_REDIRECT_STATUS,
      });
    }

    return result;
  } catch (error) {
    handleError(error);
    // These should only be internal remix errors, no need to deal with responseStubs
    return generateSingleFetchResponse(request, build, serverMode, {
      result: { error },
      headers: new Headers(),
      status: 500,
    });
  }
}

export async function singleFetchLoaders(
  build: ServerBuild,
  serverMode: ServerMode,
  staticHandler: StaticHandler,
  request: Request,
  handlerUrl: URL,
  loadContext: AppLoadContext,
  handleError: (err: unknown) => void
): Promise<Response> {
  try {
    let handlerRequest = new Request(handlerUrl, {
      headers: request.headers,
      signal: request.signal,
    });
    let loadRouteIds =
      new URL(request.url).searchParams.get("_routes")?.split(",") || undefined;

    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      skipLoaderErrorBubbling: true,
      async respond(context: StaticHandlerContext) {
        let headers = getDocumentHeaders(build, context);

        if (
          isRedirectStatusCode(context.statusCode) &&
          headers.has("Location")
        ) {
          return generateSingleFetchResponse(request, build, serverMode, {
            result: {
              [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
                context.statusCode,
                headers,
                build.basename
              ),
            },
            headers,
            status: SINGLE_FETCH_REDIRECT_STATUS,
          });
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
          let { id } = m.route;
          if (context.errors && context.errors.hasOwnProperty(id)) {
            results[id] = { error: context.errors[id] };
          } else if (context.loaderData.hasOwnProperty(id)) {
            results[id] = { data: context.loaderData[id] };
          }
        });

        return generateSingleFetchResponse(request, build, serverMode, {
          result: results,
          headers,
          status: context.statusCode,
        });
      },
    });

    invariant(isResponse(result), " Expected a Response from query()");

    if (isRedirectResponse(result)) {
      return generateSingleFetchResponse(request, build, serverMode, {
        result: {
          [SingleFetchRedirectSymbol]: getSingleFetchRedirect(
            result.status,
            result.headers,
            build.basename
          ),
        },
        headers: result.headers,
        status: SINGLE_FETCH_REDIRECT_STATUS,
      });
    }

    return result;
  } catch (error: unknown) {
    handleError(error);
    // These should only be internal remix errors, no need to deal with responseStubs
    return generateSingleFetchResponse(request, build, serverMode, {
      result: { root: { error } },
      headers: new Headers(),
      status: 500,
    });
  }
}

function generateSingleFetchResponse(
  request: Request,
  build: ServerBuild,
  serverMode: ServerMode,
  {
    result,
    headers,
    status,
  }: {
    result: SingleFetchResult | SingleFetchResults;
    headers: Headers;
    status: number;
  }
) {
  // Mark all successful responses with a header so we can identify in-flight
  // network errors that are missing this header
  let resultHeaders = new Headers(headers);
  resultHeaders.set("X-Remix-Response", "yes");

  // Skip response body for unsupported status codes
  if (NO_BODY_STATUS_CODES.has(status)) {
    return new Response(null, { status, headers: resultHeaders });
  }

  // We use a less-descriptive `text/x-script` here instead of something like
  // `text/x-turbo` to enable compression when deployed via Cloudflare.  See:
  //  - https://github.com/remix-run/remix/issues/9884
  //  - https://developers.cloudflare.com/speed/optimization/content/brotli/content-compression/
  resultHeaders.set("Content-Type", "text/x-script");

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

export function getSingleFetchRedirect(
  status: number,
  headers: Headers,
  basename: string | undefined
): SingleFetchRedirectResult {
  let redirect = headers.get("Location")!;

  if (basename) {
    redirect = stripBasename(redirect, basename) || redirect;
  }

  return {
    redirect,
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
    replace: headers.has("X-Remix-Replace"),
  };
}

export type Serializable =
  | undefined
  | null
  | boolean
  | string
  | symbol
  | number
  | Array<Serializable>
  | { [key: PropertyKey]: Serializable }
  | bigint
  | Date
  | URL
  | RegExp
  | Error
  | Map<Serializable, Serializable>
  | Set<Serializable>
  | Promise<Serializable>;

export function data(value: Serializable, init?: number | ResponseInit) {
  return routerData(value, init);
}

// Note: If you change this function please change the corresponding
// decodeViaTurboStream function in server-runtime
export function encodeViaTurboStream(
  data: any,
  requestSignal: AbortSignal,
  streamTimeout: number | undefined,
  serverMode: ServerMode
) {
  let controller = new AbortController();
  // How long are we willing to wait for all of the promises in `data` to resolve
  // before timing out?  We default this to 50ms shorter than the default value
  // of 5000ms we had in `ABORT_DELAY` in Remix v2 that folks may still be using
  // in RR v7 so that once we reject we have time to flush the rejections down
  // through React's rendering stream before we call `abort()` on that.  If the
  // user provides their own it's up to them to decouple the aborting of the
  // stream from the aborting of React's `renderToPipeableStream`
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
    postPlugins: [
      (value) => {
        if (!value) return;
        if (typeof value !== "object") return;

        return [
          "SingleFetchClassInstance",
          Object.fromEntries(Object.entries(value)),
        ];
      },
      () => ["SingleFetchFallback"],
    ],
  });
}
