---
"@remix-run/router": patch
---

Fix a `future.v7_partialHydration` bug that would re-run loaders below the boundary on hydration if SSR loader errors bubbled to a parent boundary
