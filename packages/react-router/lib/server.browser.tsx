import * as React from "react";

import { RouterProvider } from "./components";
import type { DataRouteMatch, DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createBrowserHistory, invariant } from "./router/history";
import type { Router as DataRouter } from "./router/router";
import { createRouter, isMutationMethod } from "./router/router";
import type { ServerPayload, RenderedRoute } from "./server";
import { ErrorResponseImpl, type DataStrategyFunction } from "./router/utils";
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

export type DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => Promise<ServerPayload>;

export type EncodeActionFunction = (args: unknown[]) => Promise<BodyInit>;

declare global {
  interface Window {
    __router: DataRouter;
    __routerInitPromise?: Promise<void>;
  }
}

export function createCallServer({
  decode,
  encodeAction,
}: {
  decode: DecodeServerResponseFunction;
  encodeAction: EncodeActionFunction;
}) {
  let actionCounter = 0;
  let landedActionId: number = 0;

  return async (id: string, args: unknown[]) => {
    let actionId = ++actionCounter;
    const locationKey = window.__router.state.loaderData;

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
        const rendered = await payload.rerender;
        if (!rendered) return;
        if (
          actionId > landedActionId &&
          locationKey === window.__router.state.loaderData
        ) {
          landedActionId = actionId;
          let lastMatch: RenderedRoute | undefined;
          for (const match of rendered.matches) {
            window.__router.patchRoutes(lastMatch?.id ?? null, [
              createRouteFromServerManifest(match),
            ]);
            lastMatch = match;
          }

          React.startTransition(() => {
            window.__router._internalSetStateDoNotUseOrYouWillBreakYourApp({
              actionData: Object.assign(
                {},
                window.__router.state.actionData,
                rendered.actionData
              ),
              loaderData: Object.assign(
                {},
                window.__router.state.loaderData,
                rendered.loaderData
              ),
              errors: rendered.errors
                ? Object.assign(
                    {},
                    window.__router.state.errors,
                    rendered.errors
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

  let routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = createRouteFromServerManifest(match);
    if (previous.length > 0) {
      route.children = previous;
    }
    return [route];
  }, [] as DataRouteObject[]);

  window.__router = createRouter({
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: {
      actionData: payload.actionData,
      errors: payload.errors,
      loaderData: payload.loaderData,
    },
    routes,
    async patchRoutesOnNavigation({ patch, path, signal }) {
      const response = await fetch(`${path}.manifest`, { signal });
      if (!response.body || response.status < 200 || response.status >= 300) {
        return;
      }
      const payload = await decode(response.body);
      if (payload.type !== "manifest") {
        throw new Error("Failed to patch routes on navigation");
      }

      let lastMatch: RenderedRoute | undefined;
      for (const match of payload.matches) {
        patch(lastMatch?.id ?? null, [createRouteFromServerManifest(match)]);
        lastMatch = match;
      }
    },
    // FIXME: Pass `build.ssr` and `build.basename` into this function
    dataStrategy: getRSCSingleFetchDataStrategy(
      () => window.__router,
      true,
      undefined,
      decode
    ),
  }).initialize();

  if (!window.__router.state.initialized) {
    window.__routerInitPromise = new Promise((resolve) => {
      const unsubscribe = window.__router.subscribe((state) => {
        if (state.initialized) {
          window.__routerInitPromise = undefined;
          unsubscribe();
          resolve();
        }
      });
    });
  }

  return window.__router;
}

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
  return async (args) => args.unstable_runClientMiddleware(dataStrategy);
  // return async (args) => args.unstable_runClientMiddleware(async () => {
  //   let results = await dataStrategy()
  //   // patch into router from all payloads in map
  //   return results;
  // });
}

function getFetchAndDecodeViaRSC(
  decode: DecodeServerResponseFunction
): FetchAndDecodeFunction {
  return async (
    request: Request,
    basename: string | undefined,
    targetRoutes?: string[]
  ) => {
    //
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
      if (payload.type !== "render") {
        throw new Error("Unexpected payload type");
      }

      let lastMatch: RenderedRoute | undefined;
      for (const match of payload.matches) {
        // TODO: We can't do this per-request here because when clientLoaders
        // come into play we'll have filtered matches coming back on the payloads.
        //
        // TODO: Don't blow away prior routes
        window.__router.patchRoutes(lastMatch?.id ?? null, [
          createRouteFromServerManifest(match),
        ]);
        lastMatch = match;
      }

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

  if (window.__routerInitPromise) {
    throw window.__routerInitPromise;
  }

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

function createRouteFromServerManifest(
  match: RenderedRoute
): DataRouteObject & {
  hasLoader: boolean;
  hasClientLoader: boolean;
  hasAction: boolean;
  hasClientAction: boolean;
  hasShouldRevalidate: boolean;
} {
  return {
    id: match.id,
    action: match.hasAction || !!match.clientAction,
    element: match.element,
    errorElement: match.errorElement,
    handle: match.handle,
    hasErrorBoundary: match.hasErrorBoundary,
    hydrateFallbackElement: match.hydrateFallbackElement,
    index: match.index,
    loader:
      // prettier-ignore
      match.clientLoader ? (args, singleFetch) => {
        return match.clientLoader!({
          ...args,
          async serverLoader() {
            invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
            return singleFetch();
          },
        });
      } :
      match.hasLoader ? (args, singleFetch) => {
        invariant(typeof singleFetch === "function", "Invalid singleFetch parameter");
        return singleFetch();
      } :
      undefined,
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
    hasLoader: match.hasLoader,
    hasClientLoader: match.clientLoader != null,
    hasAction: match.hasAction,
    hasClientAction: match.clientAction != null,
    hasShouldRevalidate: match.shouldRevalidate != null,
  };
}
