---
"react-router": patch
---

- UNSTABLE(BREAKING): If a middleware throws an error, ensure we only bubble the error itself via `next()` and are no longer leaking the `MiddlewareError` implementation detail
