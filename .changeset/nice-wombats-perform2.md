---
"react-router": patch
---

Error at build time in `ssr:false` + `prerender` apps for the edge case scenario of:

- A parent route has only a `loader` (does not have a `clientLoader`)
- The parent route is pre-rendered
- The parent route has children routes which are not prerendered
- This means that when the child paths are loaded via the SPA fallback, the parent won't have any `loaderData` because there is no server on which to run the `loader`
- This can be resolved by either adding a parent `clientLoader` or pre-rendering the child paths
- If you add a `clientLoader`, calling the `serverLoader()` on non-prerendered paths will throw a 404
