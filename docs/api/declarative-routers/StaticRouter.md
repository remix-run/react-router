---
title: StaticRouter
---

# StaticRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/server.tsx
-->

[MODES: declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.StaticRouter.html)

A [`<Router>`](../declarative-routers/Router) that may not navigate to any other [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html).
This is useful on the server where there is no stateful UI.

## Signature

```tsx
function StaticRouter({
  basename,
  children,
  location: locationProp = "/",
}: StaticRouterProps)
```

## Props

### basename

The base URL for the static router (default: `/`)

### children

The child elements to render inside the static router

### location

The [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) to render the static router at (default: `/`)

