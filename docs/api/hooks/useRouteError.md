---
title: useRouteError
---

# useRouteError

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteError.html)

Accesses the error thrown during an [ActionFunction](../Other/ActionFunction), [LoaderFunction](../Other/LoaderFunction), or component render to be used in a route module Error Boundary.

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
