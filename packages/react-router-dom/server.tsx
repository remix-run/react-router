import * as React from "react";
import type {
  DataRouteObject,
  RevalidationState,
  Router as DataRouter,
  RouterState,
  StaticHandlerContext,
} from "@remix-run/router";
import { IDLE_NAVIGATION, Action, invariant } from "@remix-run/router";
import {
  Location,
  To,
  createPath,
  parsePath,
  Router,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  useRoutes,
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

export interface DataStaticRouterProps {
  dataRoutes: DataRouteObject[];
  context: StaticHandlerContext;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function DataStaticRouter({
  dataRoutes,
  context,
}: DataStaticRouterProps) {
  invariant(
    dataRoutes && context,
    "You must provide `routes` and `context` to <DataStaticRouter>"
  );

  let router = getStatelessRouter(dataRoutes, context);
  return (
    <DataRouterContext.Provider value={router}>
      <DataRouterStateContext.Provider value={router.state}>
        <Router
          location={router.state.location}
          navigationType={router.state.historyAction}
          navigator={getStatelessNavigator()}
          static={true}
        >
          <DataStaticRoutes
            dataRoutes={router.routes}
            location={router.state.location}
          />
        </Router>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
}

interface DataStaticRoutesProps {
  dataRoutes: DataRouteObject[];
  location: RouterState["location"];
}

function DataStaticRoutes({
  dataRoutes,
  location,
}: DataStaticRoutesProps): React.ReactElement | null {
  return useRoutes(dataRoutes, location);
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

function getStatelessRouter(
  dataRoutes: DataRouteObject[],
  context: StaticHandlerContext
): DataRouter {
  let msg = (method: string) =>
    `You cannot use router.${method}() on the server because it is a stateless environment`;

  return {
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
        resetScrollPosition: true,
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
      throw msg("getFetcher");
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
