---
"react-router": patch
---

Consolidate framework-agnostic and React-specific route type layers

This is an internal refactoring that consolidates the type hierarchy by removing the "Agnostic" prefix from route types and merging React-specific fields directly into the base type definitions. The following internal types have been renamed:

- `AgnosticIndexRouteObject` → `IndexRouteObject`
- `AgnosticNonIndexRouteObject` → `NonIndexRouteObject`
- `AgnosticRouteObject` → `RouteObject`
- `AgnosticDataIndexRouteObject` → `DataIndexRouteObject`
- `AgnosticDataNonIndexRouteObject` → `DataNonIndexRouteObject`
- `AgnosticDataRouteObject` → `DataRouteObject`
- `AgnosticRouteMatch` → `RouteMatch`
- `AgnosticDataRouteMatch` → `DataRouteMatch`

These types now live in `lib/router/utils.ts` with React-specific fields (element, Component, errorElement, ErrorBoundary, etc.) merged directly into the base definitions. The `lib/context.ts` file now re-exports these types instead of defining its own versions, eliminating ~70 lines of duplicate type definitions.

**This is a non-breaking change** as the `Agnostic*` types were never exported from the public API. All public-facing types (`RouteObject`, `DataRouteObject`, `RouteMatch`, `DataRouteMatch`) remain unchanged and continue to be exported from `react-router`.
