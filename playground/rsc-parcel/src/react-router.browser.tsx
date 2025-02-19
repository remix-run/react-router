import {
  UNSAFE_createRouter,
  RouterProvider,
  type DataRouteObject,
  UNSAFE_createBrowserHistory,
} from "react-router";

import type { ServerPayload } from "react-router";

export function BrowserRouter({ payload }: { payload: ServerPayload }) {
  const routes = payload.matches.reduceRight((previous, match) => {
    const route: DataRouteObject = {
      id: match.id,
      action: match.hasAction || !!match.clientAction,
      Component: match.Component,
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

  const router = UNSAFE_createRouter({
    basename: payload.basename,
    history: UNSAFE_createBrowserHistory(),
    hydrationData: {
      actionData: payload.actionData,
      errors: payload.errors,
      loaderData: payload.loaderData,
    },
    routes: routes,
  });

  return <RouterProvider router={router} />;
}
