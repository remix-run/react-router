---
title: HashRouter
---

# HashRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.HashRouter.html)

A declarative [`<Router>`](../declarative-routers/Router) that stores the location in the
[`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) portion
of the URL so it is not sent to the server.

## Signature

```tsx
function HashRouter({ basename, children, window }: HashRouterProps)
```

## Props

### basename

Application basename

### children

``<Route>`` components describing your route configuration

### window

[`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
override. Defaults to the global `window` instance

