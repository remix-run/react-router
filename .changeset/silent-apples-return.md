---
"react-router": patch
---

Add support for `route.unstable_lazyMiddleware` function to allow lazy loading of middleware logic.

**Breaking change for `unstable_middleware` consumers**

The `route.unstable_middleware` property is no longer supported in the return value from `route.lazy`. If you want to lazily load middleware, you must use `route.unstable_lazyMiddleware`.
