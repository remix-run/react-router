---
"react-router": patch
---

Add `unstable_instrumentations` API to allow users to add observablity to their apps by instrumenting route loaders, actions, middlewares, lazy, as well as server-side request handlers and client side navigations/fetches

- Framework Mode:
  - `entry.server.tsx`: `export const unstable_instrumentations = [...]`
  - `entry.client.tsx`: `<HydratedRouter unstable_instrumentations={[...]} />`
- Data Mode
  - `createBrowserRouter(routes, { unstable_instrumentations: [...] })`

This also adds a new `unstable_pattern` parameter to loaders/actions/middleware which contains the un-interpolated route pattern (i.e., `/blog/:slug`) which is useful for aggregating performance metrics by route
