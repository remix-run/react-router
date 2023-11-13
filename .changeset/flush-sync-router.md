---
"@remix-run/router": minor
---

Add `unstable_flushSync` option to `router.navigate` and `router.fetch` to tell the React Router layer to opt-out of `React.startTransition` and into `ReactDOM.flushSync` for state updates
