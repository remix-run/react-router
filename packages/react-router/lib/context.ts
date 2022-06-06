import * as React from "react";
import type {
  History,
  Location,
  RouteMatch,
  Router,
  To,
} from "@remix-run/router";
import { Action as NavigationType } from "@remix-run/router";

// Contexts for data routers
export const DataRouterContext = React.createContext<Router | null>(null);
if (__DEV__) {
  DataRouterContext.displayName = "DataRouter";
}

export const DataRouterStateContext = React.createContext<
  Router["state"] | null
>(null);
if (__DEV__) {
  DataRouterStateContext.displayName = "DataRouterState";
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

interface NavigationContextObject {
  basename: string;
  navigator: Navigator;
  static: boolean;
}

export const NavigationContext = React.createContext<NavigationContextObject>(
  null!
);

if (__DEV__) {
  NavigationContext.displayName = "Navigation";
}

interface LocationContextObject {
  location: Location;
  navigationType: NavigationType;
}

export const LocationContext = React.createContext<LocationContextObject>(
  null!
);

if (__DEV__) {
  LocationContext.displayName = "Location";
}

interface RouteContextObject {
  outlet: React.ReactElement | null;
  matches: RouteMatch[];
}

export const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  matches: [],
});

if (__DEV__) {
  RouteContext.displayName = "Route";
}

interface RouteContextObject {
  outlet: React.ReactElement | null;
  matches: RouteMatch[];
}

export const RouteErrorContext = React.createContext<any>(null);

if (__DEV__) {
  RouteErrorContext.displayName = "RouteError";
}
