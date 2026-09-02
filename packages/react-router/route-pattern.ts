/**
 * @module route-pattern
 */

import { RoutePatternDataRouteMatcher } from "./lib/router/matcher-route-pattern";
import type { DataRouteMatcherFactory } from "./lib/router/matcher";

/**
 * Enables route-pattern matching when passed to
 * `future.unstable_routePatternMatching` on a Data Router.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @returns A route matcher factory for `future.unstable_routePatternMatching`.
 */
export const unstable_routePatternMatching: DataRouteMatcherFactory = (
  basename,
) => new RoutePatternDataRouteMatcher(basename);
