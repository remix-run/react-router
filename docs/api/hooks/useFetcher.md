---
title: useFetcher
---

# useFetcher

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFetcher.html)

Useful for creating complex, dynamic user interfaces that require multiple, concurrent data interactions without causing a navigation.

Fetchers track their own, independent state and can be used to load data, submit forms, and generally interact with [`action`](../../start/framework/route-module#action)s and [`loader`](../../start/framework/route-module#loader)s and actions.

```tsx
import { useFetcher } from "react-router"

function SomeComponent() {
  let fetcher = useFetcher()

  // states are available on the fetcher
  fetcher.state // "idle" | "loading" | "submitting"
  fetcher.data // the data returned from the action or loader

  // render a form
  <fetcher.Form method="post" />

  // load data
  fetcher.load("/some/route")

  // submit data
  fetcher.submit(someFormRef, { method: "post" })
  fetcher.submit(someData, {
    method: "post",
    encType: "application/json"
  })
}
```

## Signature

```tsx
useFetcher<T = any>({ key, }: {})
```

## Params

### options.key

A unique key to identify the fetcher. If not provided, a unique key will be generated for the fetcher.

