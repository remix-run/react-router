---
title: resolvePath
---

# resolvePath

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.resolvePath.html)

Returns a resolved [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html) object relative to the given pathname.

## Signature

```tsx
function resolvePath(to: To, fromPathname = "/"): Path
```

## Params

### to

The path to resolve, either a string or a partial [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html) object.

### fromPathname

The pathname to resolve the path from. Defaults to `/`.

## Returns

A [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html) object with the resolved pathname, search, and hash.

