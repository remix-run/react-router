Fix an `Expected fetcher: <key>` invariant thrown on navigation when a fetcher is aborted during its post-action revalidation

- `handleFetcherAction` bailed out on an aborted signal one line above its own `fetchReloadIds.delete(key)`, so the entry outlived the fetcher. An aborted fetcher goes idle and is pruned from `state.fetchers`, and the next `abortStaleFetchLoads`/`markFetchersDone` caller then invariants on a fetcher that is no longer there
- Reachable through ordinary usage — `fetcher.submit()` followed by `fetcher.load()` on the same key, or `fetcher.reset()` mid-revalidation. It surfaced as an unhandled rejection, so no error boundary caught it and the in-flight navigation died
