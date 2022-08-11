import * as React from "react";
import type {
  TrackedPromise,
  History,
  Location,
  Router,
  StaticHandlerContext,
  To,
  AgnosticRouteObject,
  AgnosticRouteMatch,
} from "@remix-run/router";
import { Action as NavigationType } from "@remix-run/router";

// Create react-specific types from the agnostic types in @remix-run/router to
// export from react-router
export interface RouteObject extends AgnosticRouteObject {
  children?: RouteObject[];
  element?: React.ReactNode;
  errorElement?: React.ReactNode;
}

export interface DataRouteObject extends RouteObject {
  children?: DataRouteObject[];
  id: string;
}

export interface RouteMatch<
  ParamKey extends string = string,
  RouteObjectType extends RouteObject = RouteObject
> extends AgnosticRouteMatch<ParamKey, RouteObjectType> {}

export interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}

// Contexts for data routers
export const DataStaticRouterContext =
  React.createContext<StaticHandlerContext | null>(null);
if (__DEV__) {
  DataStaticRouterContext.displayName = "DataStaticRouterContext";
}

export interface DataRouterContextObject extends NavigationContextObject {
  router: Router;
}

export const DataRouterContext =
  React.createContext<DataRouterContextObject | null>(null);
if (__DEV__) {
  DataRouterContext.displayName = "DataRouter";
}

export const DataRouterStateContext = React.createContext<
  Router["state"] | null
>(null);
if (__DEV__) {
  DataRouterStateContext.displayName = "DataRouterState";
}

export const AwaitContext = React.createContext<TrackedPromise | null>(null);
if (__DEV__) {
  AwaitContext.displayName = "Await";
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

export interface RouteContextObject {
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

export const RouteErrorContext = React.createContext<any>(null);

if (__DEV__) {
  RouteErrorContext.displayName = "RouteError";
}
