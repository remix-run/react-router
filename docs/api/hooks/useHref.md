---
title: useHref
---

# useHref

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useHref.html)

Resolves a URL against the current location.

```tsx
import { useHref } from "react-router";

function SomeComponent() {
  let href = useHref("some/where");
  // "/resolved/some/where"
}
```

## Signature

```tsx
useHref(to: To, { relative }: {
    relative?: RelativeRoutingType;
} = {}): string
```

## Params

### to

The path to resolve

### options.relative

Defaults to "route" so routing is relative to the route tree. Set to "path" to make relative routing operate against path segments.

