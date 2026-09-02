
import { DataRouteMatcherFactory } from "./lib/router/matcher.js";

//#region route-pattern.d.ts
/**
 * Enables route-pattern matching when passed to
 * `future.unstable_routePatternMatching` on a Data Router.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @returns A route matcher factory for `future.unstable_routePatternMatching`.
 */
declare const unstable_routePatternMatching: DataRouteMatcherFactory;
//#endregion
export { unstable_routePatternMatching };