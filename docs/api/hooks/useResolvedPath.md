---
title: useResolvedPath
---

# useResolvedPath

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useResolvedPath.html)

Resolves the pathname of the given `to` value against the current location. Similar to [useHref](../hooks/useHref), but returns a [Path](../Other/Path) instead of a string.

```tsx
import { useResolvedPath } from "react-router";

function SomeComponent() {
  // if the user is at /dashboard/profile
  let path = useResolvedPath("../accounts");
  path.pathname; // "/dashboard/accounts"
  path.search; // ""
  path.hash; // ""
}
```

## Signature

```tsx
useResolvedPath(to, __namedParameters): Path
```

## Params

### to

[modes: framework, data, declarative]

_No documentation_

### \_\_namedParameters

[modes: framework, data, declarative]

_No documentation_
