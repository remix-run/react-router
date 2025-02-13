---
"react-router": patch
---

Properly handle revalidations to across a prerender/SPA boundary

- In "hybrid" applications where some routes are pre-rendered and some are served from a SPA fallback, we need to avoid making `.data` requests if the path wasn't pre-rendered because the request will 404
- We don't know all the pre-rendered paths client-side, however:
  - All `loader` data in `ssr:false` mode is static because it's generated at build time
  - A route must use a `clientLoader` to do anything dynamic
  - Therefore, if a route only has a `loader` and not a `clientLoader`, we disable revalidation by default because there is no new data to retrieve
  - We short circuit and skip single fetch `.data` request logic if there are no server loaders with `shouldLoad=true` in our single fetch `dataStrategy`
  - This ensures that the route doesn't cause a `.data` request that would 404 after a submission
