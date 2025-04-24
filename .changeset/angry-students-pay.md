---
"@react-router/dev": minor
"react-router": minor
---

Add new `routeDiscovery` `react-router.config.ts` option to disable Lazy Route Discovery

- The default value is `routeDiscovery: "lazy"`
- Setting `routeDiscovery: "initial"` will disable Lazy Route Discovery and send up all routes in the manifest on initial document load
- There is also an object version of the config which allows you to customize the manifest path when using `lazy`
  - `routeDiscovery: { mode: "lazy", manifestPath: "/custom-manifest" }`
