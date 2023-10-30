---
"@remix-run/router": minor
---

Add a new `future.v7_fetcherPersist` flag to the `@remix-run/router` to change the persistence behavior of fetchers when `router.deleteFetcher` is called. Instead of being immediately cleaned up, fetchers will persist until they return to an `idle` state ([RFC](https://github.com/remix-run/remix/discussions/7698))

- This is sort of a long-standing bug fix as the `useFetchers()` API was always supposed to only reflect **in-flight** fetcher information for pending/optimistic UI -- it was not intended to reflect fetcher data or hang onto fetchers after they returned to an `idle` state
- Keep an eye out for the following specific behavioral changes when opting into this flag and check your app for compatibility:
  - Fetchers that complete _while still mounted_ will no longer appear in `useFetchers()`. They served effectively no purpose in there since you can access the data via `useFetcher().data`).
  - Fetchers that previously unmounted _while in-flight_ will not be immediately aborted and will instead be cleaned up once they return to an `idle` state. They will remain exposed via `useFetchers` while in-flight so you can still access pending/optimistic data after unmount.
