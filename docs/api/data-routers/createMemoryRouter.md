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

Create a new data router that manages the application path using an in-memory
history stack.  Useful for non-browser environments without a DOM API.

## Signature

```tsx
function createMemoryRouter(routes: RouteObject[], opts?: MemoryRouterOpts): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Basename path for the application.

### opts.unstable_getContext

Function to provide the initial context values for all client side navigations/fetches

### opts.future

Future flags to enable for the router.

### opts.hydrationData

Hydration data to initialize the router with if you have already performed
data loading on the server.

### opts.initialEntries

Initial entires in the in-memory history stack

### opts.initialIndex

Index of `initialEntries` the application should initialize to

### opts.dataStrategy

Override the default data strategy of loading in parallel.
Only intended for advanced usage.

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations.

## Returns

An initialized data router to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

