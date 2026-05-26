Remove internal `hasErrorBoundary` field added to `router.routes` when using a data router

- This should not impact user-facing code since this was an internal prop and was computed based on the presence of `ErrorBoundary` or `errorElement` on your route
- `hasErrorBoundary` is no longer accepted on `RouteObject` (`IndexRouteObject`/`NonIndexRouteObject`), `DataRouteObject`, `<Route>` JSX props, or as a key in `lazy` route definitions.
- The `MapRoutePropertiesFunction` signature no longer requires returning `hasErrorBoundary`; the router infers it directly.
