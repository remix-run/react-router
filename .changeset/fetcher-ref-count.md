---
"@remix-run/router": minor
---

When `v7_fetcherPersist` is enabled, the router now performs ref-counting on fetcher keys via `getFetcher`/`deleteFetcher` so it knows when a given fetcher is totally unmounted from the UI

- Once a fetcher has been totally unmounted, we can ignore post-processing of a persisted fetcher result such as a redirect or an error
- The router will also pass a new `deletedFetchers` array to the subscriber callbacks so that the UI layer can remove associated fetcher data
