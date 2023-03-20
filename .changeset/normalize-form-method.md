---
"react-router": minor
"react-router-dom": minor
"@remix-run/router": minor
---

Added support for [**Future Flags**][api-development-strategy] in React Router. The first flag being introduced is `future.v7_normalizeFormMethod` which will normalize the exposed `useNavigation()/useFetcher()` `formMethod` fields as uppercase HTTP methods to align with the `fetch()` behavior.

- When `future.v7_normalizeFormMethod === false`,
  - `useNavigation().formMethod` is lowercase
  - `useFetcher().formMethod` is lowercase
- When `future.v7_normalizeFormMethod === true`:
  - `useNavigation().formMethod` is uppercase
  - `useFetcher().formMethod` is uppercase

[api-development-strategy]: https://reactrouter.com/en/main/guides/api-development-strategy
