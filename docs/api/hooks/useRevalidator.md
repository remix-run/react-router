---
title: useRevalidator
---

# useRevalidator

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRevalidator.html)

Revalidate the data on the page for reasons outside of normal data mutations like window focus or polling on an interval.

```tsx
import { useRevalidator } from "react-router";

function WindowFocusRevalidator() {
  const revalidator = useRevalidator();

  useFakeWindowFocus(() => {
    revalidator.revalidate();
  });

  return (
    <div hidden={revalidator.state === "idle"}>
      Revalidating...
    </div>
  );
}
```

Note that page data is already revalidated automatically after actions. If you find yourself using this for normal CRUD operations on your data in response to user interactions, you're probably not taking advantage of the other APIs like [useFetcher](../hooks/useFetcher), [Form](../components/Form), [useSubmit](../hooks/useSubmit) that do this automatically.

## Signature

```tsx
useRevalidator(): undefined
```
