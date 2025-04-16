import * as React from "react";

import { RouterProvider } from "./components";
import type { DataRouteMatch, DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createBrowserHistory, invariant } from "./router/history";
import type { Router as DataRouter } from "./router/router";
import { createRouter, isMutationMethod } from "./router/router";
import type {
  ServerPayload,
  RenderedRoute,
  ServerRenderPayload,
} from "./server";
import type {
  DataStrategyFunction,
  DataStrategyFunctionArgs,
  unstable_RouterContextProvider,
} from "./router/utils";
import { ErrorResponseImpl, unstable_createContext } from "./router/utils";
import type {
  DecodedSingleFetchResults,
  FetchAndDecodeFunction,
} from "./dom/ssr/single-fetch";
import {
  getSingleFetchDataStrategyImpl,
  singleFetchUrl,
  stripIndexParam,
} from "./dom/ssr/single-fetch";
import { createRequestInit } from "./dom/ssr/data";
import { getHydrationData } from "./dom/ssr/hydration";
import { shouldHydrateRouteLoader } from "./dom/ssr/routes";

export type DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => Promise<ServerPayload>;

export type EncodeActionFunction = (args: unknown[]) => Promise<BodyInit>;

declare global {
  interface Window {
    __router: DataRouter;
    __routerInitialized: boolean;
    __routerActionID: number;
  }
}

export function createCallServer({
  decode,
  encodeAction,
}: {
  decode: DecodeServerResponseFunction;
  encodeAction: EncodeActionFunction;
}) {
  let landedActionId = 0;
  return async (id: string, args: unknown[]) => {
    let actionId = (window.__routerActionID =
      (window.__routerActionID ??= 0) + 1);

    const response = await fetch(location.href, {
      body: await encodeAction(args),
      method: "POST",
      headers: {
        Accept: "text/x-component",
        "rsc-action-id": id,
      },
    });
    if (!response.body) {
      throw new Error("No response body");
    }
    const payload = await decode(response.body);

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

          let lastMatch: RenderedRoute | undefined;
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
  decode,
  payload,
}: {
  payload: ServerPayload;
  decode: DecodeServerResponseFunction;
}) {
  if (window.__router) return window.__router;

  if (payload.type !== "render") throw new Error("Invalid payload type");

  let patches = new Map<string, RenderedRoute[]>();
  payload.patches.forEach((patch) => {
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
      false
    ),
    async patchRoutesOnNavigation({ patch, path, signal }) {
      let response = await fetch(`${path}.manifest`, { signal });
      if (!response.body || response.status < 200 || response.status >= 300) {
        throw new Error("Unable to fetch new route matches from the server");
      }

      let payload = await decode(response.body);
      if (payload.type !== "manifest") {
        throw new Error("Failed to patch routes on navigation");
      }

      // Without the `allowElementMutations` flag, this will no-op if the route
      // already exists so we can just call it for all returned matches
      payload.matches.forEach((match, i) =>
        patch(payload.matches[i - 1]?.id ?? null, [
          createRouteFromServerManifest(match),
        ])
      );
      payload.patches.forEach((p) => {
        patch(p.parentId ?? null, [createRouteFromServerManifest(p)]);
      });
    },
    // FIXME: Pass `build.ssr` and `build.basename` into this function
    dataStrategy: getRSCSingleFetchDataStrategy(
      () => window.__router,
      true,
      undefined,
      decode
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

  let lastLocationKey = window.__router.state.location.key;
  window.__router.subscribe(({ location }) => {
    if (location.key !== lastLocationKey) {
      window.__routerActionID = (window.__routerActionID ??= 0) + 1;
    }
  });

  return window.__router;
}

const renderedRoutesContext = unstable_createContext<RenderedRoute[]>();

export function getRSCSingleFetchDataStrategy(
  getRouter: () => DataRouter,
  ssr: boolean,
  basename: string | undefined,
  decode: DecodeServerResponseFunction
): DataStrategyFunction {
  // create map
  let dataStrategy = getSingleFetchDataStrategyImpl(
    getRouter,
    (match: DataRouteMatch) => {
      // TODO: Clean this up with a shared type
      let M = match as DataRouteMatch & {
        route: DataRouteObject & {
          hasLoader: boolean;
          hasClientLoader: boolean;
          hasAction: boolean;
          hasClientAction: boolean;
          hasShouldRevalidate: boolean;
        };
      };
      return {
        hasLoader: M.route.hasLoader,
        hasClientLoader: M.route.hasClientLoader,
        hasAction: M.route.hasAction,
        hasClientAction: M.route.hasClientAction,
        hasShouldRevalidate: M.route.hasShouldRevalidate,
      };
    },
    // pass map into fetchAndDecode so it can add payloads
    getFetchAndDecodeViaRSC(decode),
    ssr,
    basename
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
      const renderedRouteById = new Map(
        context.get(renderedRoutesContext).map((r) => [r.id, r])
      );
      for (const match of args.matches) {
        const rendered = renderedRouteById.get(match.route.id);
        if (rendered) {
          window.__router.patchRoutes(
            rendered.parentId ?? null,
            [createRouteFromServerManifest(rendered)],
            true
          );
        }
      }
      return results;
    });
}

function getFetchAndDecodeViaRSC(
  decode: DecodeServerResponseFunction
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

    let res = await fetch(url, await createRequestInit(request));

    // If this 404'd without hitting the running server (most likely in a
    // pre-rendered app using a CDN), then bubble a standard 404 ErrorResponse
    if (res.status === 404 && !res.headers.has("X-Remix-Response")) {
      throw new ErrorResponseImpl(404, "Not Found", true);
    }

    invariant(res.body, "No response body to decode");

    try {
      const payload = await decode(res.body);
      if (payload.type === "redirect") {
        return {
          status: res.status,
          data: {
            redirect: {
              redirect: payload.location,
              reload: false,
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

export function ServerBrowserRouter({
  decode,
  payload,
}: {
  decode: DecodeServerResponseFunction;
  payload: ServerPayload;
}) {
  if (payload.type !== "render") throw new Error("Invalid payload type");

  let router = React.useMemo(
    () => createRouterFromPayload({ decode, payload }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  React.useLayoutEffect(() => {
    // If we had to run clientLoaders on hydration, we delay initialization until
    // after we've hydrated to avoid hydration issues from synchronous client loaders
    if (!window.__routerInitialized) {
      window.__routerInitialized = true;
      window.__router.initialize();
    }
  }, []);

  const frameworkContext: FrameworkContextObject = {
    future: {
      // TODO: Update these
      unstable_middleware: false,
      unstable_subResourceIntegrity: false,
    },
    isSpaMode: true,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {
        // root: {
        //   css: []
        // },
      },
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: [],
      },
    },
    routeModules: {},
  };

  return (
    <FrameworkContext.Provider value={frameworkContext}>
      <RouterProvider router={router} />
    </FrameworkContext.Provider>
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
  match: RenderedRoute,
  payload?: ServerRenderPayload
): DataRouteObjectWithManifestInfo {
  let hasInitialData = payload && match.id in payload.loaderData;
  let initialData = payload?.loaderData[match.id];
  let hasInitialError = payload?.errors && match.id in payload.errors;
  let initialError = payload?.errors?.[match.id];
  let isHydrationRequest =
    match.clientLoader?.hydrate === true || !match.hasLoader;

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
      : undefined,
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
