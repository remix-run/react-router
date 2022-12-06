---
"@remix-run/router": patch
---

- Add `requestContext` support to static handler `query`/`queryRoute`
  - Note that the unstable API of `queryRoute(path, routeId)` has been changed to `queryRoute(path, { routeId, requestContext })`
