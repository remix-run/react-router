import * as React from "react";
import type { RouterInit } from "@remix-run/router";
import {
  Action,
  createMemoryHistory,
  createRouter,
  invariant,
} from "@remix-run/router";
import {
  Location,
  To,
  createPath,
  parsePath,
  Router,
  createRoutesFromChildren,
  Routes,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
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
  data: RouterInit["hydrationData"];
  location: Partial<Location> | string;
  children?: React.ReactNode;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function DataStaticRouter({
  data,
  location = "/",
  children,
}: DataStaticRouterProps) {
  // Create a router but do not call initialize() so it has no side effects
  // and performs no data fetching
  let staticRouter = createRouter({
    history: createMemoryHistory({ initialEntries: [location] }),
    routes: createRoutesFromChildren(children),
    hydrationData: data,
  });

  invariant(
    staticRouter.state.initialized,
    "You must provide a complete `data` prop for <DataStaticRouter>"
  );

  let staticNavigator = getStatelessNavigator();

  return (
    <DataRouterContext.Provider value={staticRouter}>
      <DataRouterStateContext.Provider value={staticRouter.state}>
        <Router
          location={staticRouter.state.location}
          navigationType={staticRouter.state.historyAction}
          navigator={staticNavigator}
          static={true}
        >
          <Routes children={children} />
        </Router>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
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
