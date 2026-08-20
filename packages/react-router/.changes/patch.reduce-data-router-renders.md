Avoid unnecessary route component re-renders when unrelated data router state changes

- **Breaking:** `UNSAFE_DataRouterStateContext` no longer exposes `navigation`, `revalidation`, `loaderData`, `actionData`, `errors`, or `fetchers`; use `UNSAFE_DataRouterNavigationContext`, `UNSAFE_DataRouterDataContext`, and `UNSAFE_FetchersContext` respectively
- **Breaking:** `UNSAFE_FetchersContext` now provides `{ fetchers, fetcherData }` and defaults to `null` instead of providing the fetcher data `Map` directly
