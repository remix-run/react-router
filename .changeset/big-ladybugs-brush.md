---
"react-router": patch
---

Update `Route.MetaArgs` to reflect that `data` can be potentially `undefined`

This is primarily for cases where a route `loader` threw an error to it's own `ErrorBoundary`. but it also arises in the case of a 404 which renders the root `ErrorBoundary`/`meta` but the root loader did not run because not routes matched.
