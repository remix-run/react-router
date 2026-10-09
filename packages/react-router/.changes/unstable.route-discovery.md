Add `unstable_useRouteDiscovery` for application-controlled route discovery in conventional Framework Mode

- Discover selected destinations or load the running client's full route manifest without loading route modules
- Compose before-discovery and manifest-mismatch handlers, with shared recovery and cancellation that preserves application state
- Cancel pending revalidation alongside a canceled navigation, retaining existing data and settling interrupted fetchers

Enable `future.unstable_customRouteDiscovery` to opt in. Apps without the flag retain existing discovery behavior. Custom mismatch handlers can call `event.defaultBehavior()` to explicitly run built-in recovery.
