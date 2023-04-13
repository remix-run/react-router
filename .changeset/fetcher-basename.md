---
"react-router-dom": minor
"@remix-run/router": minor
---

- Enable relative routing in the `@remix-run/router` when providing a source route ID from which the path is relative to:

  - Example: `router.navigate("../path", { fromRouteId: "some-route" })`.
  - This also applies to `router.fetch` which already receives a source route ID

- Introduce a new `@remix-run/router` `future.v7_prependBasename` flag to enable `basename` prefixing to all paths coming into `router.navigate` and `router.fetch`.
  - Previously the `basename` was prepended in the React Router layer, but now that relative routing is being handled by the router we need prepend the `basename` _after_ resolving any relative paths
  - This also enables `basename` support in `useFetcher` as well
