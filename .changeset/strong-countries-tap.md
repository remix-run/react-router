---
"@react-router/dev": patch
---

Improve performance of `future.unstable_middleware` by ensuring that route modules are only blocking during the middleware phase when the `unstable_clientMiddleware` has been defined
