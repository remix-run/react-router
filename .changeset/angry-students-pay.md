---
"@react-router/dev": minor
"react-router": minor
---

Add new `routeDiscovery` `react-router.config.ts` option to disable Lazy Route Discovery

- The default value is `routeDiscovery: "lazy"`
- Setting `routeDiscovery: "initial"` will disable Lazy Route Discovery and send up all routes in the manifest on initial document load
