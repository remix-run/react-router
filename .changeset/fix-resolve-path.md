---
"react-router": patch
---

Fix bug in `useResolvedPath` that would cause `useResolvedPath(".")` in a splat route to lose the splat portion of the URL path.

- ⚠️ This fixes a quite long-standing bug specifically for `"."` paths inside a splat route which incorrectly dropped the splat portion of the URL. If you are relative routing via `"."` inside a splat route in your application you should double check that your logic is not relying on this buggy behavior and update accordingly.
