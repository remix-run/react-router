import * as React from "react";
import { RouterProvider } from "./components";
import type { DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createBrowserHistory } from "./router/history";
import { type Router, createRouter } from "./router/router";
import type { ServerPayload, ServerRouteManifest } from "./server";
import { RouteWrapper } from "./server.static";

export type DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => Promise<ServerPayload>;

declare global {
  interface Window {
    __router: Router;
  }
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

  return (window.__router = createRouter({
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

      let lastMatch: ServerRouteManifest | undefined;
      for (const match of payload.matches) {
        patch(lastMatch?.id ?? null, [createRouteFromServerManifest(match)]);
        lastMatch = match;
      }
    },
    async dataStrategy({ matches, request }) {
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

      let lastMatch: ServerRouteManifest | undefined;
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

            return [match.route.id, result];
          })
        )),
      ]);

      return res;
    },
  }).initialize());
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
  match: ServerRouteManifest
): DataRouteObject & {
  rendered: { Component: any; element: any; Layout: any };
} {
  return {
    id: match.id,
    action: match.hasAction || !!match.clientAction,
    rendered: {
      Component: match.Component,
      element: match.element,
      Layout: match.Layout,
    },
    element: <RouteWrapper id={match.id} />,
    errorElement: match.ErrorBoundary ? <match.ErrorBoundary /> : undefined,
    handle: match.handle,
    hasErrorBoundary: !!match.ErrorBoundary,
    HydrateFallback: match.HydrateFallback,
    index: match.index,
    loader: match.hasLoader || !!match.clientLoader,
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
  };
}
