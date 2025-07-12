---
title: useOutlet
---

# useOutlet

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useOutlet.html)

Returns the element for the child route at this level of the route
hierarchy. Used internally by [`<Outlet>`](../components/Outlet) to render child
routes.

## Signature

```tsx
function useOutlet(context?: unknown): React.ReactElement | null
```

## Params

### context

The context to pass to the outlet

## Returns

The child route element or `null` if no child routes match

