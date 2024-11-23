import * as React from "react";
import type {
  History,
  Action as NavigationType,
  Location,
  To,
} from "./router/history";
import type {
  RelativeRoutingType,
  Router,
  StaticHandlerContext,
} from "./router/router";
import type {
  AgnosticIndexRouteObject,
  AgnosticNonIndexRouteObject,
  AgnosticPatchRoutesOnNavigationFunction,
  AgnosticPatchRoutesOnNavigationFunctionArgs,
  AgnosticRouteMatch,
  LazyRouteFunction,
  TrackedPromise,
} from "./router/utils";

// Create react-specific types from the agnostic types in @remix-run/router to
// export from react-router
export interface IndexRouteObject {
  caseSensitive?: AgnosticIndexRouteObject["caseSensitive"] | undefined;
  path?: AgnosticIndexRouteObject["path"] | undefined;
  id?: AgnosticIndexRouteObject["id"] | undefined;
  loader?: AgnosticIndexRouteObject["loader"] | undefined;
  action?: AgnosticIndexRouteObject["action"] | undefined;
  hasErrorBoundary?: AgnosticIndexRouteObject["hasErrorBoundary"] | undefined;
  shouldRevalidate?: AgnosticIndexRouteObject["shouldRevalidate"] | undefined;
  handle?: AgnosticIndexRouteObject["handle"] | undefined;
  index: true;
  children?: DataRouteObject[] | undefined;
  element?: React.ReactNode | null | undefined;
  hydrateFallbackElement?: React.ReactNode | null | undefined;
  errorElement?: React.ReactNode | null | undefined;
  Component?: React.ComponentType | null | undefined;
  HydrateFallback?: React.ComponentType | null | undefined;
  ErrorBoundary?: React.ComponentType | null | undefined;
  lazy?: LazyRouteFunction<RouteObject> | undefined;
}

export interface NonIndexRouteObject {
  caseSensitive?: AgnosticNonIndexRouteObject["caseSensitive"] | undefined;
  path?: AgnosticNonIndexRouteObject["path"] | undefined;
  id?: AgnosticNonIndexRouteObject["id"] | undefined;
  loader?: AgnosticNonIndexRouteObject["loader"] | undefined;
  action?: AgnosticNonIndexRouteObject["action"] | undefined;
  hasErrorBoundary?:
    | AgnosticNonIndexRouteObject["hasErrorBoundary"]
    | undefined;
  shouldRevalidate?:
    | AgnosticNonIndexRouteObject["shouldRevalidate"]
    | undefined;
  handle?: AgnosticNonIndexRouteObject["handle"] | undefined;
  index?: false | undefined;
  children?: RouteObject[] | undefined;
  element?: React.ReactNode | null | undefined;
  hydrateFallbackElement?: React.ReactNode | null | undefined;
  errorElement?: React.ReactNode | null | undefined;
  Component?: React.ComponentType | null | undefined;
  HydrateFallback?: React.ComponentType | null | undefined;
  ErrorBoundary?: React.ComponentType | null | undefined;
  lazy?: LazyRouteFunction<RouteObject> | undefined;
}

export type RouteObject = IndexRouteObject | NonIndexRouteObject;

export type DataRouteObject = RouteObject & {
  children?: DataRouteObject[] | undefined;
  id: string;
};

export interface RouteMatch<
  ParamKey extends string = string,
  RouteObjectType extends RouteObject = RouteObject
> extends AgnosticRouteMatch<ParamKey, RouteObjectType> {}

export interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}

export type PatchRoutesOnNavigationFunctionArgs =
  AgnosticPatchRoutesOnNavigationFunctionArgs<RouteObject, RouteMatch>;

export type PatchRoutesOnNavigationFunction =
  AgnosticPatchRoutesOnNavigationFunction<RouteObject, RouteMatch>;

export interface DataRouterContextObject
  // Omit `future` since those can be pulled from the `router`
  // `NavigationContext` needs future since it doesn't have a `router` in all cases
  extends Omit<NavigationContextObject, "future"> {
  router: Router;
  staticContext?: StaticHandlerContext | undefined;
}

export const DataRouterContext =
  React.createContext<DataRouterContextObject | null>(null);
DataRouterContext.displayName = "DataRouter";

export const DataRouterStateContext = React.createContext<
  Router["state"] | null
>(null);
DataRouterStateContext.displayName = "DataRouterState";

export type ViewTransitionContextObject =
  | {
      isTransitioning: false;
    }
  | {
      isTransitioning: true;
      flushSync: boolean;
      currentLocation: Location;
      nextLocation: Location;
    };

export const ViewTransitionContext =
  React.createContext<ViewTransitionContextObject>({
    isTransitioning: false,
  });
ViewTransitionContext.displayName = "ViewTransition";

// TODO: (v7) Change the useFetcher data from `any` to `unknown`
export type FetchersContextObject = Map<string, any>;

export const FetchersContext = React.createContext<FetchersContextObject>(
  new Map()
);
FetchersContext.displayName = "Fetchers";

export const AwaitContext = React.createContext<TrackedPromise | null>(null);
AwaitContext.displayName = "Await";

export interface NavigateOptions {
  replace?: boolean | undefined;
  state?: any | undefined;
  preventScrollReset?: boolean | undefined;
  relative?: RelativeRoutingType | undefined;
  flushSync?: boolean | undefined;
  viewTransition?: boolean | undefined;
}

/**
 * A Navigator is a "location changer"; it's how you get to different locations.
 *
 * Every history instance conforms to the Navigator interface, but the
 * distinction is useful primarily when it comes to the low-level `<Router>` API
 * where both the location and a navigator must be provided separately in order
 * to avoid "tearing" that may occur in a suspense-enabled app if the action
 * and/or location were to be read directly from the history instance.
 */
export interface Navigator {
  createHref: History["createHref"];
  // Optional for backwards-compat with Router/HistoryRouter usage (edge case)
  encodeLocation?: History["encodeLocation"] | undefined;
  go: History["go"];
  push(
    to: To,
    state?: any | undefined,
    opts?: NavigateOptions | undefined
  ): void;
  replace(
    to: To,
    state?: any | undefined,
    opts?: NavigateOptions | undefined
  ): void;
}

interface NavigationContextObject {
  basename: string;
  navigator: Navigator;
  static: boolean;
  // TODO: Re-introduce a singular `FutureConfig` once we land our first
  // future.unstable_ or future.v8_ flag
  future: {};
}

export const NavigationContext = React.createContext<NavigationContextObject>(
  null!
);
NavigationContext.displayName = "Navigation";

interface LocationContextObject {
  location: Location;
  navigationType: NavigationType;
}

export const LocationContext =
  React.createContext<LocationContextObject | null>(null);
LocationContext.displayName = "Location";

export interface RouteContextObject {
  outlet: React.ReactElement | null;
  matches: RouteMatch[];
  isDataRoute: boolean;
}

export const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  matches: [],
  isDataRoute: false,
});
RouteContext.displayName = "Route";

export const RouteErrorContext = React.createContext<any>(null);
RouteErrorContext.displayName = "RouteError";
