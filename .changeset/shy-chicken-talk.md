---
"@remix-run/router": patch
---

Expose errors thrown from `patchRoutesOnNavigation` directly to `useRouteError` instead of wrapping them in a 400 `ErrorResponse` instance
