import * as React from "react";
import type {
  History,
  Location,
  RouteMatch,
  Router,
  StaticHandlerContext,
  To,
} from "@remix-run/router";
import { Action as NavigationType } from "@remix-run/router";

// Contexts for data routers
export const DataStaticRouterContext =
  React.createContext<StaticHandlerContext | null>(null);
if (__DEV__) {
  DataStaticRouterContext.displayName = "DataStaticRouterContext";
}

export interface DataRouterContextObject extends NavigationContextObject {
  router: Router;
}

function createDataRouterContext() {
  const DataRouterContext = React.createContext<DataRouterContextObject | null>(
    null
  );
  if (__DEV__) {
    DataRouterContext.displayName = "DataRouter";
  }
  return DataRouterContext;
}

function createDataRouterStateContext() {
  const DataRouterStateContext = React.createContext<Router["state"] | null>(
    null
  );

  if (__DEV__) {
    DataRouterStateContext.displayName = "DataRouterState";
  }

  return DataRouterStateContext;
}

function createDeferredContext() {
  const DeferredContext = React.createContext<any | null>(null);
  if (__DEV__) {
    DeferredContext.displayName = "Deferred";
  }
  return DeferredContext;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
  resetScroll?: boolean;
}

/**
 * A Navigator is a "location changer"; it's how you get to different locations.
 *
 * Every history instance conforms to the Navigator interface, but the
 * distinction is useful primarily when it comes to the low-level <Router> API
 * where both the location and a navigator must be provided separately in order
 * to avoid "tearing" that may occur in a suspense-enabled app if the action
 * and/or location were to be read directly from the history instance.
 */
export interface Navigator {
  createHref: History["createHref"];
  go: History["go"];
  push(to: To, state?: any, opts?: NavigateOptions): void;
  replace(to: To, state?: any, opts?: NavigateOptions): void;
}

export interface NavigationContextObject {
  basename: string;
  navigator: Navigator;
  static: boolean;
}

function createNavigationContext() {
  const NavigationContext = React.createContext<NavigationContextObject>(null!);

  if (__DEV__) {
    NavigationContext.displayName = "Navigation";
  }

  return NavigationContext;
}

export interface LocationContextObject {
  location: Location;
  navigationType: NavigationType;
}

function createLocationContext() {
  const LocationContext = React.createContext<LocationContextObject>(null!);
  if (__DEV__) {
    LocationContext.displayName = "Location";
  }
  return LocationContext;
}

export interface RouteContextObject {
  outlet: React.ReactElement | null;
  matches: RouteMatch[];
}

function createRouteContext() {
  const RouteContext = React.createContext<RouteContextObject>({
    outlet: null,
    matches: [],
  });

  if (__DEV__) {
    RouteContext.displayName = "Route";
  }

  return RouteContext;
}

function createRouteErrorContext() {
  const RouteErrorContext = React.createContext<any>(null);
  if (__DEV__) {
    RouteErrorContext.displayName = "RouteError";
  }

  return RouteErrorContext;
}

function createOutletContext() {
  return React.createContext<unknown>(null);
}

export function createReactRouterContexts() {
  return {
    LocationContext: createLocationContext(),
    NavigationContext: createNavigationContext(),
    DataRouterStateContext: createDataRouterStateContext(),
    RouteContext: createRouteContext(),
    OutletContext: createOutletContext(),
    RouteErrorContext: createRouteErrorContext(),
    DeferredContext: createDeferredContext(),
    DataRouterContext: createDataRouterContext(),
  };
}
export const reactRouterContexts = createReactRouterContexts();
export type ReactRouterContexts = typeof reactRouterContexts;
