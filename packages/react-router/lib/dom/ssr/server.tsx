import type { ReactElement } from "react";
import * as React from "react";

import { createStaticRouter, StaticRouterProvider } from "../server";
import { FrameworkContext } from "./components";
import type { EntryContext } from "./entry";
import { RemixErrorBoundary } from "./errorBoundaries";
import { createServerRoutes, shouldHydrateRouteLoader } from "./routes";
import { StreamTransfer } from "./single-fetch";

/**
 * @category Types
 */
export interface ServerRouterProps {
  /**
   * The entry context containing the manifest, route modules, and other data
   * needed for rendering.
   */
  context: EntryContext;
  /**
   * The URL of the request being handled.
   */
  url: string | URL;
  /**
   * An optional `nonce` for [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
   * compliance, used to allow inline scripts to run safely.
   */
  nonce?: string;
}

/**
 * The server entry point for a React Router app in Framework Mode. This
 * component is used to generate the HTML in the response from the server. See
 * [`entry.server.tsx`](../framework-conventions/entry.server.tsx).
 *
 * @public
 * @category Framework Routers
 * @mode framework
 * @param props Props
 * @param {ServerRouterProps.context} props.context n/a
 * @param {ServerRouterProps.nonce} props.nonce n/a
 * @param {ServerRouterProps.url} props.url n/a
 * @returns A React element that represents the server-rendered application.
 */
export function ServerRouter({
  context,
  url,
  nonce,
}: ServerRouterProps): ReactElement {
  if (typeof url === "string") {
    url = new URL(url);
  }

  let { manifest, routeModules, criticalCss, serverHandoffString } = context;
  let routes = createServerRoutes(
    manifest.routes,
    routeModules,
    context.future,
    context.isSpaMode,
  );

  // Create a shallow clone of `loaderData` we can mutate for partial hydration.
  // When a route exports a `clientLoader` and a `HydrateFallback`, we want to
  // render the fallback on the server so we clear our the `loaderData` during SSR.
  // Is it important not to change the `context` reference here since we use it
  // for context._deepestRenderedBoundaryId tracking
  context.staticHandlerContext.loaderData = {
    ...context.staticHandlerContext.loaderData,
  };
  for (let match of context.staticHandlerContext.matches) {
    let routeId = match.route.id;
    let route = routeModules[routeId];
    let manifestRoute = context.manifest.routes[routeId];
    // Clear out the loaderData to avoid rendering the route component when the
    // route opted into clientLoader hydration and either:
    // * gave us a HydrateFallback
    // * or doesn't have a server loader and we have no data to render
    if (
      route &&
      manifestRoute &&
      shouldHydrateRouteLoader(
        routeId,
        route.clientLoader,
        manifestRoute.hasLoader,
        context.isSpaMode,
      ) &&
      (route.HydrateFallback || !manifestRoute.hasLoader)
    ) {
      delete context.staticHandlerContext.loaderData[routeId];
    }
  }

  let router = createStaticRouter(routes, context.staticHandlerContext);

  return (
    <>
      <FrameworkContext.Provider
        value={{
          manifest,
          routeModules,
          criticalCss,
          serverHandoffString,
          future: context.future,
          ssr: context.ssr,
          isSpaMode: context.isSpaMode,
          routeDiscovery: context.routeDiscovery,
          serializeError: context.serializeError,
          renderMeta: context.renderMeta,
        }}
      >
        <RemixErrorBoundary location={router.state.location}>
          <StaticRouterProvider
            router={router}
            context={context.staticHandlerContext}
            hydrate={false}
          />
        </RemixErrorBoundary>
      </FrameworkContext.Provider>
      {context.serverHandoffStream ? (
        <React.Suspense>
          <StreamTransfer
            context={context}
            identifier={0}
            reader={context.serverHandoffStream.getReader()}
            textDecoder={new TextDecoder()}
            nonce={nonce}
          />
        </React.Suspense>
      ) : null}
    </>
  );
}
