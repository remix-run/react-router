---
title: HydratedRouter
---

# HydratedRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom-export/hydrated-router.tsx
-->

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.dom_export.HydratedRouter.html)

Framework-mode router component to be used to hydrate a router from a
[`ServerRouter`](../framework-routers/ServerRouter). See [`entry.client.tsx`](../framework-conventions/entry.client.tsx).

## Signature

```tsx
function HydratedRouter(props: HydratedRouterProps)
```

## Props

### unstable_getContext

Context object to be passed through to [`createBrowserRouter`](../data-routers/createBrowserRouter) and made
available to
[`clientAction`](../../start/framework/route-module#clientAction)/[`clientLoader`](../../start/framework/route-module#clientLoader)
functions

