Be defensive against leading double slashes in static router `encodeLocation()`

- Prevents `TypeError: Invalid URL` during SSR in `<ServerRouter>`, `<StaticRouterProvider>`, and `<StaticRouter>` when encoding locations with leading double slashes (such as query-only or hash-only `<NavLink>`s on double-slash request URLs)
