---
"@remix-run/router": patch
---

Fix regression introduced in `6.29.0` via [#12169](https://github.com/remix-run/react-router/pull/12169) that caused issues navigating to hash routes inside splat routes for applications using Lazy Route Discovery (`patchRoutesOnNavigation`)
