import type { RoutePatternDataRouteMatcher } from "./matcher-route-pattern";

export let RoutePatternMatcher: typeof RoutePatternDataRouteMatcher | undefined;

export function registerRoutePatternMatcher(
  matcher: typeof RoutePatternDataRouteMatcher,
): void {
  RoutePatternMatcher = matcher;
}
