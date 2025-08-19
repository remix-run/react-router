---
title: useRouteError
---

# useRouteError

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteError.html)

Accesses the error thrown during an
[`action`](../../start/framework/route-module#action),
[`loader`](../../start/framework/route-module#loader),
or component render to be used in a route module
[`ErrorBoundary`](../../start/framework/route-module#errorboundary).

```tsx
export function ErrorBoundary() {
  const error = useRouteError();
  return <div>{error.message}</div>;
}
```

## Signature

```tsx
function useRouteError(): unknown
```

## Returns

The error that was thrown during route [loading](../../start/framework/route-module#loader),
[`action`](../../start/framework/route-module#action) execution, or rendering

