import * as React from "react";
import type {
  RevalidationState,
  Router as RemixRouter,
  StaticHandlerContext,
} from "@remix-run/router";
import {
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  Action,
  invariant,
  UNSAFE_convertRoutesToDataRoutes as convertRoutesToDataRoutes,
} from "@remix-run/router";
import type { Location, RouteObject, To } from "react-router-dom";
import { Routes } from "react-router-dom";
import {
  createPath,
  parsePath,
  Router,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_DataStaticRouterContext as DataStaticRouterContext,
} from "react-router-dom";

export interface StaticRouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
}

/**
 * A <Router> that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function StaticRouter({
  basename,
  children,
  location: locationProp = "/",
}: StaticRouterProps) {
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }

  let action = Action.Pop;
  let location: Location = {
    pathname: locationProp.pathname || "/",
    search: locationProp.search || "",
    hash: locationProp.hash || "",
    state: locationProp.state || null,
    key: locationProp.key || "default",
  };

  let staticNavigator = getStatelessNavigator();
  return (
    <Router
      basename={basename}
      children={children}
      location={location}
      navigationType={action}
      navigator={staticNavigator}
      static={true}
    />
  );
}

export interface StaticRouterProviderProps {
  basename?: string;
  context: StaticHandlerContext;
  router: RemixRouter;
  hydrate?: boolean;
  nonce?: string;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function unstable_StaticRouterProvider({
  basename,
  context,
  router,
  hydrate = true,
  nonce,
}: StaticRouterProviderProps) {
  invariant(
    router && context,
    "You must provide `router` and `context` to <StaticRouterProvider>"
  );

  let dataRouterContext = {
    router,
    navigator: getStatelessNavigator(),
    static: true,
    basename: basename || "/",
  };

  let hydrateScript = "";

  if (hydrate !== false) {
    let data = {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: context.errors,
    };
    // Use JSON.parse here instead of embedding a raw JS object here to speed
    // up parsing on the client.  Dual-stringify is needed to ensure all quotes
    // are properly escaped in the resulting string.  See:
    //   https://v8.dev/blog/cost-of-javascript-2019#json
    let json = JSON.stringify(JSON.stringify(data));
    hydrateScript = `window.__staticRouterHydrationData = JSON.parse(${json});`;
  }

  return (
    <>
      <DataStaticRouterContext.Provider value={context}>
        <DataRouterContext.Provider value={dataRouterContext}>
          <DataRouterStateContext.Provider
            value={dataRouterContext.router.state}
          >
            <Router
              basename={dataRouterContext.basename}
              location={dataRouterContext.router.state.location}
              navigationType={dataRouterContext.router.state.historyAction}
              navigator={dataRouterContext.navigator}
            >
              <Routes />
            </Router>
          </DataRouterStateContext.Provider>
        </DataRouterContext.Provider>
      </DataStaticRouterContext.Provider>
      {hydrateScript ? (
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: hydrateScript }}
        />
      ) : null}
    </>
  );
}

function getStatelessNavigator() {
  return {
    createHref(to: To) {
      return typeof to === "string" ? to : createPath(to);
    },
    push(to: To) {
      throw new Error(
        `You cannot use navigator.push() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to: To) {
      throw new Error(
        `You cannot use navigator.replace() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`
      );
    },
    go(delta: number) {
      throw new Error(
        `You cannot use navigator.go() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${delta})\` somewhere in your app.`
      );
    },
    back() {
      throw new Error(
        `You cannot use navigator.back() on the server because it is a stateless ` +
          `environment.`
      );
    },
    forward() {
      throw new Error(
        `You cannot use navigator.forward() on the server because it is a stateless ` +
          `environment.`
      );
    },
  };
}

export function unstable_createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext
): RemixRouter {
  let dataRoutes = convertRoutesToDataRoutes(routes);
  let msg = (method: string) =>
    `You cannot use router.${method}() on the server because it is a stateless environment`;

  return {
    get basename() {
      return "/";
    },
    get state() {
      return {
        historyAction: Action.Pop,
        location: context.location,
        matches: context.matches,
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: context.errors,
        initialized: true,
        navigation: IDLE_NAVIGATION,
        restoreScrollPosition: null,
        preventScrollReset: false,
        revalidation: "idle" as RevalidationState,
        fetchers: new Map(),
      };
    },
    get routes() {
      return dataRoutes;
    },
    initialize() {
      throw msg("initialize");
    },
    subscribe() {
      throw msg("subscribe");
    },
    enableScrollRestoration() {
      throw msg("enableScrollRestoration");
    },
    navigate() {
      throw msg("navigate");
    },
    fetch() {
      throw msg("fetch");
    },
    revalidate() {
      throw msg("revalidate");
    },
    createHref() {
      throw msg("createHref");
    },
    getFetcher() {
      return IDLE_FETCHER;
    },
    deleteFetcher() {
      throw msg("deleteFetcher");
    },
    dispose() {
      throw msg("dispose");
    },
    _internalFetchControllers: new Map(),
    _internalActiveDeferreds: new Map(),
  };
}
