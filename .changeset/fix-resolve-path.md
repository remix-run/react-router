---
"react-router": patch
---

Fix bug in `useResolvedPath` that would cause `useResolvedPath(".")` in a splat route to lose the splat portion of the URL path.
