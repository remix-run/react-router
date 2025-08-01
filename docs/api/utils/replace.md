---
title: replace
---

# replace

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/variables/react_router.replace.html)

A redirect response that will perform a `history.replaceState` instead of a
`history.pushState` for client-side navigation redirects.
Sets the status code and the `Location` header.
Defaults to "302 Found".

```tsx
import { replace } from "react-router";

export function loader() {
  return replace("/new-location");
}
```

## Params

### url

The URL to redirect to.

### init

The status code or a `ResponseInit` object to be included in the response.

## Returns

A `Response` object with the redirect status and `Location` header.

