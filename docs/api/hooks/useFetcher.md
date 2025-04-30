---
title: useFetcher
---

# useFetcher

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFetcher.html)

Useful for creating complex, dynamic user interfaces that require multiple, concurrent data interactions without causing a navigation.

Fetchers track their own, independent state and can be used to load data, submit forms, and generally interact with loaders and actions.

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
useFetcher(options): FetcherWithComponents
```

## Params

### options

[modes: framework, data]

_No documentation_
