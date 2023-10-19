---
"@remix-run/router": patch
---

- Remove the internal `router.getFetcher` API
- Fix `router.deleteFetcher` type definition which incorrectly specified `key` as an optional parameter
