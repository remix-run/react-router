---
"react-router-dom": major
"react-router": major
---

Remove the original `defer` implementation in favor of using raw promises via single fetch and `turbo-stream`. This removes these exports from React Router:

- `defer`
- `AbortedDeferredError`
- `type TypedDeferredData`
- `UNSAFE_DeferredData`
- `UNSAFE_DEFERRED_SYMBOL`,
