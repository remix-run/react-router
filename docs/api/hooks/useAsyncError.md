---
title: useAsyncError
---

# useAsyncError

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useAsyncError.html)

Returns the rejection value from the closest [`<Await>`](../components/Await).

```tsx
import { Await, useAsyncError } from "react-router";

function ErrorElement() {
  const error = useAsyncError();
  return (
    <p>Uh Oh, something went wrong! {error.message}</p>
  );
}

// somewhere in your app
<Await
  resolve={promiseThatRejects}
  errorElement={<ErrorElement />}
/>;
```

## Signature

```tsx
function useAsyncError(): unknown
```

## Returns

The error that was thrown in the nearest [`Await`](../components/Await) component

