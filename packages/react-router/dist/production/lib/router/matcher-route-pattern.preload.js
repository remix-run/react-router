/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { RoutePatternDataRouteMatcher } from "./matcher-route-pattern.js";
//#region lib/router/matcher-route-pattern.preload.ts
let RoutePatternMatcher;
function getRoutePatternMatcher() {
	return RoutePatternMatcher;
}
/**
* Initialize the route-pattern matcher before creating a Data Router or static
* handler with `future.unstable_routePatternMatching` enabled. Import from
* `react-router/route-pattern` and call this once during application startup.
* Server and browser applications must each preload their own matcher.
*
* The matcher is statically imported by this module. Tree-shaking bundlers can
* remove it from applications that do not use this function. Initialization is
* synchronous, and repeated calls are safe.
*
* @public
* @category Data Routers
* @mode data
* @returns {void}
*/
function unstable_preloadRoutePattern() {
	RoutePatternMatcher = RoutePatternDataRouteMatcher;
}
//#endregion
export { getRoutePatternMatcher, unstable_preloadRoutePattern };
