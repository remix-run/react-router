---
"react-router": major
---

Migrate Remix type generics to React Router

- These generics are provided for Remix v2 migration purposes
- These generics and the APIs they exist on should be considered informally deprecated in favor of the new `Route.*` types
- Anyone migrating from React Router v6 should probably not leverage these new generics and should migrate straight to the `Route.*` types
- For React Router v6 users, these generics are new and should not impact your app, with one exception
  - `useFetcher` previously had an optional generic (used primarily by Remix v2) that expected the data type
  - This has been updated in v7 to expect the type of the function that generates the data (i.e., `typeof loader`/`typeof action`)
  - Therefore, you should update your usages:
    - ❌ `useFetcher<LoaderData>()`
    - ✅ `useFetcher<typeof loader>()`
