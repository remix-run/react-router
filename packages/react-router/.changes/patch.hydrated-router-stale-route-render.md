Fix `<HydratedRouter>` re-rendering the previous route after each navigation

`DataRoutes` read `FrameworkContext`, whose value changes on every `<HydratedRouter>` location update, so its memoization was bypassed and the route tree rendered again with the old router state before the new location committed. With `<Navigate state={...} replace>` this could loop until Safari threw a `SecurityError` for too many `history.replaceState()` calls. `RouterProvider` now reads the route discovery runtime and passes it to `DataRoutes` as a prop.
