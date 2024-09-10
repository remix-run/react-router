---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

- Fix types for `RouteObject` within `PatchRoutesOnNavigationFunction`'s `patch` method so it doesn't expect agnostic route objects passed to `patch`
- Add new `PatchRoutesOnNavigationFunctionArgs` type for convenience
