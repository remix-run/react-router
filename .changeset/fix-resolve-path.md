---
"react-router": patch
---

Fix bug in `useResolvedPath` that would cause `useResolvedPath(".")` in a param or splat route to lose the params/splat portion of the URL path
