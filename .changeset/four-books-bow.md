---
"@remix-run/router": patch
---

Update the `unstable_dataStrategy` API to allow for more advanced implementations

- Rename `unstable_HandlerResult` to `unstable_DataStrategyResult`
- The return signature has changed from a parallel array of `unstable_DataStrategyResult[]` (parallel to `matches`) to a key/value object of `routeId => unstable_DataStrategyResult`
  - This allows you to more easily decide to opt-into or out-of revalidating data that may not have been revalidated by default (via `match.shouldLoad`)
  - ⚠️ This is a breaking change if you've currently adopted `unstable_dataStrategy`
- Added a new `fetcherKey` parameter to `unstable_dataStrategy` to allow differentiation from navigational and fetcher calls
- You should now return/throw a result from your `handlerOverride` instead of returning a `DataStrategyResult`
  - If you are aggregating the results of `match.resolve()` into a final results object you should not need to think about the `DataStrategyResult` type
  - If you are manually filling your results object from within your `handlerOverride`, then you will need to assign a `DataStrategyResult` as the value so React Router knows if it's a successful execution or an error.
