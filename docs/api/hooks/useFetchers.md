---
title: useFetchers
---

# useFetchers

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFetchers.html)

Returns an array of all in-flight [`Fetcher`](https://api.reactrouter.com/v7/types/react_router.Fetcher.html)s. This is useful for components
throughout the app that didn't create the fetchers but want to use their submissions
to participate in optimistic UI.

```tsx
import { useFetchers } from "react-router";

function SomeComponent() {
  const fetchers = useFetchers();
  fetchers[0].formData; // FormData
  fetchers[0].state; // etc.
  // ...
}
```

## Signature

```tsx
function useFetchers(): (Fetcher & {
  key: string;
})[]
```

## Returns

An array of all in-flight [`Fetcher`](https://api.reactrouter.com/v7/types/react_router.Fetcher.html)s, each with a unique `key`
property.

