---
title: useRouteError
---

# useRouteError

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
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
useRouteError(): unknown
```

