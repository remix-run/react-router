---
title: useResolvedPath
---

# useResolvedPath

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useResolvedPath.html)

Resolves the pathname of the given `to` value against the current
[`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html). Similar to [`useHref`](../hooks/useHref), but returns a
[`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html) instead of a string.

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
function useResolvedPath(
  to: To,
  {
    relative,
  }: {
    relative?: RelativeRoutingType;
  } = ,
): Path {}
```

## Params

### to

The path to resolve

### options.relative

Defaults to `"route"` so routing is relative to the route tree.                         Set to `"path"` to make relative routing operate against path segments.

## Returns

The resolved [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html) object with `pathname`, `search`, and `hash`

