---
"react-router-dom": patch
---

Fix `fetcher.submit` types - remove incorrect `navigate`/`fetcherKey`/`unstable_viewTransition` options because they are only relevant for `useSubmit`
