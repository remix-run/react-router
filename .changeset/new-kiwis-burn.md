---
"react-router": patch
"@remix-run/router": patch
---

Deferred API Updates

- Removes `<Suspense>` from inside `<Deferred>`, requires users to render their own suspense boundaries
- Updates `Deferred` to use a true error boundary to catch render errors as well as data errors
- Support array and single promise usages
  - `return defer([ await critical(), lazy() ])`
  - `return defer(lazy())`
- Remove `Deferrable`/`ResolvedDeferrable` in favor of raw `Promise`'s and `Awaited`
- Remove generics from `useAsyncValue` until `useLoaderData` generic is decided in 6.5
