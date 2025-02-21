import * as React from "react";
import { RouterProvider } from "./components";
import type { DataRouteObject } from "./context";
import { createBrowserHistory } from "./router/history";
import { createRouter } from "./router/router";
import type { ServerPayload, ServerRouteManifest } from "./server";
import { RouteWrapper } from "./server.static";

export type DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => Promise<ServerPayload>;

export function ServerBrowserRouter({
  decode,
  payload,
}: {
  decode: DecodeServerResponseFunction;
  payload: ServerPayload;
}) {
  if (payload.type !== "render") return null;

  // TODO: Make this a singleton? Re-create this when the payload changes?
  // At a minimum, update the singleton with new state when the payload changes.
  const routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = createRouteFromServerManifest(match);
    if (previous.length > 0) {
      route.children = previous;
    }
    return [route];
  }, [] as DataRouteObject[]);

  const router = ((window as any).__router = createRouter({
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: {
      actionData: payload.actionData,
      errors: payload.errors,
      loaderData: payload.loaderData,
    },
    routes: routes,
    async patchRoutesOnNavigation({ patch, path, signal }) {
      const response = await fetch(`${path}.manifest`, { signal });
      if (!response.body || response.status < 200 || response.status >= 300) {
        return;
      }
      const payload = await decode(response.body);
      if (payload.type !== "manifest") {
        console.error("Failed to patch routes on navigation");
        return;
      }

      let lastMatch: ServerRouteManifest | undefined;
      for (const match of payload.matches) {
        patch(lastMatch?.id ?? null, [createRouteFromServerManifest(match)]);
        lastMatch = match;
      }
    },
    async dataStrategy({ matches, request }) {
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
        router.patchRoutes(lastMatch?.id ?? null, [
          createRouteFromServerManifest(match),
        ]);
        lastMatch = match;
      }

      const dataKey =
        request.method === "GET" || request.method === "HEAD"
          ? "loaderData"
          : "actionData";
      return Object.fromEntries(
        Object.entries(payload[dataKey] ?? {}).map(([key, value]) => [
          key,
          {
            type: "data",
            result: value,
          },
        ])
      );
    },
  }));

  return <RouterProvider router={router} />;
}

function createRouteFromServerManifest(
  match: ServerRouteManifest
): DataRouteObject {
  return {
    id: match.id,
    action: match.hasAction || !!match.clientAction,
    element: <RouteWrapper Component={match.Component} Layout={match.Layout} />,
    ErrorBoundary: match.ErrorBoundary,
    handle: match.handle,
    hasErrorBoundary: !!match.ErrorBoundary,
    HydrateFallback: match.HydrateFallback,
    index: match.index,
    loader: match.hasLoader || !!match.clientLoader,
    path: match.path,
    shouldRevalidate: match.shouldRevalidate,
  };
}
