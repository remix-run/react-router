---
"react-router": major
---

Imports/Exports cleanup

- Removed the following exports that were previously public API from `@remix-run/router`
  - types
    - `AgnosticDataIndexRouteObject`
    - `AgnosticDataNonIndexRouteObject`
    - `AgnosticDataRouteMatch`
    - `AgnosticDataRouteObject`
    - `AgnosticIndexRouteObject`
    - `AgnosticNonIndexRouteObject`
    - `AgnosticRouteMatch`
    - `AgnosticRouteObject`
    - `TrackedPromise`
    - `unstable_AgnosticPatchRoutesOnMissFunction`
    - `Action` -> exported as `NavigationType` via `react-router`
    - `Router` exported as `RemixRouter` to differentiate from RR's `<Router>`
  - API
    - `getToPathname` (`@private`)
    - `joinPaths` (`@private`)
    - `normalizePathname` (`@private`)
    - `resolveTo` (`@private`)
    - `stripBasename` (`@private`)
    - `createBrowserHistory` -> in favor of `createBrowserRouter`
    - `createHashHistory` -> in favor of `createHashRouter`
    - `createMemoryHistory` -> in favor of `createMemoryRouter`
    - `createRouter`
    - `createStaticHandler` -> in favor of wrapper `createStaticHandler` in RR Dom
    - `getStaticContextFromError`
- Removed the following exports that were previously public API from `react-router`
  - `Hash`
  - `Pathname`
  - `Search`
