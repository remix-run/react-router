---
"react-router-dom": major
"react-router": major
---

- Remove the `future.v7_partialHydration` flag
  - This also removes the `<RouterProvider fallbackElement>` prop
    - To migrate, move the `fallbackElement` to a `hydrateFallbackElement`/`HydrateFallback` on your root route
  - Also worth nothing there is a related breaking changer with this future flag:
    - Without `future.v7_partialHydration` (when using `fallbackElement`), `state.navigation` was populated during the initial load
    - With `future.v7_partialHydration`, `state.navigation` remains in an `"idle"` state during the initial load
