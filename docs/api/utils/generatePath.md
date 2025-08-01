---
title: generatePath
---

# generatePath

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.generatePath.html)

Returns a path with params interpolated.

```tsx
import { generatePath } from "react-router";

generatePath("/users/:id", { id: "123" }); // "/users/123"
```

## Signature

```tsx
function generatePath<Path extends string>(
  originalPath: Path,
  params: {
    [key in PathParam<Path>]: string | null;
  } =  as any,
): string {}
```

## Params

### originalPath

The original path to generate.

### params

The parameters to interpolate into the path.

## Returns

The generated path with parameters interpolated.

