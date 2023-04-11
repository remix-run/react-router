---
"@remix-run/router": patch
---

Deprecate the `createRouter` `detectErrorBoundary` option in favor of the new `mapRouteProperties` option for converting a framework-agnostic route to a framework-aware route. This allows us to set more than just the `hasErrorBoundary` property during route pre-processing, and is now used for mapping `Component -> element` and `ErrorBoundary -> errorElement` in `react-router`.
