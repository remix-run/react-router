import * as React from "react";

import { RouterProvider } from "./components";
import type { DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createBrowserHistory } from "./router/history";
import { type Router, createRouter } from "./router/router";
import type { ServerPayload, RenderedRoute } from "./server";

export type DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => Promise<ServerPayload>;

export type EncodeActionFunction = (args: unknown[]) => Promise<BodyInit>;

declare global {
  interface Window {
    __router: Router;
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
    async dataStrategy({ matches, request }) {
      await Promise.resolve();
      if (!window.__router) {
        throw new Error("No router");
      }

      // TODO: Implement this
      const url = new URL(request.url);
      url.pathname += ".rsc";
      const response = await fetch(url, {
        body: request.body,
        headers: request.headers,
        method: request.method,
        referrer: request.referrer,
        signal: request.signal,
      });
      if (!response.body) {
        throw new Error("No response body");
      }
      const payload = await decode(response.body);
      if (payload.type !== "render") {
        throw new Error("Unexpected payload type");
      }

      let lastMatch: RenderedRoute | undefined;
      for (const match of payload.matches) {
        window.__router.patchRoutes(lastMatch?.id ?? null, [
          createRouteFromServerManifest(match),
        ]);
        lastMatch = match;
      }

      const dataKey =
        request.method === "GET" || request.method === "HEAD"
          ? "loaderData"
          : "actionData";

      const res = Object.fromEntries([
        ...Object.entries(payload[dataKey] ?? {}).map(([id, value]) => [
          id,
          {
            type: "data",
            result: value,
          },
        ]),
        ...(await Promise.all(
          matches.map(async (match) => {
            const result = await match.resolve(async () => {
              return payload[dataKey]?.[match.route.id];
            });

            return [
              match.route.id,
              payload.errors?.[match.route.id]
                ? {
                    type: "error",
                    result: payload.errors[match.route.id],
                  }
                : result,
            ];
          })
        )),
      ]);

      return res;
    },
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

  console.log(window.__routerInitPromise);
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

function createRouteFromServerManifest(match: RenderedRoute): DataRouteObject {
  return {
    id: match.id,
    action: match.hasAction || !!match.clientAction,
    element: match.element,
    errorElement: match.errorElement,
    handle: match.handle,
    hasErrorBoundary: match.hasErrorBoundary,
    hydrateFallbackElement: match.hydrateFallbackElement,
    index: match.index,
    loader: match.hasLoader || !!match.clientLoader,
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
  };
}
