---
title: useSearchParams
---

# useSearchParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSearchParams.html)

Returns a tuple of the current URL's URLSearchParams and a function to update them. Setting the search params causes a navigation.

```tsx
import { useSearchParams } from "react-router";

export function SomeComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ...
}
```

## Signature

```tsx
useSearchParams(defaultInit): undefined
```

## Params

### defaultInit

[modes: framework, data, declarative]

_No documentation_
