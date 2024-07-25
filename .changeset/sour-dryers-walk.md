---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

Fix initial hydration behavior when using `future.v7_partialHydration` along with `unstable_patchRoutesOnMiss`

- During initial hydration, `router.state.matches` will now include any partial matches so that we can render ancestor `HydrateFallback` components
