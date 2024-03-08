---
"@remix-run/router": minor
---

Add a new `future.unstable_skipActionRevalidation` future flag

- Currently, active loaders revalidate after any action, regardless of the result
- With this flag enabled, actions that return/throw a 4xx/5xx response status will no longer automatically revalidate
- This should reduce load on your server since it's rare that a 4xx/5xx should actually mutate any data
- If you need to revalidate after a 4xx/5xx result with this flag enabled, you can still do that via returning `true` from `shouldRevalidate` which now receives a new `unstable_actionStatus` argument
