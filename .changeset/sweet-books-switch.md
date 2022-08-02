---
"react-router": patch
"@remix-run/router": patch
---

fix: Rename `<Deferred>` to `<Await>` (#9095)

- We are no longer replacing the `Promise` on `loaderData` with the value/error
  when it settles so it's now always a `Promise`.
- To that end, we changed from `<Deferred value={promise}>` to
  `<Await resolve={promise}>` for clarity, and it also now supports using
  `<Await>` with raw promises from anywhere, not only those on `loaderData`
  from a defer() call.
  - Note that raw promises will not be automatically cancelled on interruptions
    so they are not recommended
- The hooks are now `useAsyncValue`/`useAsyncError`
