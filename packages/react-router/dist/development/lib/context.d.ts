
import { Action, History, Location, To } from "./router/history.js";
import { RouteMatch, TrackedPromise } from "./router/utils.js";
import { RelativeRoutingType, Router, RouterState, StaticHandlerContext } from "./router/router.js";
import { ClientOnErrorFunction } from "./components.js";
import * as React$1 from "react";

//#region lib/context.d.ts
interface DataRouterContextObject extends Omit<NavigationContextObject, "future" | "useTransitions"> {
  router: Router;
  staticContext?: StaticHandlerContext;
  onError?: ClientOnErrorFunction;
}
declare const DataRouterContext: React$1.Context<DataRouterContextObject | null>;
declare const DataRouterStateContext: React$1.Context<RouterState | null>;
type ViewTransitionContextObject = {
  isTransitioning: false;
} | {
  isTransitioning: true;
  flushSync: boolean;
  currentLocation: Location;
  nextLocation: Location;
};
declare const ViewTransitionContext: React$1.Context<ViewTransitionContextObject>;
type FetchersContextObject = Map<string, any>;
declare const FetchersContext: React$1.Context<FetchersContextObject>;
declare const AwaitContext: React$1.Context<TrackedPromise | null>;
declare const AwaitContextProvider: (props: React$1.ComponentProps<typeof AwaitContext.Provider>) => React$1.FunctionComponentElement<React$1.ProviderProps<TrackedPromise | null>>;
interface NavigateOptions {
  /** Replace the current entry in the history stack instead of pushing a new one */
  replace?: boolean;
  /** Masked URL */
  mask?: To;
  /** Adds persistent client side routing state to the next location */
  state?: any;
  /** If you are using {@link ScrollRestoration `<ScrollRestoration>`}, prevent the scroll position from being reset to the top of the window when navigating */
  preventScrollReset?: boolean;
  /** Defines the relative path behavior for the link. "route" will use the route hierarchy so ".." will remove all URL segments of the current route pattern while "path" will use the URL path so ".." will remove one URL segment. */
  relative?: RelativeRoutingType;
  /** Wraps the initial state update for this navigation in a {@link https://react.dev/reference/react-dom/flushSync ReactDOM.flushSync} call instead of the default {@link https://react.dev/reference/react/startTransition React.startTransition} */
  flushSync?: boolean;
  /** Enables a {@link https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API View Transition} for this navigation by wrapping the final state update in `document.startViewTransition()`. If you need to apply specific styles for this view transition, you will also need to leverage the {@link useViewTransitionState `useViewTransitionState()`} hook.  */
  viewTransition?: boolean;
  /** Specifies the default revalidation behavior after this submission */
  defaultShouldRevalidate?: boolean;
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
interface Navigator {
  createHref: History["createHref"];
  encodeLocation?: History["encodeLocation"];
  go: History["go"];
  push(to: To, state?: any, opts?: NavigateOptions): void;
  replace(to: To, state?: any, opts?: NavigateOptions): void;
}
interface NavigationContextObject {
  basename: string;
  navigator: Navigator;
  static: boolean;
  useTransitions: boolean | undefined;
  future: {};
}
declare const NavigationContext: React$1.Context<NavigationContextObject>;
interface LocationContextObject {
  location: Location;
  navigationType: Action;
}
declare const LocationContext: React$1.Context<LocationContextObject>;
interface RouteContextObject {
  outlet: React$1.ReactElement | null;
  matches: RouteMatch[];
  isDataRoute: boolean;
}
declare const RouteContext: React$1.Context<RouteContextObject>;
//#endregion
export { AwaitContextProvider, DataRouterContext, DataRouterStateContext, FetchersContext, LocationContext, NavigateOptions, NavigationContext, Navigator, RouteContext, ViewTransitionContext };