---
"react-router": patch
---

Fix a potential race condition that can occur when rendering a `HydrateFallback` and initial loaders land before the `router.subscribe` call happens in the `RouterProvider` layout effect
