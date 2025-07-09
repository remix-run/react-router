---
title: useResolvedPath
---

# useResolvedPath

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useResolvedPath.html)

Resolves the pathname of the given `to` value against the current location. Similar to [`useHref`](../hooks/useHref), but returns a `Path` instead of a string.

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
useResolvedPath(to: To, { relative }: {
    relative?: RelativeRoutingType;
} = {}): Path
```

## Params

### to

The path to resolve

### options.relative

Defaults to "route" so routing is relative to the route tree.                         Set to "path" to make relative routing operate against path segments.

