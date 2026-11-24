Handle leading double slashes in static router `encodeLocation()`

- Prevent `TypeError: Invalid URL` during SSR in `<ServerRouter>`, `<StaticRouterProvider>`, and `<StaticRouter>`, including when rendering query-only or hash-only `<NavLink>` destinations on double-slash request URLs
