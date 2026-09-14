import type { RoutePatternDataRouteMatcher } from "./matcher-route-pattern";

export let RoutePatternMatcher: typeof RoutePatternDataRouteMatcher | undefined;

let preloadPromise:
  | Promise<typeof import("./matcher-route-pattern")>
  | undefined;

/**
 * Load the route-pattern matcher before creating a Data Router or static handler
 * with `future.unstable_routePatternMatching` enabled. Import from
 * `react-router/route-pattern` and await this once during application startup.
 * Server and browser applications must each preload their own matcher.
 *
 * Concurrent and subsequent calls share the same load. If loading fails, the
 * promise rejects and a later call can retry.
 *
 * @public
 * @category Data Routers
 * @mode data
 * @returns A promise that resolves when the route-pattern matcher is ready.
 */
export async function unstable_preloadRoutePattern(): Promise<void> {
  try {
    preloadPromise ??= import("./matcher-route-pattern");
    let { RoutePatternDataRouteMatcher } = await preloadPromise;
    RoutePatternMatcher = RoutePatternDataRouteMatcher;
  } catch (error) {
    preloadPromise = undefined;
    throw error;
  }
}
