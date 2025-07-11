---
title: useRouteError
---

# useRouteError

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteError.html)

Accesses the error thrown during an [ActionFunction](https://api.reactrouter.com/v7/interfaces/react_router.ActionFunction.html), [LoaderFunction](https://api.reactrouter.com/v7/types/react_router.LoaderFunction.html), or component render to be used in a route module Error Boundary.

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
