---
"@remix-run/router": patch
---

Fix a `future.v7_partialHydration` bug that would consider the router uninitialized if a route did not have a loader
