Render the `HydrateFallback` of a route discovered through `patchRoutesOnNavigation` during initial hydration

- Routes discovered during initial hydration are now exposed in `state.matches` while their loaders run, so `<RouterProvider>` renders down to the discovered route's `HydrateFallback` instead of rendering nothing
