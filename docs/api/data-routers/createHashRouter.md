---
title: createHashRouter
---

# createHashRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createHashRouter.html)

Create a new [data router](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that manages the application
path via the URL [`hash`]https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).

## Signature

```tsx
function createHashRouter(routes: RouteObject[], opts?: DOMRouterOpts): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Basename path for the application.

### opts.future

Future flags to enable for the router.

### opts.unstable_getContext

Function to provide the initial `context` values for all client side navigations/fetches

### opts.hydrationData

Hydration data to initialize the router with if you have already performed
data loading on the server.

### opts.dataStrategy

Override the default data strategy of loading in parallel.
Only intended for advanced usage.

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations.

### opts.window

[`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
override - defaults to the global `window` instance.

## Returns

An initialized [data router](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

