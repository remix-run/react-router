---
title: createHashRouter
---

# createHashRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createHashRouter.html)

Create a new data router that manages the application path via the URL hash.

## Signature

```tsx
createHashRouter(routes: RouteObject[], opts?: DOMRouterOpts): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Application basename

### opts.unstable_getContext

Function to provide the initial `context` values for all client side navigations/fetches

### opts.future

Future flags to enable for the router

### opts.hydrationData

Hydration data to initialize the router if you have already performed data loading on the server

### opts.dataStrategy

Override the default data strategy of loading in parallel. Only intended for advanced usage.

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations

### opts.window

Window object override - defaults to the global `window` instance

