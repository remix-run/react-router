---
"react-router": patch
"@remix-run/router": patch
---

Avoid unecessary calls to `matchRoutes` when we can leverage `state.matches`
