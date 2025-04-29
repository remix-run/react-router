---
"@react-router/dev": minor
"react-router": minor
---

Added a new `react-router.config.ts` `routeDiscovery` option to configure Lazy Route Discovery behavior.

- By default, Lazy Route Discovery is enabled and makes manifest requests to the `/__manifest` path:
  - `routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" }`
- You can modify the manifest path used:
  - `routeDiscovery: { mode: "lazy", manifestPath: "/custom-manifest" }`
- Or you can disable this feature entirely and include all routes in the manifest on initial document load:
  - `routeDiscovery: { mode: "initial" }`
