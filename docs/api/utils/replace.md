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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.replace.html)

A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
that will perform a [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
instead of a [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
for client-side navigation redirects. Sets the status code and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).

```tsx
import { replace } from "react-router";

export async function loader() {
  return replace("/new-location");
}
```

## Params

### url

The URL to redirect to.

### init

The status code or a `ResponseInit` object to be included in the response.

## Returns

A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
header.

