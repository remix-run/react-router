"use client";

// @ts-expect-error - no types yet
import { createFromReadableStream } from "@jacob-ebey/react-server-dom-vite/client";
import * as React from "react";

import * as rr from "./index";

// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

export const Outlet = rr.Outlet;
export const Route = rr.Route;

declare const BROWSER_ENVIRONMENT: boolean;

export type RouteManifest = {
  id: string;
  index?: boolean;
  path?: string;
  clientModule?: string;
  hasAction?: boolean;
  hasClientAction?: boolean;
  hasClientLoader?: boolean;
  hasLoader?: boolean;
  children?: RouteManifest[];
};

export type RoutesManifest = RouteManifest[];

export function isReactRouterDataRequest(url: URL) {
  return url.pathname.endsWith(".data");
}

export function UNSAFE_ClientRouter({
  loaderData,
  rendered,
  routesManifest,
  url,
}: {
  loaderData: Record<string, unknown>;
  rendered: Record<string, React.ReactNode>;
  routesManifest: RoutesManifest;
  url: string;
}) {
  const renderedRef = React.useRef(rendered);
  renderedRef.current = rendered;

  const routes = React.useMemo(() => {
    const createRoutesRecursive = (
      manifest: RoutesManifest,
      routes: rr.RouteObject[]
    ) => {
      for (const entry of manifest) {
        const route: rr.RouteObject = entry.index
          ? {
              id: entry.id,
              index: entry.index,
              path: entry.path,
              element: React.createElement(() => {
                const location = rr.useLocation();

                return (
                  <React.Fragment key={location.key}>
                    {renderedRef.current[entry.id]}
                  </React.Fragment>
                );
              }),
              action: entry.hasClientAction || entry.hasAction,
              loader: entry.hasClientLoader || entry.hasLoader,
            }
          : {
              id: entry.id,
              path: entry.path,
              element: React.createElement(() => {
                return renderedRef.current[entry.id];
              }),
              children: entry.children
                ? createRoutesRecursive(entry.children, [])
                : undefined,
              action: entry.hasClientAction || entry.hasAction,
              loader: entry.hasClientLoader || entry.hasLoader,
            };
        routes.push(route);
      }
      return routes;
    };

    const routes = createRoutesRecursive(routesManifest, []);
    routes.push({
      id: "___catch_all_index",
      index: true,
      loader: true,
      element: null,
    });
    routes.push({
      id: "___catch_all_",
      path: "*",
      loader: true,
      element: null,
    });
    return routes;
  }, [routesManifest]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const router = React.useMemo((): rr.DataRouter => {
    if (BROWSER_ENVIRONMENT) {
      return rr.createBrowserRouter(routes, {
        hydrationData: {
          actionData: null,
          errors: null,
          loaderData,
        },
        dataStrategy({ request, matches, fetcherKey }) {
          if (request.method !== "GET") {
            return singleFetchActionStrategy(request, matches);
          }

          // Fetcher loads are singular calls to one loader
          if (fetcherKey) {
            return singleFetchLoaderFetcherStrategy(request, matches);
          }

          // Navigational loads are more complex...
          return singleFetchLoaderNavigationStrategy(
            router,
            request,
            routesManifest,
            renderedRef,
            matches
          );
        },
      });
    }

    const fullUrl = new URL(url);
    return rr.UNSAFE_createRouter({
      history: {
        action: rr.NavigationType.Push,
        createHref(to) {
          const r = new URL(
            typeof to === "string" ? to : rr.createPath(to),
            url
          );
          return r.pathname + r.search;
        },
        createURL(to) {
          return new URL(typeof to === "string" ? to : rr.createPath(to), url);
        },
        encodeLocation(to) {
          return new URL(typeof to === "string" ? to : rr.createPath(to), url);
        },
        go() {
          throw new Error("Can not go before hydration");
        },
        listen() {
          throw new Error("Can not listen before hydration");
        },
        location: {
          hash: "",
          key: "default",
          pathname: fullUrl.pathname,
          search: fullUrl.search,
          state: null,
        },
        push() {
          throw new Error("Can not push before hydration");
        },
        replace() {
          throw new Error("Can not replace before hydration");
        },
      },
      hydrationData: {
        actionData: null,
        errors: null,
        loaderData,
      },
      routes,
    });
  }, [routes]);

  return <rr.RouterProvider router={router} />;
}

function singleFetchActionStrategy(
  request: Request,
  matches: rr.DataStrategyMatch[]
): never {
  throw new Error("Not implemented");
}

async function singleFetchLoaderFetcherStrategy(
  request: Request,
  matches: rr.DataStrategyMatch[]
) {
  const fetcherMatch = matches.find((m) => m.shouldLoad);
  if (!fetcherMatch) throw new Error("No fetcher match found");

  const result = await fetcherMatch.resolve(async (handler) => {
    const url = stripIndexParam(singleFetchUrl(request.url));
    const init = await createRequestInit(request);
    return fetchSingleLoader(url, init, fetcherMatch.route.id);
  });
  return { [fetcherMatch.route.id]: result };
}

async function singleFetchLoaderNavigationStrategy(
  router: rr.DataRouter,
  request: Request,
  routesManifest: RoutesManifest,
  renderedRef: React.MutableRefObject<Record<string, React.ReactNode>>,
  matches: rr.DataStrategyMatch[]
) {
  if (matches.some((match) => match.route.id.startsWith("___catch_all_"))) {
    // Hard reload the window at request.url
    window.location.href = request.url;

    await new Promise(() => {});
  }

  // Track which routes need a server load - in case we need to tack on a
  // `_routes` param
  const routesParams = new Set<string>();

  // We only add `_routes` when one or more routes opts out of a load via
  // `shouldRevalidate` or `clientLoader`
  let foundOptOutRoute = false;

  // Deferreds for each route so we can be sure they've all loaded via
  // `match.resolve()`, and a singular promise that can tell us all routes
  // have been resolved
  const routeDfds = matches.map(() => createDeferred<void>());
  const routesLoadedPromise = Promise.all(routeDfds.map((d) => d.promise));

  // Deferred that we'll use for the call to the server that each match can
  // await and parse out it's specific result
  const singleFetchDfd = createDeferred<RSCSingleFetchResults>();

  // Base URL and RequestInit for calls to the server
  const url = stripIndexParam(singleFetchUrl(request.url, true));
  const init = await createRequestInit(request);

  // We'll build up this results object as we loop through matches
  const results: Record<string, rr.DataStrategyResult> = {};

  const resolvePromise = Promise.all(
    matches.map(async (m, i) => {
      const deferred = routeDfds[i];
      if (!deferred) throw new Error("No deferred found");
      deferred.resolve();

      const findRouteRecursive = (
        id: string,
        manifest: RoutesManifest = routesManifest
      ): RouteManifest | null => {
        for (const entry of manifest) {
          if (entry.id === id) return entry;
          if (entry.children) {
            const found = findRouteRecursive(id, entry.children);
            if (found) return found;
          }
        }
        return null;
      };

      const manifestRoute = findRouteRecursive(m.route.id);

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
        if (
          m.route.id in router.state.loaderData &&
          manifestRoute &&
          manifestRoute.hasLoader
          // &&
          // TODO: Load module and check if it has a `shouldRevalidate` function
          // routeModules[m.route.id]?.shouldRevalidate
        ) {
          foundOptOutRoute = true;
          return;
        }
      }

      // When a route has a client loader, it opts out of the singular call and
      // calls it's server loader via `serverLoader()` using a `?_routes` param
      if (manifestRoute?.hasClientLoader) {
        if (manifestRoute.hasLoader) {
          foundOptOutRoute = true;
        }
        try {
          const result = await fetchSingleLoader(url, init, m.route.id);
          results[m.route.id] = { type: "data", result };
        } catch (e) {
          results[m.route.id] = { type: "error", result: e };
        }
        return;
      }

      // Load this route on the server if it has a loader
      if (manifestRoute?.hasLoader) {
        routesParams.add(m.route.id);
      }

      // Lump this match in with the others on a singular promise
      try {
        // const result = await handler(async () => {
        const data = await singleFetchDfd.promise;
        const result = unwrapSingleFetchResults(data, m.route.id);
        // });
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
  );

  // Wait for all routes to resolve above before we make the HTTP call
  await routesLoadedPromise;

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

    const data = await fetchAndDecode(url, init);
    const result = data.data as RSCSingleFetchResults;
    if ("rendered" in result && result.rendered) {
      if (!renderedRef.current) renderedRef.current = {};
      for (const [id, rendered] of Object.entries(result.rendered)) {
        renderedRef.current[id] = rendered;
      }
    }
    singleFetchDfd.resolve(result);
  } catch (e) {
    singleFetchDfd.reject(e as Error);
  }

  await resolvePromise;

  return results;
}

export function singleFetchUrl(reqUrl: URL | string, navigation = false) {
  const url =
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

function stripIndexParam(url: URL) {
  const indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  const indexValuesToKeep: string[] = [];
  for (const indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue);
    }
  }
  for (const toKeep of indexValuesToKeep) {
    url.searchParams.append("index", toKeep);
  }

  return url;
}

async function createRequestInit(request: Request): Promise<RequestInit> {
  const init: RequestInit = { signal: request.signal };

  if (request.method !== "GET") {
    init.method = request.method;

    const contentType = request.headers.get("Content-Type");

    // Check between word boundaries instead of startsWith() due to the last
    // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
    if (contentType && /\bapplication\/json\b/.test(contentType)) {
      init.headers = { "Content-Type": contentType };
      init.body = JSON.stringify(await request.json());
    } else if (contentType && /\btext\/plain\b/.test(contentType)) {
      init.headers = { "Content-Type": contentType };
      init.body = await request.text();
    } else if (
      contentType &&
      /\bapplication\/x-www-form-urlencoded\b/.test(contentType)
    ) {
      init.body = new URLSearchParams(await request.text());
    } else {
      init.body = await request.formData();
    }
  }

  return init;
}

async function fetchSingleLoader(url: URL, init: RequestInit, routeId: string) {
  // return handler(async () => {
  const singleLoaderUrl = new URL(url);
  singleLoaderUrl.searchParams.set("_routes", routeId);
  const { data } = await fetchAndDecode(singleLoaderUrl, init);
  return unwrapSingleFetchResults(data as RSCSingleFetchResults, routeId);
  // });
}

async function fetchAndDecode(url: URL, init: RequestInit) {
  const referencePromise = import("./references.browser.js");
  const res = await fetch(url, init);

  // If this 404'd without hitting the running server (most likely in a
  // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
  if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
    throw new rr.UNSAFE_ErrorResponseImpl(404, "Not Found", true);
  }

  if (!res.body) throw new Error("No response body to decode");

  const { callServer } = await referencePromise;
  try {
    const decoded = await createFromReadableStream(res.body, manifest, {
      callServer,
    });
    return { status: res.status, data: decoded };
  } catch (e) {
    // Can't clone after consuming the body via RSC stream so we can't
    // include the body here. In an ideal world we'd look for a turbo-stream
    // content type here, or even X-Remix-Response but then folks can't
    // statically deploy their prerendered .data files to a CDN unless they can
    // tell that CDN to add special headers to those certain files - which is a
    // bit restrictive.
    throw new Error("Unable to decode RSC response");
  }
}

export type SingleFetchRedirectResult = {
  redirect: string;
  status: number;
  revalidate: boolean;
  reload: boolean;
  replace: boolean;
};

export type RSCSingleFetchResult =
  | { data: unknown }
  | { error: unknown }
  | SingleFetchRedirectResult;

export type RSCSingleFetchResults =
  | {
      data: { [key: string]: RSCSingleFetchResult };
      rendered: { [key: string]: React.ReactNode };
    }
  | {
      redirect: SingleFetchRedirectResult;
    };

function unwrapSingleFetchResults(
  results: RSCSingleFetchResults,
  routeId: string
) {
  if ("redirect" in results) {
    return unwrapSingleFetchResult(results.redirect, routeId);
  }

  return results.data[routeId] !== undefined
    ? unwrapSingleFetchResult(results.data[routeId], routeId)
    : null;
}

function unwrapSingleFetchResult(
  result: RSCSingleFetchResult,
  routeId: string
) {
  if ("error" in result) {
    throw result.error;
  }
  if ("redirect" in result) {
    const headers: Record<string, string> = {};
    if (result.revalidate) {
      headers["X-Remix-Revalidate"] = "yes";
    }
    if (result.reload) {
      headers["X-Remix-Reload-Document"] = "yes";
    }
    if (result.replace) {
      headers["X-Remix-Replace"] = "yes";
    }
    throw rr.redirect(result.redirect, { status: result.status, headers });
  }
  if ("data" in result) {
    return result.data;
  }
  throw new Error(`No response found for routeId "${routeId}"`);
}

function createDeferred<T = unknown>() {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  const promise = new Promise<T>((res, rej) => {
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
