---
"@remix-run/router": patch
---

Fog of War: Update `unstable_patchRoutesOnMiss` logic so that we call the method when we match routes with dynamic param or splat segments in case there exists a higher-scoring static route that we've not yet discovered.

- We also now leverage an internal FIFO queue of previous paths we've already called `unstable_patchRouteOnMiss` against so that we don't re-call on subsequent navigations to the same path
