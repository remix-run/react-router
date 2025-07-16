---
title: createMemoryRouter
---

# createMemoryRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createMemoryRouter.html)

Create a new [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that manages the application path using an
in-memory [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack. Useful for non-browser environments without a DOM API.

## Signature

```tsx
function createMemoryRouter(
  routes: RouteObject[],
  opts?: MemoryRouterOpts,
): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Basename path for the application.

### opts.dataStrategy

Override the default data strategy of loading in parallel.
Only intended for advanced usage.

### opts.future

Future flags to enable for the router.

### opts.unstable_getContext

Function to provide the initial context values for all client side
navigations/fetches

### opts.hydrationData

Hydration data to initialize the router with if you have already performed
data loading on the server.

### opts.initialEntries

Initial entries in the in-memory history stack

### opts.initialIndex

Index of `initialEntries` the application should initialize to

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations.

## Returns

An initialized [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

