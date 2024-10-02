---
"@remix-run/router": patch
---

Remove internal cache to fix issues with interrupted `patchRoutesOnNavigation` calls

- We used to cache in-progress calls to `patchRoutesOnNavigation` internally so that multiple navigations with the same start/end would only execute the function once and use the same promise
- However, this approach was at odds with `patch` short circuiting if a navigation was interrupted (and the `request.signal` aborted) since the first invocation's `patch` would no-op
- This cache also made some assumptions as to what a valid cache key might be - and is oblivious to any other application-state changes that may have occurred
- So, the cache has been removed because in _most_ cases, repeated calls to something like `import()` for async routes will already be cached automatically - and if not it's easy enough for users to implement this cache in userland
