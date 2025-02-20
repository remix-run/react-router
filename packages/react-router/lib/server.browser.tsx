import * as React from "react";
import { RouterProvider } from "./components";
import type { DataRouteObject } from "./context";
import { createBrowserHistory } from "./router/history";
import { createRouter } from "./router/router";
import type { ServerPayload } from "./server";
import { RouteWrapper } from "./server.static";

export function ServerBrowserRouter({ payload }: { payload: ServerPayload }) {
  if (payload.type !== "render") return null;

  // TODO: Implement this
  const routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = {
      id: match.id,
      action: match.hasAction || !!match.clientAction,
      element: (
        <RouteWrapper Component={match.Component} Layout={match.Layout} />
      ),
      ErrorBoundary: match.ErrorBoundary,
      handle: match.handle,
      hasErrorBoundary: !!match.ErrorBoundary,
      HydrateFallback: match.HydrateFallback,
      index: match.index,
      loader: match.hasLoader || !!match.clientLoader,
      path: match.path,
      shouldRevalidate: match.shouldRevalidate,
    };
    if (previous.length > 0) {
      route.children = previous;
    }
    return [route];
  }, [] as DataRouteObject[]);

  const router = createRouter({
    basename: payload.basename,
    history: createBrowserHistory(),
    hydrationData: {
      actionData: payload.actionData,
      errors: payload.errors,
      loaderData: payload.loaderData,
    },
    routes: routes,
  });

  return <RouterProvider router={router} />;
}
