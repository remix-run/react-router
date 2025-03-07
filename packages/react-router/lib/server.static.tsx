import * as React from "react";
import type { DataRouteObject } from "./context";
import { FrameworkContext } from "./dom/ssr/components";
import type { FrameworkContextObject } from "./dom/ssr/entry";
import { createStaticRouter, StaticRouterProvider } from "./dom/server";
import type { ServerPayload } from "./server";

export function RouteWrapper({
  Component,
  Layout,
}: {
  Component?: React.ComponentType<any>;
  Layout?: React.ComponentType<any>;
}) {
  return Layout ? (
    <Layout>{Component ? <Component /> : null}</Layout>
  ) : Component ? (
    <Component />
  ) : null;
}

export function ServerStaticRouter({ payload }: { payload: ServerPayload }) {
  if (payload.type !== "render") return null;

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
        element: match.element ?? (
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
    }, [] as DataRouteObject[]),
    context
  );

  const frameworkContext: FrameworkContextObject = {
    future: {},
    isSpaMode: false,
    ssr: false,
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
      <StaticRouterProvider
        context={context}
        router={router}
        hydrate={false}
        nonce={payload.nonce}
      />
    </FrameworkContext.Provider>
  );
}
