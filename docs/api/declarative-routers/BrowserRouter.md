---
title: BrowserRouter
---

# BrowserRouter

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.BrowserRouter.html)

A declarative [`<Router>`](../declarative-routers/Router) using the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
API for client-side routing.

## Signature

```tsx
function BrowserRouter({
  basename,
  children,
  unstable_useTransitions,
  window,
}: BrowserRouterProps)
```

## Props

### basename

Application basename

### children

``<Route>`` components describing your route configuration

### unstable_useTransitions

Control whether router state updates are internally wrapped in
[`React.startTransition`](https://react.dev/reference/react/startTransition).

- When left `undefined`, all router state updates are wrapped in
  `React.startTransition`
- When set to `true`, [`Link`](../components/Link) and [`Form`](../components/Form) navigations will be wrapped
  in `React.startTransition` and all router state updates are wrapped in
  `React.startTransition`
- When set to `false`, the router will not leverage `React.startTransition`
  on any navigations or state changes.

For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).

### window

[`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
override. Defaults to the global `window` instance

