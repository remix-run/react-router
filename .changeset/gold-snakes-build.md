---
"@remix-run/router": minor
---

Stabilize `future.unstable_skipActionErrorRevalidation` as `future.v7_skipActionErrorRevalidation`

- When this flag is enabled, actions will not automatically trigger a revalidation if they return/throw a `Response` with a `4xx`/`5xx` status code
- You may still opt-into revalidation via `shouldRevalidate`
- This also changes `shouldRevalidate`'s `unstable_actionStatus` parameter to `actionStatus`
