
//#region lib/router/matcher-route-pattern.preload.d.ts
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
declare function unstable_preloadRoutePattern(): void;
//#endregion
export { unstable_preloadRoutePattern };