import * as React from "react";

import { decode } from "../../../vendor/turbo-stream-v2/turbo-stream";
import type { Router as DataRouter } from "../../router/router";
import { isDataWithResponseInit, isResponse } from "../../router/router";
import type {
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  DataStrategyResult,
} from "../../router/utils";
import {
  ErrorResponseImpl,
  isRouteErrorResponse,
  redirect,
  data,
  stripBasename,
} from "../../router/utils";
import { createRequestInit } from "./data";
import type { AssetsManifest, EntryContext } from "./entry";
import { escapeHtml } from "./markup";
import invariant from "./invariant";
import type { RouteModules } from "./routeModules";
import type { DataRouteMatch } from "../../context";

export const SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");

class SingleFetchNoResultError extends Error {}

export type SingleFetchRedirectResult = {
  redirect: string;
  status: number;
  revalidate: boolean;
  reload: boolean;
  replace: boolean;
};

// Shared/serializable type used by both turbo-stream and RSC implementations
export type DecodedSingleFetchResults =
  | { routes: { [key: string]: SingleFetchResult } }
  | { redirect: SingleFetchRedirectResult };

// This and SingleFetchResults are only used over the wire, and are converted to
// DecodedSingleFetchResults in `fetchAndDecode`.  This way turbo-stream/RSC
// can use the same `unwrapSingleFetchResult` implementation.
export type SingleFetchResult =
  | { data: unknown }
  | { error: unknown }
  | SingleFetchRedirectResult;

export type SingleFetchResults =
  | { [key: string]: SingleFetchResult }
  | { [SingleFetchRedirectSymbol]: SingleFetchRedirectResult };

interface StreamTransferProps {
  context: EntryContext;
  identifier: number;
  reader: ReadableStreamDefaultReader<Uint8Array>;
  textDecoder: TextDecoder;
  nonce?: string;
}

// We can't use a 3xx status or else the `fetch()` would follow the redirect.
// We need to communicate the redirect back as data so we can act on it in the
// client side router.  We use a 202 to avoid any automatic caching we might
// get from a 200 since a "temporary" redirect should not be cached.  This lets
// the user control cache behavior via Cache-Control
export const SINGLE_FETCH_REDIRECT_STATUS = 202;

// Some status codes are not permitted to have bodies, so we want to just
// treat those as "no data" instead of throwing an exception:
//   https://datatracker.ietf.org/doc/html/rfc9110#name-informational-1xx
//   https://datatracker.ietf.org/doc/html/rfc9110#name-204-no-content
//   https://datatracker.ietf.org/doc/html/rfc9110#name-205-reset-content
//
// Note: 304 is not included here because the browser should fill those responses
// with the cached body content.
export const NO_BODY_STATUS_CODES = new Set([100, 101, 204, 205]);

// StreamTransfer recursively renders down chunks of the `serverHandoffStream`
// into the client-side `streamController`
export function StreamTransfer({
  context,
  identifier,
  reader,
  textDecoder,
  nonce,
}: StreamTransferProps) {
  // If the user didn't render the <Scripts> component then we don't have to
  // bother streaming anything in
  if (!context.renderMeta || !context.renderMeta.didRenderScripts) {
    return null;
  }

  if (!context.renderMeta.streamCache) {
    context.renderMeta.streamCache = {};
  }
  let { streamCache } = context.renderMeta;
  let promise = streamCache[identifier];
  if (!promise) {
    promise = streamCache[identifier] = reader
      .read()
      .then((result) => {
        streamCache[identifier].result = {
          done: result.done,
          value: textDecoder.decode(result.value, { stream: true }),
        };
      })
      .catch((e) => {
        streamCache[identifier].error = e;
      });
  }

  if (promise.error) {
    throw promise.error;
  }
  if (promise.result === undefined) {
    throw promise;
  }

  let { done, value } = promise.result;
  let scriptTag = value ? (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `window.__reactRouterContext.streamController.enqueue(${escapeHtml(
          JSON.stringify(value)
        )});`,
      }}
    />
  ) : null;

  if (done) {
    return (
      <>
        {scriptTag}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.__reactRouterContext.streamController.close();`,
          }}
        />
      </>
    );
  } else {
    return (
      <>
        {scriptTag}
        <React.Suspense>
          <StreamTransfer
            context={context}
            identifier={identifier + 1}
            reader={reader}
            textDecoder={textDecoder}
            nonce={nonce}
          />
        </React.Suspense>
      </>
    );
  }
}

type GetRouteInfoFunction = (match: DataRouteMatch) => {
  hasLoader: boolean;
  hasClientLoader: boolean;
  hasShouldRevalidate: boolean;
};

type ShouldAllowOptOutFunction = (match: DataRouteMatch) => boolean;

export type FetchAndDecodeFunction = (
  args: DataStrategyFunctionArgs,
  basename: string | undefined,
  targetRoutes?: string[],
  shouldAllowOptOut?: ShouldAllowOptOutFunction
) => Promise<{ status: number; data: DecodedSingleFetchResults }>;

export function getTurboStreamSingleFetchDataStrategy(
  getRouter: () => DataRouter,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  ssr: boolean,
  basename: string | undefined
): DataStrategyFunction {
  let dataStrategy = getSingleFetchDataStrategyImpl(
    getRouter,
    (match: DataRouteMatch) => {
      let manifestRoute = manifest.routes[match.route.id];
      invariant(manifestRoute, "Route not found in manifest");
      let routeModule = routeModules[match.route.id];
      return {
        hasLoader: manifestRoute.hasLoader,
        hasClientLoader: manifestRoute.hasClientLoader,
        hasShouldRevalidate: Boolean(routeModule?.shouldRevalidate),
      };
    },
    fetchAndDecodeViaTurboStream,
    ssr,
    basename
  );
  return async (args) => args.unstable_runClientMiddleware(dataStrategy);
}

export function getSingleFetchDataStrategyImpl(
  getRouter: () => DataRouter,
  getRouteInfo: GetRouteInfoFunction,
  fetchAndDecode: FetchAndDecodeFunction,
  ssr: boolean,
  basename: string | undefined,
  shouldAllowOptOut: ShouldAllowOptOutFunction = () => true
): DataStrategyFunction {
  return async (args) => {
    let { request, matches, fetcherKey } = args;
    let router = getRouter();

    // Actions are simple and behave the same for navigations and fetchers
    if (request.method !== "GET") {
      return singleFetchActionStrategy(args, fetchAndDecode, basename);
    }

    let foundRevalidatingServerLoader = matches.some((m) => {
      let { hasLoader, hasClientLoader } = getRouteInfo(m);
      return m.unstable_shouldCallHandler() && hasLoader && !hasClientLoader;
    });
    if (!ssr && !foundRevalidatingServerLoader) {
      // If this is SPA mode, there won't be any loaders below root and we'll
      // disable single fetch.  We have to keep the `dataStrategy` defined for
      // SPA mode because we may load a SPA fallback page but then navigate into
      // a pre-rendered path and need to fetch the pre-rendered `.data` file.
      //
      // If this is `ssr:false` with a `prerender` config, we need to keep single
      // fetch enabled because we can prerender the `.data` files at build time
      // and load them from a static file server/CDN at runtime.
      //
      // However, with the SPA Fallback logic, we can have SPA routes operating
      // alongside pre-rendered routes.  If any pre-rendered routes have a
      // `loader` then the default behavior would be to make the single fetch
      // `.data` request on navigation to get the updated root/parent route
      // `loader` data.
      //
      // We need to detect these scenarios because if it's a non-pre-rendered
      // route being handled by SPA mode, then the `.data` file won't have been
      // pre-generated and it'll cause a 404.  Thankfully, we can do this
      // without knowing the prerender'd paths and can just do loader detection
      // from the manifest:
      //
      // - We only allow loaders on pre-rendered routes at build time
      // - We opt out of revalidation automatically for routes with a `loader`
      //   and no `clientLoader` because the data is static
      // - So if no routes with a server `loader` need to revalidate we can just
      //   call the normal resolve functions and short circuit any single fetch
      //   behavior
      // - If we find this a loader that needs to be called, we know the route must
      //   have been pre-rendered at build time since the loader would have
      //   errored otherwise
      // - So it's safe to make the call knowing there will be a `.data` file on
      //   the other end
      return nonSsrStrategy(args, getRouteInfo, fetchAndDecode, basename);
    }

    // Fetcher loads are singular calls to one loader
    if (fetcherKey) {
      return singleFetchLoaderFetcherStrategy(args, fetchAndDecode, basename);
    }

    // Navigational loads are more complex...
    return singleFetchLoaderNavigationStrategy(
      args,
      router,
      getRouteInfo,
      fetchAndDecode,
      ssr,
      basename,
      shouldAllowOptOut
    );
  };
}

// Actions are simple since they're singular calls to the server for both
// navigations and fetchers)
async function singleFetchActionStrategy(
  args: DataStrategyFunctionArgs,
  fetchAndDecode: FetchAndDecodeFunction,
  basename: string | undefined
) {
  let actionMatch = args.matches.find((m) => m.unstable_shouldCallHandler());
  invariant(actionMatch, "No action match found");
  let actionStatus: number | undefined = undefined;
  let result = await actionMatch.resolve(async (handler) => {
    let result = await handler(async () => {
      let { data, status } = await fetchAndDecode(args, basename, [
        actionMatch!.route.id,
      ]);
      actionStatus = status;
      return unwrapSingleFetchResult(data, actionMatch!.route.id);
    });
    return result;
  });

  if (
    isResponse(result.result) ||
    isRouteErrorResponse(result.result) ||
    isDataWithResponseInit(result.result)
  ) {
    return { [actionMatch.route.id]: result };
  }

  // For non-responses, proxy along the statusCode via data()
  // (most notably for skipping action error revalidation)
  return {
    [actionMatch.route.id]: {
      type: result.type,
      result: data(result.result, actionStatus),
    },
  };
}

// We want to opt-out of Single Fetch when we aren't in SSR mode
async function nonSsrStrategy(
  args: DataStrategyFunctionArgs,
  getRouteInfo: GetRouteInfoFunction,
  fetchAndDecode: FetchAndDecodeFunction,
  basename: string | undefined
) {
  let matchesToLoad = args.matches.filter((m) =>
    m.unstable_shouldCallHandler()
  );
  let results: Record<string, DataStrategyResult> = {};
  await Promise.all(
    matchesToLoad.map((m) =>
      m.resolve(async (handler) => {
        try {
          let { hasClientLoader } = getRouteInfo(m);
          // Need to pass through a `singleFetch` override handler so
          // clientLoader's can still call server loaders through `.data`
          // requests
          let routeId = m.route.id;
          let result = hasClientLoader
            ? await handler(async () => {
                let { data } = await fetchAndDecode(args, basename, [routeId]);
                return unwrapSingleFetchResult(data, routeId);
              })
            : await handler();
          results[m.route.id] = { type: "data", result };
        } catch (e) {
          results[m.route.id] = { type: "error", result: e };
        }
      })
    )
  );
  return results;
}

// Loaders are trickier since we only want to hit the server once, so we
// create a singular promise for all server-loader routes to latch onto.
async function singleFetchLoaderNavigationStrategy(
  args: DataStrategyFunctionArgs,
  router: DataRouter,
  getRouteInfo: GetRouteInfoFunction,
  fetchAndDecode: FetchAndDecodeFunction,
  ssr: boolean,
  basename: string | undefined,
  shouldAllowOptOut: (match: DataRouteMatch) => boolean = () => true
) {
  // Track which routes need a server load for use in a `_routes` param
  let routesParams = new Set<string>();

  // Only add `_routes` when at least 1 route opts out via `shouldRevalidate`/`clientLoader`
  let foundOptOutRoute = false;

  // Deferreds per-route so we can be sure they've all loaded via `match.resolve()`
  let routeDfds = args.matches.map(() => createDeferred<void>());

  // Deferred we'll use for the singleular call to the server
  let singleFetchDfd = createDeferred<DecodedSingleFetchResults>();

  // We'll build up this results object as we loop through matches
  let results: Record<string, DataStrategyResult> = {};

  let resolvePromise = Promise.all(
    args.matches.map(async (m, i) =>
      m.resolve(async (handler) => {
        routeDfds[i].resolve();
        let routeId = m.route.id;
        let { hasLoader, hasClientLoader, hasShouldRevalidate } =
          getRouteInfo(m);

        let defaultShouldRevalidate =
          !m.unstable_shouldRevalidateArgs ||
          m.unstable_shouldRevalidateArgs.actionStatus == null ||
          m.unstable_shouldRevalidateArgs.actionStatus < 400;
        let shouldCall = m.unstable_shouldCallHandler(defaultShouldRevalidate);

        if (!shouldCall) {
          // If this route opted out, don't include in the .data request
          foundOptOutRoute ||=
            m.unstable_shouldRevalidateArgs != null && // This is a revalidation,
            hasLoader && // for a route with a server loader,
            hasShouldRevalidate === true; // and a shouldRevalidate function
          return;
        }

        // When a route has a client loader, it opts out of the singular call and
        // calls it's server loader via `serverLoader()` using a `?_routes` param
        if (shouldAllowOptOut(m) && hasClientLoader) {
          if (hasLoader) {
            foundOptOutRoute = true;
          }
          try {
            let result = await handler(async () => {
              let { data } = await fetchAndDecode(args, basename, [routeId]);
              return unwrapSingleFetchResult(data, routeId);
            });

            results[routeId] = { type: "data", result };
          } catch (e) {
            results[routeId] = { type: "error", result: e };
          }
          return;
        }

        // Load this route on the server if it has a loader
        if (hasLoader) {
          routesParams.add(routeId);
        }

        // Lump this match in with the others on a singular promise
        try {
          let result = await handler(async () => {
            let data = await singleFetchDfd.promise;
            return unwrapSingleFetchResult(data, routeId);
          });
          results[routeId] = { type: "data", result };
        } catch (e) {
          results[routeId] = { type: "error", result: e };
        }
      })
    )
  );

  // Wait for all routes to resolve above before we make the HTTP call
  await Promise.all(routeDfds.map((d) => d.promise));

  // We can skip the server call:
  // - On initial hydration - only clientLoaders can pass through via
  //   `clientLoader.hydrate`. We check the navigation state below as well
  //   because if a clientLoader redirected we'll still be `initialized=false`
  //   but we want to call loaders for the new location
  // - If there are no routes to fetch from the server
  //
  // One exception - if we are performing an HDR revalidation we have to call
  // the server in case a new loader has shown up that the manifest doesn't yet
  // know about
  let isInitialLoad =
    !router.state.initialized && router.state.navigation.state === "idle";
  if (
    (isInitialLoad || routesParams.size === 0) &&
    !window.__reactRouterHdrActive
  ) {
    singleFetchDfd.resolve({ routes: {} });
  } else {
    // When routes have opted out, add a `_routes` param to filter server loaders
    // Skipped in `ssr:false` because we expect to be loading static `.data` files
    let targetRoutes =
      ssr && foundOptOutRoute && routesParams.size > 0
        ? [...routesParams.keys()]
        : undefined;
    try {
      let data = await fetchAndDecode(args, basename, targetRoutes);
      singleFetchDfd.resolve(data.data);
    } catch (e) {
      singleFetchDfd.reject(e);
    }
  }

  await resolvePromise;

  await bubbleMiddlewareErrors(
    singleFetchDfd.promise,
    args.matches,
    routesParams,
    results
  );

  return results;
}

// If a middleware threw on the way down, we won't have data for our requested
// loaders and they'll resolve to `SingleFetchNoResultError` results.  If this
// happens, take the highest error we find in our results (which is a middleware
// error if no loaders ever ran), and assign to these missing routes and let
// the router bubble accordingly
async function bubbleMiddlewareErrors(
  singleFetchPromise: Promise<DecodedSingleFetchResults>,
  matches: DataStrategyFunctionArgs["matches"],
  routesParams: Set<string>,
  results: Record<string, DataStrategyResult>
) {
  try {
    let middlewareError: unknown;
    let fetchedData = await singleFetchPromise;

    if ("routes" in fetchedData) {
      for (let match of matches) {
        if (match.route.id in fetchedData.routes) {
          let routeResult = fetchedData.routes[match.route.id];
          if ("error" in routeResult) {
            middlewareError = routeResult.error;
            break;
          }
        }
      }
    }

    if (middlewareError !== undefined) {
      Array.from(routesParams.values()).forEach((routeId) => {
        if (results[routeId].result instanceof SingleFetchNoResultError) {
          results[routeId].result = middlewareError;
        }
      });
    }
  } catch (e) {
    // No-op - this logic is only intended to process successful responses
    // If the `.data` failed, the routes will handle those errors themselves
  }
}

// Fetcher loader calls are much simpler than navigational loader calls
async function singleFetchLoaderFetcherStrategy(
  args: DataStrategyFunctionArgs,
  fetchAndDecode: FetchAndDecodeFunction,
  basename: string | undefined
) {
  let fetcherMatch = args.matches.find((m) => m.unstable_shouldCallHandler());
  invariant(fetcherMatch, "No fetcher match found");
  let routeId = fetcherMatch.route.id;
  let result = await fetcherMatch.resolve(async (handler) =>
    handler(async () => {
      let { data } = await fetchAndDecode(args, basename, [routeId]);
      return unwrapSingleFetchResult(data, routeId);
    })
  );
  return { [fetcherMatch.route.id]: result };
}

export function stripIndexParam(url: URL) {
  let indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  let indexValuesToKeep = [];
  for (let indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue);
    }
  }
  for (let toKeep of indexValuesToKeep) {
    url.searchParams.append("index", toKeep);
  }

  return url;
}

export function singleFetchUrl(
  reqUrl: URL | string,
  basename: string | undefined,
  extension: "data" | "rsc"
) {
  let url =
    typeof reqUrl === "string"
      ? new URL(
          reqUrl,
          // This can be called during the SSR flow via PrefetchPageLinksImpl so
          // don't assume window is available
          typeof window === "undefined"
            ? "server://singlefetch/"
            : window.location.origin
        )
      : reqUrl;

  if (url.pathname === "/") {
    url.pathname = `_root.${extension}`;
  } else if (basename && stripBasename(url.pathname, basename) === "/") {
    url.pathname = `${basename.replace(/\/$/, "")}/_root.${extension}`;
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}.${extension}`;
  }

  return url;
}

async function fetchAndDecodeViaTurboStream(
  args: DataStrategyFunctionArgs,
  basename: string | undefined,
  targetRoutes?: string[]
): Promise<{ status: number; data: DecodedSingleFetchResults }> {
  let { request } = args;
  let url = singleFetchUrl(request.url, basename, "data");
  if (request.method === "GET") {
    url = stripIndexParam(url);
    if (targetRoutes) {
      url.searchParams.set("_routes", targetRoutes.join(","));
    }
  }

  let res = await fetch(url, await createRequestInit(request));

  // If this 404'd without hitting the running server (most likely in a
  // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
  if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
    throw new ErrorResponseImpl(404, "Not Found", true);
  }

  // Handle non-RR redirects (i.e., from express middleware)
  if (res.status === 204 && res.headers.has("X-Remix-Redirect")) {
    return {
      status: SINGLE_FETCH_REDIRECT_STATUS,
      data: {
        redirect: {
          redirect: res.headers.get("X-Remix-Redirect")!,
          status: Number(res.headers.get("X-Remix-Status") || "302"),
          revalidate: res.headers.get("X-Remix-Revalidate") === "true",
          reload: res.headers.get("X-Remix-Reload-Document") === "true",
          replace: res.headers.get("X-Remix-Replace") === "true",
        },
      },
    };
  }

  if (NO_BODY_STATUS_CODES.has(res.status)) {
    let routes: { [key: string]: SingleFetchResult } = {};
    // We get back just a single result for action requests - normalize that
    // to a DecodedSingleFetchResults shape here
    if (targetRoutes && request.method !== "GET") {
      routes[targetRoutes[0]] = { data: undefined };
    }
    return {
      status: res.status,
      data: { routes },
    };
  }

  invariant(res.body, "No response body to decode");

  try {
    let decoded = await decodeViaTurboStream(res.body, window);
    let data: DecodedSingleFetchResults;
    if (request.method === "GET") {
      let typed = decoded.value as SingleFetchResults;
      if (SingleFetchRedirectSymbol in typed) {
        data = { redirect: typed[SingleFetchRedirectSymbol] };
      } else {
        data = { routes: typed };
      }
    } else {
      let typed = decoded.value as SingleFetchResult;
      let routeId = targetRoutes?.[0];
      invariant(routeId, "No routeId found for single fetch call decoding");
      if ("redirect" in typed) {
        data = { redirect: typed };
      } else {
        data = { routes: { [routeId]: typed } };
      }
    }
    return { status: res.status, data };
  } catch (e) {
    // Can't clone after consuming the body via turbo-stream so we can't
    // include the body here.  In an ideal world we'd look for a turbo-stream
    // content type here, or even X-Remix-Response but then folks can't
    // statically deploy their prerendered .data files to a CDN unless they can
    // tell that CDN to add special headers to those certain files - which is a
    // bit restrictive.
    throw new Error("Unable to decode turbo-stream response");
  }
}

// Note: If you change this function please change the corresponding
// encodeViaTurboStream function in server-runtime
export function decodeViaTurboStream(
  body: ReadableStream<Uint8Array>,
  global: Window | typeof globalThis
) {
  return decode(body, {
    plugins: [
      (type: string, ...rest: unknown[]) => {
        // Decode Errors back into Error instances using the right type and with
        // the right (potentially undefined) stacktrace
        if (type === "SanitizedError") {
          let [name, message, stack] = rest as [
            string,
            string,
            string | undefined
          ];
          let Constructor = Error;
          // @ts-expect-error
          if (name && name in global && typeof global[name] === "function") {
            // @ts-expect-error
            Constructor = global[name];
          }
          let error = new Constructor(message);
          error.stack = stack;
          return { value: error };
        }

        if (type === "ErrorResponse") {
          let [data, status, statusText] = rest as [
            unknown,
            number,
            string | undefined
          ];
          return {
            value: new ErrorResponseImpl(status, statusText, data),
          };
        }

        if (type === "SingleFetchRedirect") {
          return { value: { [SingleFetchRedirectSymbol]: rest[0] } };
        }

        if (type === "SingleFetchClassInstance") {
          return { value: rest[0] };
        }

        if (type === "SingleFetchFallback") {
          return { value: undefined };
        }
      },
    ],
  });
}

function unwrapSingleFetchResult(
  result: DecodedSingleFetchResults,
  routeId: string
) {
  if ("redirect" in result) {
    let {
      redirect: location,
      revalidate,
      reload,
      replace,
      status,
    } = result.redirect;
    throw redirect(location, {
      status,
      headers: {
        // Three R's of redirecting (lol Veep)
        ...(revalidate ? { "X-Remix-Revalidate": "yes" } : null),
        ...(reload ? { "X-Remix-Reload-Document": "yes" } : null),
        ...(replace ? { "X-Remix-Replace": "yes" } : null),
      },
    });
  }

  let routeResult = result.routes[routeId];
  if (routeResult == null) {
    throw new SingleFetchNoResultError(
      `No result found for routeId "${routeId}"`
    );
  } else if ("error" in routeResult) {
    throw routeResult.error;
  } else if ("data" in routeResult) {
    return routeResult.data;
  } else {
    throw new Error(`Invalid response found for routeId "${routeId}"`);
  }
}

function createDeferred<T = unknown>() {
  let resolve: (val: T) => Promise<void>;
  let reject: (error: unknown) => Promise<void>;
  let promise = new Promise<T>((res, rej) => {
    resolve = async (val: T) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: unknown) => {
      rej(error);
      try {
        await promise;
      } catch (e) {}
    };
  });
  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}
