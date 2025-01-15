import * as React from "react";
import { decode } from "turbo-stream";
import type {
  Router as DataRouter,
  MiddlewareError,
} from "../../router/router";
import { isResponse, runMiddlewarePipeline } from "../../router/router";
import type {
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  DataStrategyResult,
  DataStrategyMatch,
} from "../../router/utils";
import {
  ErrorResponseImpl,
  isRouteErrorResponse,
  redirect,
  data,
} from "../../router/utils";
import { createRequestInit } from "./data";
import type { AssetsManifest, EntryContext } from "./entry";
import { escapeHtml } from "./markup";
import type { RouteModule, RouteModules } from "./routeModules";
import invariant from "./invariant";
import { EntryRoute } from "./routes";

export const SingleFetchRedirectSymbol = Symbol("SingleFetchRedirect");

export type SingleFetchRedirectResult = {
  redirect: string;
  status: number;
  revalidate: boolean;
  reload: boolean;
  replace: boolean;
};

export type SingleFetchResult =
  | { data: unknown }
  | { error: unknown }
  | SingleFetchRedirectResult;

export type SingleFetchResults = {
  [key: string]: SingleFetchResult;
  [SingleFetchRedirectSymbol]?: SingleFetchRedirectResult;
};

interface StreamTransferProps {
  context: EntryContext;
  identifier: number;
  reader: ReadableStreamDefaultReader<Uint8Array>;
  textDecoder: TextDecoder;
  nonce?: string;
}

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

function middlewareErrorHandler(
  e: MiddlewareError,
  keyedResults: Record<string, DataStrategyResult>
) {
  // we caught an error running the middleware, copy that overtop any
  // non-error result for the route
  Object.assign(keyedResults, {
    [e.routeId]: { type: "error", result: e.error },
  });
}

export function getSingleFetchDataStrategy(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  getRouter: () => DataRouter
): DataStrategyFunction {
  return async (args) => {
    let { request, matches, fetcherKey } = args;

    // Actions are simple and behave the same for navigations and fetchers
    if (request.method !== "GET") {
      return runMiddlewarePipeline(
        args,
        matches.findIndex((m) => m.shouldLoad),
        false,
        async (keyedResults) => {
          let results = await singleFetchActionStrategy(request, matches);
          Object.assign(keyedResults, results);
        },
        middlewareErrorHandler
      ) as Promise<Record<string, DataStrategyResult>>;
    }

    // Fetcher loads are singular calls to one loader
    if (fetcherKey) {
      return runMiddlewarePipeline(
        args,
        matches.findIndex((m) => m.shouldLoad),
        false,
        async (keyedResults) => {
          let results = await singleFetchLoaderFetcherStrategy(
            request,
            matches
          );
          Object.assign(keyedResults, results);
        },
        middlewareErrorHandler
      ) as Promise<Record<string, DataStrategyResult>>;
    }

    // Navigational loads are more complex...

    // Determine how deep to run middleware
    let lowestLoadingIndex = getLowestLoadingIndex(
      manifest,
      routeModules,
      getRouter(),
      matches
    );

    return runMiddlewarePipeline(
      args,
      lowestLoadingIndex,
      false,
      async (keyedResults) => {
        let results = await singleFetchLoaderNavigationStrategy(
          manifest,
          routeModules,
          getRouter(),
          request,
          matches
        );
        Object.assign(keyedResults, results);
      },
      middlewareErrorHandler
    ) as Promise<Record<string, DataStrategyResult>>;
  };
}

// Actions are simple since they're singular calls to the server for both
// navigations and fetchers)
async function singleFetchActionStrategy(
  request: Request,
  matches: DataStrategyFunctionArgs["matches"]
) {
  let actionMatch = matches.find((m) => m.shouldLoad);
  invariant(actionMatch, "No action match found");
  let actionStatus: number | undefined = undefined;
  let result = await actionMatch.resolve(async (handler) => {
    let result = await handler(async () => {
      let url = singleFetchUrl(request.url);
      let init = await createRequestInit(request);
      let { data, status } = await fetchAndDecode(url, init);
      actionStatus = status;
      return unwrapSingleFetchResult(
        data as SingleFetchResult,
        actionMatch!.route.id
      );
    });
    return result;
  });

  if (isResponse(result.result) || isRouteErrorResponse(result.result)) {
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

function isOptedOut(
  manifestRoute: EntryRoute | undefined,
  routeModule: RouteModule | undefined,
  match: DataStrategyMatch,
  router: DataRouter
) {
  return (
    match.route.id in router.state.loaderData &&
    manifestRoute &&
    manifestRoute.hasLoader &&
    routeModule &&
    routeModule.shouldRevalidate
  );
}

function getLowestLoadingIndex(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  router: DataRouter,
  matches: DataStrategyFunctionArgs["matches"]
) {
  let tailIdx = [...matches]
    .reverse()
    .findIndex(
      (m) =>
        m.shouldLoad ||
        !isOptedOut(
          manifest.routes[m.route.id],
          routeModules[m.route.id],
          m,
          router
        )
    );
  return tailIdx < 0 ? 0 : matches.length - 1 - tailIdx;
}

// Loaders are trickier since we only want to hit the server once, so we
// create a singular promise for all server-loader routes to latch onto.
async function singleFetchLoaderNavigationStrategy(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  router: DataRouter,
  request: Request,
  matches: DataStrategyFunctionArgs["matches"]
) {
  // Track which routes need a server load - in case we need to tack on a
  // `_routes` param
  let routesParams = new Set<string>();

  // We only add `_routes` when one or more routes opts out of a load via
  // `shouldRevalidate` or `clientLoader`
  let foundOptOutRoute = false;

  // Deferreds for each route so we can be sure they've all loaded via
  // `match.resolve()`, and a singular promise that can tell us all routes
  // have been resolved
  let routeDfds = matches.map(() => createDeferred<void>());
  let routesLoadedPromise = Promise.all(routeDfds.map((d) => d.promise));

  // Deferred that we'll use for the call to the server that each match can
  // await and parse out it's specific result
  let singleFetchDfd = createDeferred<SingleFetchResults>();

  // Base URL and RequestInit for calls to the server
  let url = stripIndexParam(singleFetchUrl(request.url));
  let init = await createRequestInit(request);

  // We'll build up this results object as we loop through matches
  let results: Record<string, DataStrategyResult> = {};

  let resolvePromise = Promise.all(
    matches.map(async (m, i) =>
      m.resolve(async (handler) => {
        routeDfds[i].resolve();

        let manifestRoute = manifest.routes[m.route.id];

        // Note: If this logic changes for routes that should not participate
        // in Single Fetch, make sure you update getLowestLoadingIndex above
        // as well
        if (!m.shouldLoad) {
          // If we're not yet initialized and this is the initial load, respect
          // `shouldLoad` because we're only dealing with `clientLoader.hydrate`
          // routes which will fall into the `clientLoader` section below.
          if (!router.state.initialized) {
            return;
          }

          // Otherwise, we opt out if we currently have data, a `loader`, and a
          // `shouldRevalidate` function.  This implies that the user opted out
          // via `shouldRevalidate`
          if (isOptedOut(manifestRoute, routeModules[m.route.id], m, router)) {
            foundOptOutRoute = true;
            return;
          }
        }

        // When a route has a client loader, it opts out of the singular call and
        // calls it's server loader via `serverLoader()` using a `?_routes` param
        if (manifestRoute && manifestRoute.hasClientLoader) {
          if (manifestRoute.hasLoader) {
            foundOptOutRoute = true;
          }
          try {
            let result = await fetchSingleLoader(
              handler,
              url,
              init,
              m.route.id
            );
            results[m.route.id] = { type: "data", result };
          } catch (e) {
            results[m.route.id] = { type: "error", result: e };
          }
          return;
        }

        // Load this route on the server if it has a loader
        if (manifestRoute && manifestRoute.hasLoader) {
          routesParams.add(m.route.id);
        }

        // Lump this match in with the others on a singular promise
        try {
          let result = await handler(async () => {
            let data = await singleFetchDfd.promise;
            return unwrapSingleFetchResults(data, m.route.id);
          });
          results[m.route.id] = {
            type: "data",
            result,
          };
        } catch (e) {
          results[m.route.id] = {
            type: "error",
            result: e,
          };
        }
      })
    )
  );

  // Wait for all routes to resolve above before we make the HTTP call
  await routesLoadedPromise;

  // We can skip the server call:
  // - On initial hydration - only clientLoaders can pass through via `clientLoader.hydrate`
  // - If there are no routes to fetch from the server
  //
  // One exception - if we are performing an HDR revalidation we have to call
  // the server in case a new loader has shown up that the manifest doesn't yet
  // know about
  if (
    (!router.state.initialized || routesParams.size === 0) &&
    !window.__reactRouterHdrActive
  ) {
    singleFetchDfd.resolve({});
  } else {
    try {
      // When one or more routes have opted out, we add a _routes param to
      // limit the loaders to those that have a server loader and did not
      // opt out
      if (foundOptOutRoute && routesParams.size > 0) {
        url.searchParams.set(
          "_routes",
          matches
            .filter((m) => routesParams.has(m.route.id))
            .map((m) => m.route.id)
            .join(",")
        );
      }

      let data = await fetchAndDecode(url, init);
      singleFetchDfd.resolve(data.data as SingleFetchResults);
    } catch (e) {
      singleFetchDfd.reject(e as Error);
    }
  }

  await resolvePromise;

  return results;
}

// Fetcher loader calls are much simpler than navigational loader calls
async function singleFetchLoaderFetcherStrategy(
  request: Request,
  matches: DataStrategyFunctionArgs["matches"]
) {
  let fetcherMatch = matches.find((m) => m.shouldLoad);
  invariant(fetcherMatch, "No fetcher match found");
  let result = await fetcherMatch.resolve(async (handler) => {
    let url = stripIndexParam(singleFetchUrl(request.url));
    let init = await createRequestInit(request);
    return fetchSingleLoader(handler, url, init, fetcherMatch!.route.id);
  });
  return { [fetcherMatch.route.id]: result };
}

function fetchSingleLoader(
  handler: Parameters<
    NonNullable<Parameters<DataStrategyMatch["resolve"]>[0]>
  >[0],
  url: URL,
  init: RequestInit,
  routeId: string
) {
  return handler(async () => {
    let singleLoaderUrl = new URL(url);
    singleLoaderUrl.searchParams.set("_routes", routeId);
    let { data } = await fetchAndDecode(singleLoaderUrl, init);
    return unwrapSingleFetchResults(data as SingleFetchResults, routeId);
  });
}

function stripIndexParam(url: URL) {
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

export function singleFetchUrl(reqUrl: URL | string) {
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
    url.pathname = "_root.data";
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, "")}.data`;
  }

  return url;
}

async function fetchAndDecode(
  url: URL,
  init: RequestInit
): Promise<{ status: number; data: unknown }> {
  let res = await fetch(url, init);

  // If this 404'd without hitting the running server (most likely in a
  // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
  if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
    throw new ErrorResponseImpl(404, "Not Found", true);
  }

  // some status codes are not permitted to have bodies, so we want to just
  // treat those as "no data" instead of throwing an exception.
  // 304 is not included here because the browser should fill those responses
  // with the cached body content.
  const NO_BODY_STATUS_CODES = new Set([100, 101, 204, 205]);
  if (NO_BODY_STATUS_CODES.has(res.status)) {
    if (!init.method || init.method === "GET") {
      // SingleFetchResults can just have no routeId keys which will result
      // in no data for all routes
      return { status: res.status, data: {} };
    } else {
      // SingleFetchResult is for a singular route and can specify no data
      return { status: res.status, data: { data: undefined } };
    }
  }

  invariant(res.body, "No response body to decode");

  try {
    let decoded = await decodeViaTurboStream(res.body, window);
    return { status: res.status, data: decoded.value };
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

function unwrapSingleFetchResults(
  results: SingleFetchResults,
  routeId: string
) {
  let redirect = results[SingleFetchRedirectSymbol];
  if (redirect) {
    return unwrapSingleFetchResult(redirect, routeId);
  }

  return results[routeId] !== undefined
    ? unwrapSingleFetchResult(results[routeId], routeId)
    : null;
}

function unwrapSingleFetchResult(result: SingleFetchResult, routeId: string) {
  if ("error" in result) {
    throw result.error;
  } else if ("redirect" in result) {
    let headers: Record<string, string> = {};
    if (result.revalidate) {
      headers["X-Remix-Revalidate"] = "yes";
    }
    if (result.reload) {
      headers["X-Remix-Reload-Document"] = "yes";
    }
    if (result.replace) {
      headers["X-Remix-Replace"] = "yes";
    }
    throw redirect(result.redirect, { status: result.status, headers });
  } else if ("data" in result) {
    return result.data;
  } else {
    throw new Error(`No response found for routeId "${routeId}"`);
  }
}

function createDeferred<T = unknown>() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise<T>((res, rej) => {
    resolve = async (val: T) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: Error) => {
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
