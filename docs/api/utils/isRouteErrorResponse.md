---
title: isRouteErrorResponse
---

# isRouteErrorResponse

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.isRouteErrorResponse.html)

Check if the given error is an [`ErrorResponse`](https://api.reactrouter.com/v7/types/react_router.ErrorResponse.html) generated from a 4xx/5xx
[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
thrown from an [`action`](../../start/framework/route-module#action) or
[`loader`](../../start/framework/route-module#loader) function.

```tsx
import { isRouteErrorResponse } from "react-router";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <p>Error: `${error.status}: ${error.statusText}`</p>
        <p>{error.data}</p>
      </>
    );
  }

  return (
    <p>Error: {error instanceof Error ? error.message : "Unknown Error"}</p>
  );
}
```

## Signature

```tsx
function isRouteErrorResponse(error: any): error is ErrorResponse
```

## Params

### error

The error to check.

## Returns

`true` if the error is an [`ErrorResponse`](https://api.reactrouter.com/v7/types/react_router.ErrorResponse.html), `false` otherwise.

