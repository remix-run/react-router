import {
  createStaticRouter,
  StaticRouterProvider,
  type DataRouteObject,
} from "react-router";

import type { ServerPayload } from "react-router";

export function PrerenderRouter({ payload }: { payload: ServerPayload }) {
  const context = {
    actionData: payload.actionData,
    actionHeaders: {},
    basename: payload.basename,
    errors: payload.errors,
    loaderData: payload.loaderData,
    loaderHeaders: {},
    location: payload.location,
    statusCode: 200,
    _deepestRenderedBoundaryId: payload.deepestRenderedBoundaryId,
    matches: payload.matches.map((match) => ({
      params: match.params,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      route: {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        handle: match.handle,
        hasErrorBoundary: !!match.ErrorBoundary,
        loader: match.hasLoader || !!match.clientLoader,
        index: match.index,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate,
      },
    })),
  };

  const router = createStaticRouter(
    payload.matches.reduceRight((previous, match) => {
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
    }, [] as DataRouteObject[]),
    context
  );

  return (
    <StaticRouterProvider
      context={context}
      router={router}
      hydrate={false}
      nonce={payload.nonce}
    />
  );
}
