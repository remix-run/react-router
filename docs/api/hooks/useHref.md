---
title: useHref
---

# useHref

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useHref.html)

Resolves a URL against the current [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html).

```tsx
import { useHref } from "react-router";

function SomeComponent() {
  let href = useHref("some/where");
  // "/resolved/some/where"
}
```

## Signature

```tsx
function useHref(
  to: To,
  {
    relative,
  }: {
    relative?: RelativeRoutingType;
  } = ,
): string {}
```

## Params

### to

The path to resolve

### options.relative

Defaults to `"route"` so routing is relative to the route tree.
Set to `"path"` to make relative routing operate against path segments.

## Returns

The resolved href string

