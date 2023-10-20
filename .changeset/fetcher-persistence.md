---
"react-router-dom": minor
"@remix-run/router": minor
---

Fix the persistence behavior of fetchers so that they don't get cleaned up on `fetcher` unmount, but instead get cleaned up on fetcher completion (which may be after the fetcher unmounts in the UI) ([RFC](https://github.com/remix-run/remix/discussions/7698))

- This is a long-standing bug fix as the `useFetchers()` API was always supposed to only reflect **in-flight** fetcher information for pending/optimistic UI
- It was not intended to reflect fetcher data or hang onto fetchers after they returned to an idle state
- To do this we've re-architected things a bit and now it's the `react-router-dom` layer that holds stateful fetcher data to expose via `useFetcher()`
- The `router` now only knows about in-flight fetchers - they do not exist in `state.fetchers` until a `fetch()` call is made, and they are removed when it returns to `idle` (and the data is handed off to the React layer)
- **Warning:** This has two potential "breaking bug" side-effects for your application:
  - Fetchers that previously unmounted _while in-flight_ will not be immediately aborted and will instead be cleaned up once they return to `idle`. They will remain exposed via `useFetchers` while in-flight so you can still access pending/optimistic data after unmount.
  - Fetchers that complete while still mounted will no longer appear in `useFetchers()` - they served effectively no purpose in there since you can access the data via `useFetcher().data`)
