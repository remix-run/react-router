import * as React from "react";
import * as ReactDOM from "react-dom";

import { RouterProvider } from "../components";
import {
  RSCRouterContext,
  type DataRouteMatch,
  type DataRouteObject,
} from "../context";
import { FrameworkContext } from "../dom/ssr/components";
import type { FrameworkContextObject } from "../dom/ssr/entry";
import { createBrowserHistory, invariant } from "../router/history";
import type { Router as DataRouter } from "../router/router";
import { createRouter, isMutationMethod } from "../router/router";
import type {
  RSCPayload,
  RSCRouteManifest,
  RSCRenderPayload,
} from "./server.rsc";
import type {
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  unstable_RouterContextProvider,
} from "../router/utils";
import { ErrorResponseImpl, unstable_createContext } from "../router/utils";
import type {
  DecodedSingleFetchResults,
  FetchAndDecodeFunction,
} from "../dom/ssr/single-fetch";
import {
  getSingleFetchDataStrategyImpl,
  singleFetchUrl,
  stripIndexParam,
} from "../dom/ssr/single-fetch";
import { createRequestInit } from "../dom/ssr/data";
import { getHydrationData } from "../dom/ssr/hydration";
import {
  noActionDefinedError,
  shouldHydrateRouteLoader,
} from "../dom/ssr/routes";
import { RSCRouterGlobalErrorBoundary } from "./errorBoundaries";

export type BrowserCreateFromReadableStreamFunction = (
  body: ReadableStream<Uint8Array>,
  {
    temporaryReferences,
  }: {
    temporaryReferences: unknown;
  }
) => Promise<unknown>;

export type EncodeReplyFunction = (
  args: unknown[],
  options: { temporaryReferences: unknown }
) => Promise<BodyInit>;

declare global {
  interface Window {
    __router: DataRouter;
    __routerInitialized: boolean;
    __routerActionID: number;
  }
}

export function createCallServer({
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  fetch: fetchImplementation = fetch,
}: {
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  createTemporaryReferenceSet: () => unknown;
  encodeReply: EncodeReplyFunction;
  fetch?: (request: Request) => Promise<Response>;
}) {
  let landedActionId = 0;
  return async (id: string, args: unknown[]) => {
    let actionId = (window.__routerActionID =
      (window.__routerActionID ??= 0) + 1);

    const temporaryReferences = createTemporaryReferenceSet();
    const response = await fetchImplementation(
      new Request(location.href, {
        body: await encodeReply(args, { temporaryReferences }),
        method: "POST",
        headers: {
          Accept: "text/x-component",
          "rsc-action-id": id,
        },
      })
    );
    if (!response.body) {
      throw new Error("No response body");
    }
    const payload = (await createFromReadableStream(response.body, {
      temporaryReferences,
    })) as RSCPayload;

    if (payload.type === "redirect") {
      if (payload.reload) {
        window.location.href = payload.location;
        return;
      }

      window.__router.navigate(payload.location, {
        replace: payload.replace,
      });

      return payload.actionResult;
    }

    if (payload.type !== "action") {
      throw new Error("Unexpected payload type");
    }

    if (payload.rerender) {
      (async () => {
        const rerender = await payload.rerender;
        if (!rerender) return;

        if (landedActionId < actionId && window.__routerActionID <= actionId) {
          landedActionId = actionId;

          if (rerender.type === "redirect") {
            if (rerender.reload) {
              window.location.href = rerender.location;
              return;
            }
            window.__router.navigate(rerender.location, {
              replace: rerender.replace,
            });
            return;
          }

          let lastMatch: RSCRouteManifest | undefined;
          for (const match of rerender.matches) {
            window.__router.patchRoutes(
              lastMatch?.id ?? null,
              [createRouteFromServerManifest(match)],
              true
            );
            lastMatch = match;
          }
          window.__router._internalSetStateDoNotUseOrYouWillBreakYourApp({});

          React.startTransition(() => {
            window.__router._internalSetStateDoNotUseOrYouWillBreakYourApp({
              loaderData: Object.assign(
                {},
                window.__router.state.loaderData,
                rerender.loaderData
              ),
              errors: rerender.errors
                ? Object.assign(
                    {},
                    window.__router.state.errors,
                    rerender.errors
                  )
                : null,
            });
          });
        }
      })();
    }

    return payload.actionResult;
  };
}

function createRouterFromPayload({
  fetchImplementation,
  createFromReadableStream,
  payload,
}: {
  payload: RSCPayload;
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  fetchImplementation: (request: Request) => Promise<Response>;
}) {
  if (window.__router) return window.__router;

  if (payload.type !== "render") throw new Error("Invalid payload type");

  let patches = new Map<string, RSCRouteManifest[]>();
  payload.patches?.forEach((patch) => {
    invariant(patch.parentId, "Invalid patch parentId");
    if (!patches.has(patch.parentId)) {
      patches.set(patch.parentId, []);
    }
    patches.get(patch.parentId)?.push(patch);
  });
  let routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = createRouteFromServerManifest(
      match,
      payload
    );
    if (previous.length > 0) {
      route.children = previous;
      let childrenToPatch = patches.get(match.id);
      if (childrenToPatch) {
        route.children.push(
          ...childrenToPatch.map((r) => createRouteFromServerManifest(r))
        );
      }
    }
    return [route];
  }, [] as DataRouteObject[]);

  window.__router = createRouter({
    routes,
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: getHydrationData(
      {
        loaderData: payload.loaderData,
        actionData: payload.actionData,
        errors: payload.errors,
      },
      routes,
      (routeId) => {
        let match = payload.matches.find((m) => m.id === routeId);
        invariant(match, "Route not found in payload");
        return {
          clientLoader: match.clientLoader,
          hasLoader: match.hasLoader,
          hasHydrateFallback: match.hydrateFallbackElement != null,
        };
      },
      payload.location,
      undefined,
      false
    ),
    async patchRoutesOnNavigation({ path, signal }) {
      if (discoveredPaths.has(path)) {
        return;
      }
      await fetchAndApplyManifestPatches(
        [path],
        createFromReadableStream,
        fetchImplementation,
        signal
      );
    },
    // FIXME: Pass `build.ssr` and `build.basename` into this function
    dataStrategy: getRSCSingleFetchDataStrategy(
      () => window.__router,
      true,
      undefined,
      createFromReadableStream,
      fetchImplementation
    ),
  });

  // We can call initialize() immediately if the router doesn't have any
  // loaders to run on hydration
  if (window.__router.state.initialized) {
    window.__routerInitialized = true;
    window.__router.initialize();
  } else {
    window.__routerInitialized = false;
  }

  let lastLoaderData: unknown = undefined;
  window.__router.subscribe(({ loaderData, actionData }) => {
    if (lastLoaderData !== loaderData) {
      window.__routerActionID = (window.__routerActionID ??= 0) + 1;
    }
  });

  return window.__router;
}

const renderedRoutesContext = unstable_createContext<RSCRouteManifest[]>();

export function getRSCSingleFetchDataStrategy(
  getRouter: () => DataRouter,
  ssr: boolean,
  basename: string | undefined,
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>
): DataStrategyFunction {
  // TODO: Clean this up with a shared type
  type RSCDataRouteMatch = DataRouteMatch & {
    route: DataRouteObject & {
      hasLoader: boolean;
      hasClientLoader: boolean;
      hasComponent: boolean;
      hasAction: boolean;
      hasClientAction: boolean;
      hasShouldRevalidate: boolean;
    };
  };

  // create map
  let dataStrategy = getSingleFetchDataStrategyImpl(
    getRouter,
    (match) => {
      let M = match as RSCDataRouteMatch;
      return {
        hasLoader: M.route.hasLoader,
        hasClientLoader: M.route.hasClientLoader,
        hasComponent: M.route.hasComponent,
        hasAction: M.route.hasAction,
        hasClientAction: M.route.hasClientAction,
        hasShouldRevalidate: M.route.hasShouldRevalidate,
      };
    },
    // pass map into fetchAndDecode so it can add payloads
    getFetchAndDecodeViaRSC(createFromReadableStream, fetchImplementation),
    ssr,
    basename,
    // If the route has a component but we don't have an element, we need to hit
    // the server loader flow regardless of whether the client loader calls
    // `serverLoader` or not, otherwise we'll have nothing to render.
    (match) => {
      let M = match as RSCDataRouteMatch;
      return M.route.hasComponent && !M.route.element;
    }
  );
  return async (args) =>
    args.unstable_runClientMiddleware(async () => {
      // Before we run the dataStrategy, create a place to stick rendered routes
      // from the payload so we can patch them into the router after all loaders
      // have completed.  Need to do this since we may have multiple fetch
      // requests returning multiple server payloads (due to clientLoaders, fine
      // grained revalidation, etc.).  This lets us stitch them all together and
      // patch them all at the end
      // This cast should be fine since this is always run client side and
      // `context` is always of this type on the client -- unlike on the server
      // in framework mode when it could be `AppLoadContext`
      let context = args.context as unstable_RouterContextProvider;
      context.set(renderedRoutesContext, []);
      let results = await dataStrategy(args);
      // patch into router from all payloads in map
      // TODO: Confirm that it's correct for us to have multiple rendered routes
      // with the same ID. This is currently happening in `clientLoader` cases
      // where we're calling `fetchAndDecode` multiple times. This may be a
      // sign of a logical error in how we're handling client loader routes.
      const renderedRoutesById = new Map<string, RSCRouteManifest[]>();
      for (const route of context.get(renderedRoutesContext)) {
        if (!renderedRoutesById.has(route.id)) {
          renderedRoutesById.set(route.id, []);
        }
        renderedRoutesById.get(route.id)!.push(route);
      }
      for (const match of args.matches) {
        const renderedRoutes = renderedRoutesById.get(match.route.id);
        if (renderedRoutes) {
          for (const rendered of renderedRoutes) {
            window.__router.patchRoutes(
              rendered.parentId ?? null,
              [createRouteFromServerManifest(rendered)],
              true
            );
          }
        }
      }
      return results;
    });
}

function getFetchAndDecodeViaRSC(
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>
): FetchAndDecodeFunction {
  return async (
    args: DataStrategyFunctionArgs<unknown>,
    basename: string | undefined,
    targetRoutes?: string[]
  ) => {
    let { request, context } = args;
    let url = singleFetchUrl(request.url, basename, "rsc");
    if (request.method === "GET") {
      url = stripIndexParam(url);
      if (targetRoutes) {
        url.searchParams.set("_routes", targetRoutes.join(","));
      }
    }

    let res = await fetchImplementation(
      new Request(url, await createRequestInit(request))
    );

    // If this 404'd without hitting the running server (most likely in a
    // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
    if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
      throw new ErrorResponseImpl(404, "Not Found", true);
    }

    invariant(res.body, "No response body to decode");

    try {
      const payload = (await createFromReadableStream(res.body, {
        temporaryReferences: undefined,
      })) as RSCPayload;
      if (payload.type === "redirect") {
        return {
          status: res.status,
          data: {
            redirect: {
              redirect: payload.location,
              reload: payload.reload,
              replace: payload.replace,
              revalidate: false,
              status: payload.status,
            },
          },
        };
      }

      if (payload.type !== "render") {
        throw new Error("Unexpected payload type");
      }

      // Track routes rendered per-single-fetch call so we can gather them up
      // and patch them in together at the end.  This cast should be fine since
      // this is always run client side and `context` is always of this type on
      // the client -- unlike on the server in framework mode when it could be
      // `AppLoadContext`
      (context as unstable_RouterContextProvider)
        .get(renderedRoutesContext)
        .push(...payload.matches);

      let results: DecodedSingleFetchResults = { routes: {} };
      const dataKey = isMutationMethod(request.method)
        ? "actionData"
        : "loaderData";
      for (let [routeId, data] of Object.entries(payload[dataKey] || {})) {
        results.routes[routeId] = { data };
      }
      if (payload.errors) {
        for (let [routeId, error] of Object.entries(payload.errors)) {
          results.routes[routeId] = { error };
        }
      }
      return { status: res.status, data: results };
    } catch (e) {
      // Can't clone after consuming the body via decode so we can't include the
      // body here.  In an ideal world we'd look for an RSC  content type here,
      // or even X-Remix-Response but then folks can't statically deploy their
      // prerendered .rsc files to a CDN unless they can tell that CDN to add
      // special headers to those certain files - which is a bit restrictive.
      throw new Error("Unable to decode RSC response");
    }
  };
}

export function RSCHydratedRouter({
  createFromReadableStream,
  fetch: fetchImplementation = fetch,
  payload,
  routeDiscovery = "eager",
}: {
  createFromReadableStream: BrowserCreateFromReadableStreamFunction;
  fetch?: (request: Request) => Promise<Response>;
  payload: RSCPayload;
  routeDiscovery?: "eager" | "lazy";
}) {
  if (payload.type !== "render") throw new Error("Invalid payload type");

  let router = React.useMemo(
    () =>
      createRouterFromPayload({
        payload,
        fetchImplementation,
        createFromReadableStream,
      }),
    [createFromReadableStream, payload, fetchImplementation]
  );

  React.useLayoutEffect(() => {
    // If we had to run clientLoaders on hydration, we delay initialization until
    // after we've hydrated to avoid hydration issues from synchronous client loaders
    if (!window.__routerInitialized) {
      window.__routerInitialized = true;
      window.__router.initialize();
    }
  }, []);

  let [location, setLocation] = React.useState(router.state.location);

  React.useLayoutEffect(
    () =>
      router.subscribe((newState) => {
        if (newState.location !== location) {
          setLocation(newState.location);
        }
      }),
    [router, location]
  );

  React.useEffect(() => {
    if (
      routeDiscovery === "lazy" ||
      // @ts-expect-error - TS doesn't know about this yet
      window.navigator?.connection?.saveData === true
    ) {
      return;
    }

    // Register a link href for patching
    function registerElement(el: Element) {
      let path =
        el.tagName === "FORM"
          ? el.getAttribute("action")
          : el.getAttribute("href");
      if (!path) {
        return;
      }
      // optimization: use the already-parsed pathname from links
      let pathname =
        el.tagName === "A"
          ? (el as HTMLAnchorElement).pathname
          : new URL(path, window.location.origin).pathname;
      if (!discoveredPaths.has(pathname)) {
        nextPaths.add(pathname);
      }
    }

    // Register and fetch patches for all initially-rendered links/forms
    async function fetchPatches() {
      // re-check/update registered links
      document
        .querySelectorAll("a[data-discover], form[data-discover]")
        .forEach(registerElement);

      let paths = Array.from(nextPaths.keys()).filter((path) => {
        if (discoveredPaths.has(path)) {
          nextPaths.delete(path);
          return false;
        }
        return true;
      });

      if (paths.length === 0) {
        return;
      }

      try {
        await fetchAndApplyManifestPatches(
          paths,
          createFromReadableStream,
          fetchImplementation
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }

    let debouncedFetchPatches = debounce(fetchPatches, 100);

    // scan and fetch initial links
    fetchPatches();

    let observer = new MutationObserver(() => debouncedFetchPatches());

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href", "action"],
    });
  }, [routeDiscovery, createFromReadableStream, fetchImplementation]);

  const frameworkContext: FrameworkContextObject = {
    future: {
      // These flags have no runtime impact so can always be false.  If we add
      // flags that drive runtime behavior they'll need to be proxied through.
      unstable_middleware: false,
      unstable_subResourceIntegrity: false,
    },
    isSpaMode: true,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {},
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: [],
      },
    },
    routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
    routeModules: {},
  };

  return (
    <RSCRouterContext.Provider value={true}>
      <RSCRouterGlobalErrorBoundary location={location}>
        <FrameworkContext.Provider value={frameworkContext}>
          <RouterProvider router={router} flushSync={ReactDOM.flushSync} />
        </FrameworkContext.Provider>
      </RSCRouterGlobalErrorBoundary>
    </RSCRouterContext.Provider>
  );
}

type DataRouteObjectWithManifestInfo = DataRouteObject & {
  hasLoader: boolean;
  hasClientLoader: boolean;
  hasAction: boolean;
  hasClientAction: boolean;
  hasShouldRevalidate: boolean;
};

function createRouteFromServerManifest(
  match: RSCRouteManifest,
  payload?: RSCRenderPayload
): DataRouteObjectWithManifestInfo {
  let hasInitialData = payload && match.id in payload.loaderData;
  let initialData = payload?.loaderData[match.id];
  let hasInitialError = payload?.errors && match.id in payload.errors;
  let initialError = payload?.errors?.[match.id];
  let isHydrationRequest =
    match.clientLoader?.hydrate === true ||
    !match.hasLoader ||
    // If the route has a component but we don't have an element, we need to hit
    // the server loader flow regardless of whether the client loader calls
    // `serverLoader` or not, otherwise we'll have nothing to render.
    (match.hasComponent && !match.element);

  let dataRoute: DataRouteObjectWithManifestInfo = {
    id: match.id,
    element: match.element,
    errorElement: match.errorElement,
    handle: match.handle,
    hasErrorBoundary: match.hasErrorBoundary,
    hydrateFallbackElement: match.hydrateFallbackElement,
    index: match.index,
    loader: match.clientLoader
      ? async (args, singleFetch) => {
          try {
            let result = await match.clientLoader!({
              ...args,
              serverLoader: () => {
                preventInvalidServerHandlerCall(
                  "loader",
                  match.id,
                  match.hasLoader
                );
                // On the first call, resolve with the server result
                if (isHydrationRequest) {
                  if (hasInitialData) {
                    return initialData;
                  }
                  if (hasInitialError) {
                    throw initialError;
                  }
                }
                return callSingleFetch(singleFetch);
              },
            });
            return result;
          } finally {
            isHydrationRequest = false;
          }
        }
      : // We always make the call in this RSC world since even if we don't
        // have a `loader` we may need to get the `element` implementation
        (_, singleFetch) => callSingleFetch(singleFetch),
    action: match.clientAction
      ? (args, singleFetch) =>
          match.clientAction!({
            ...args,
            serverAction: async () => {
              preventInvalidServerHandlerCall(
                "loader",
                match.id,
                match.hasLoader
              );
              return await callSingleFetch(singleFetch);
            },
          })
      : match.hasAction
      ? (_, singleFetch) => callSingleFetch(singleFetch)
      : () => {
          throw noActionDefinedError("action", match.id);
        },
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
    // We always have a "loader" in this RSC world since even if we don't
    // have a `loader` we may need to get the `element` implementation
    hasLoader: true,
    hasClientLoader: match.clientLoader != null,
    hasAction: match.hasAction,
    hasClientAction: match.clientAction != null,
    hasShouldRevalidate: match.shouldRevalidate != null,
  };

  if (typeof dataRoute.loader === "function") {
    dataRoute.loader.hydrate = shouldHydrateRouteLoader(
      match.id,
      match.clientLoader,
      match.hasLoader,
      false
    );
  }

  return dataRoute;
}

function callSingleFetch(singleFetch: unknown) {
  invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
  return singleFetch();
}

function preventInvalidServerHandlerCall(
  type: "action" | "loader",
  routeId: string,
  hasHandler: boolean
) {
  if (!hasHandler) {
    let fn = type === "action" ? "serverAction()" : "serverLoader()";
    let msg =
      `You are trying to call ${fn} on a route that does not have a server ` +
      `${type} (routeId: "${routeId}")`;
    console.error(msg);
    throw new ErrorResponseImpl(400, "Bad Request", new Error(msg), true);
  }
}

// Currently rendered links that may need prefetching
const nextPaths = new Set<string>();

// FIFO queue of previously discovered routes to prevent re-calling on
// subsequent navigations to the same path
const discoveredPathsMaxSize = 1000;
const discoveredPaths = new Set<string>();

// 7.5k to come in under the ~8k limit for most browsers
// https://stackoverflow.com/a/417184
const URL_LIMIT = 7680;

function getManifestUrl(paths: string[]): URL | null {
  if (paths.length === 0) {
    return null;
  }

  if (paths.length === 1) {
    return new URL(`${paths[0]}.manifest`, window.location.origin);
  }

  let basename = (window.__router.basename ?? "").replace(/^\/|\/$/g, "");
  let url = new URL(`${basename}/.manifest`, window.location.origin);
  paths.sort().forEach((path) => url.searchParams.append("p", path));

  return url;
}

async function fetchAndApplyManifestPatches(
  paths: string[],
  createFromReadableStream: BrowserCreateFromReadableStreamFunction,
  fetchImplementation: (request: Request) => Promise<Response>,
  signal?: AbortSignal
) {
  let url = getManifestUrl(paths);
  if (url == null) {
    return;
  }

  // If the URL is nearing the ~8k limit on GET requests, skip this optimization
  // step and just let discovery happen on link click.  We also wipe out the
  // nextPaths Set here so we can start filling it with fresh links
  if (url.toString().length > URL_LIMIT) {
    nextPaths.clear();
    return;
  }

  let response = await fetchImplementation(new Request(url, { signal }));
  if (!response.body || response.status < 200 || response.status >= 300) {
    throw new Error("Unable to fetch new route matches from the server");
  }

  let payload = (await createFromReadableStream(response.body, {
    temporaryReferences: undefined,
  })) as RSCPayload;
  if (payload.type !== "manifest") {
    throw new Error("Failed to patch routes");
  }

  // Track discovered paths so we don't have to fetch them again
  paths.forEach((p) => addToFifoQueue(p, discoveredPaths));

  // Without the `allowElementMutations` flag, this will no-op if the route
  // already exists so we can just call it for all returned patches
  payload.patches.forEach((p) => {
    window.__router.patchRoutes(p.parentId ?? null, [
      createRouteFromServerManifest(p),
    ]);
  });
}

function addToFifoQueue(path: string, queue: Set<string>) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    queue.delete(first);
  }
  queue.add(path);
}

// Thanks Josh!
// https://www.joshwcomeau.com/snippets/javascript/debounce/
function debounce(callback: (...args: unknown[]) => unknown, wait: number) {
  let timeoutId: number | undefined;
  return (...args: unknown[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}
