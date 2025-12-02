---
title: MemoryRouter
---

# MemoryRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.MemoryRouter.html)

A declarative [`<Router>`](../declarative-routers/Router) that stores all entries in memory.

## Signature

```tsx
function MemoryRouter({
  basename,
  children,
  initialEntries,
  initialIndex,
  unstable_useTransitions,
}: MemoryRouterProps): React.ReactElement
```

## Props

### basename

Application basename

### children

Nested [`Route`](../components/Route) elements describing the route tree

### initialEntries

Initial entries in the in-memory history stack

### initialIndex

Index of `initialEntries` the application should initialize to

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

