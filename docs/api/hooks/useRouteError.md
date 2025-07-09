---
title: useRouteError
---

# useRouteError

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRouteError.html)

Accesses the error thrown during an `action`, `loader`, or component render to be used in a route module `ErrorBoundary`.

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

