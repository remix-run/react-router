---
title: createBrowserRouter
---

# createBrowserRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx#L168
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createBrowserRouter.html)

Create a new data router that manages the application path via `history.pushState`
and `history.replaceState`.

## Signature

```tsx
createBrowserRouter(routes: RouteObject[], opts?: DOMRouterOpts): DataRouter
```

## Params

### opts.basename

Application basename

### opts.dataStrategy

Override the default data strategy of loading in parallel. Only intended for advanced usage.

### opts.future

Future flags to enable for the router

### opts.hydrationData

Hydration data to initialize the router if you have already performed data loading on the server

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations

### opts.unstable_getContext

Function to provide the initial `context` values for all client side navigations/fetches

### opts.window

Window object override - defaults to the global `window` instance

### routes

Application routes

## Returns

An initialized data router to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

