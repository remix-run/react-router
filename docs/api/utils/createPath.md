---
title: createPath
---

# createPath

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/history.ts
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createPath.html)

Creates a string URL path from the given pathname, search, and hash components.

## Signature

```tsx
function createPath({
  pathname = "/",
  search = "",
  hash = "",
}: Partial<Path>)
```

## Params

### path

The pathname, search, and hash components to combine.

## Returns

The combined URL path.

