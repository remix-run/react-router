---
title: useAsyncError
---

# useAsyncError

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useAsyncError.html)

Returns the rejection value from the closest [Await](../components/Await).

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
useAsyncError(): unknown
```
