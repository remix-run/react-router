Preserve `caseSensitive` on client routes in Framework Mode and `createRoutesStub()`

- Forward `route.caseSensitive` in `createClientRoutes()` so client hydration, client-side navigation, lazy route discovery, and HMR match `createServerRoutes()` and `createStaticHandlerDataRoutes()`
- Forward `route.caseSensitive` in `createRoutesStub()`
