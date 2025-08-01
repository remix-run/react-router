---
title: redirect
---

# redirect

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/variables/react_router.redirect.html)

A redirect response. Sets the status code and the `Location` header.
Defaults to "302 Found".

```tsx
import { redirect } from "react-router";

export function loader({ request }) {
  if (!isLoggedIn(request))
    throw redirect("/login");
  }

  // ...
}
```

## Params

### url

The URL to redirect to.

### init

The status code or a `ResponseInit` object to be included in the response.

## Returns

A `Response` object with the redirect status and `Location` header.

