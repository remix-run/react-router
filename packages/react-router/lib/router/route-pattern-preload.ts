import { registerRoutePatternMatcher } from "./matcher-route-pattern-registry";

let preloadPromise: Promise<void> | undefined;

/**
 * Load the route-pattern matcher before creating a Data Router or static handler
 * with `future.unstable_routePatternMatching` enabled. Import from
 * `react-router/route-pattern` and await this once during application startup.
 * Server and browser applications must each preload their own matcher.
 *
 * Concurrent and subsequent calls share the same promise. If loading fails, the
 * promise rejects and a later call can retry.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @returns A promise that resolves when the route-pattern matcher is ready.
 */
export function unstable_preloadRoutePattern(): Promise<void> {
  return (preloadPromise ??= import("./matcher-route-pattern").then(
    ({ RoutePatternDataRouteMatcher }) => {
      registerRoutePatternMatcher(RoutePatternDataRouteMatcher);
    },
    (error) => {
      preloadPromise = undefined;
      throw error;
    },
  ));
}
