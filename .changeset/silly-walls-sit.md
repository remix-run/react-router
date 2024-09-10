---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

- Fix types for `RouteObject` within `unstable_PatchRoutesOnNavigationFunction`'s `patch` method so it doesn't expect agnostic route objects passed to `patch`
- Add new `unstable_PatchRoutesOnNavigationFunctionArgs` type for convenience
