---
"react-router-dom": minor
---

Add support for submitting fetcher persistence via `useFetcher({ persist: true })` ([RFC](https://github.com/remix-run/remix/discussions/7698))

- When `persist` is specified, if the submitting fetcher is unmounted while it is active, it will persist via `useFetchers()` until it returns back to an `idle` state
- This allows you to accessing pending/optimistic UI data via `useFetchers()` for fetchers whose components have since unmounted
