---
"react-router": patch
---

[UNSTABLE] Update `Route.unstable_MiddlewareFunction` to have a return value of `Response | undefined` instead of `Response | void` becaue you should not return anything if you aren't returning the `Response`
