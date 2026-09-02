/**
 * react-router v8.3.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { RoutePatternDataRouteMatcher } from "./lib/router/matcher-route-pattern.js";
//#region route-pattern.ts
/**
* @module route-pattern
*/
/**
* Enables route-pattern matching when passed to
* `future.unstable_routePatternMatching` on a Data Router.
*
* @public
* @category Data Routers
* @mode data
* @returns A route matcher factory for `future.unstable_routePatternMatching`.
*/
const unstable_routePatternMatching = (basename) => new RoutePatternDataRouteMatcher(basename);
//#endregion
export { unstable_routePatternMatching };
