Add `unstable_useRouteDiscovery` for application-controlled route discovery in conventional Framework Mode

- Discover selected destinations or load the running client's full route manifest without loading route modules
- Compose manifest-mismatch handlers, with shared recovery and cancellation that preserves application state
- Keep full-manifest failures catchable without rendering error boundaries, whether mismatch handlers use the hook or event's `loadAllRoutes()`
- Cancel pending revalidation alongside a canceled navigation, retaining existing data and settling interrupted fetchers before restoring Back/Forward history
- Enable `future.unstable_customRouteDiscovery` to opt in
  - Apps without the flag retain existing discovery behavior
- Call `event.defaultBehavior()` from a custom mismatch handler to explicitly run built-in recovery
