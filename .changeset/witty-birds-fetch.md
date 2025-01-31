---
"react-router": patch
---

Fix regression introduced in `7.1.4` via [#12800](https://github.com/remix-run/react-router/pull/12800) that caused issues navigating to hash routes inside splat routes for applications using Lazy Route Discovery (`patchRoutesOnNavigation`)
