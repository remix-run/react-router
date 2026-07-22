/**
 * react-router v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import * as React$1 from "react";
//#region lib/context.ts
const DataRouterContext = React$1.createContext(null);
DataRouterContext.displayName = "DataRouter";
const DataRouterStateContext = React$1.createContext(null);
DataRouterStateContext.displayName = "DataRouterState";
const RSCRouterContext = React$1.createContext(false);
function useIsRSCRouterContext() {
	return React$1.useContext(RSCRouterContext);
}
const ViewTransitionContext = React$1.createContext({ isTransitioning: false });
ViewTransitionContext.displayName = "ViewTransition";
const FetchersContext = React$1.createContext(/* @__PURE__ */ new Map());
FetchersContext.displayName = "Fetchers";
const AwaitContext = React$1.createContext(null);
AwaitContext.displayName = "Await";
const AwaitContextProvider = (props) => React$1.createElement(AwaitContext.Provider, props);
const NavigationContext = React$1.createContext(null);
NavigationContext.displayName = "Navigation";
const LocationContext = React$1.createContext(null);
LocationContext.displayName = "Location";
const RouteContext = React$1.createContext({
	outlet: null,
	matches: [],
	isDataRoute: false
});
RouteContext.displayName = "Route";
const RouteErrorContext = React$1.createContext(null);
RouteErrorContext.displayName = "RouteError";
//#endregion
export { AwaitContext, AwaitContextProvider, DataRouterContext, DataRouterStateContext, FetchersContext, LocationContext, NavigationContext, RSCRouterContext, RouteContext, RouteErrorContext, ViewTransitionContext, useIsRSCRouterContext };
