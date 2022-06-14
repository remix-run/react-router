import * as React from "react";
import type {
  DataRouteObject,
  Router as DataRouter,
  RouterState,
} from "@remix-run/router";
import { Action, invariant } from "@remix-run/router";
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
  router: DataRouter;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function DataStaticRouter({ router }: DataStaticRouterProps) {
  invariant(
    router.state.initialized,
    "You must provide an initialized router to <DataStaticRouter>"
  );

  return (
    <DataRouterContext.Provider value={router}>
      <DataRouterStateContext.Provider value={router.state}>
        <Router
          location={router.state.location}
          navigationType={router.state.historyAction}
          navigator={getStatelessNavigator()}
          static={true}
        >
          <DataRoutes routes={router.routes} location={router.state.location} />
        </Router>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
}

interface DataRoutesProps {
  routes: DataRouteObject[];
  location: RouterState["location"];
}

function DataRoutes({
  routes,
  location,
}: DataRoutesProps): React.ReactElement | null {
  return useRoutes(routes, location);
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
