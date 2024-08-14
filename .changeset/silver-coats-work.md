---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

Rename `unstable_patchRoutesOnMiss` to `unstable_patchRoutesOnNavigation` because it will now be called on the first navigation to paths matching splat/param routes in case there exists a higher-scoring route match not yet discovered
