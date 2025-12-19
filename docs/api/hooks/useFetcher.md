---
title: useFetcher
---

# useFetcher

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFetcher.html)

Useful for creating complex, dynamic user interfaces that require multiple,
concurrent data interactions without causing a navigation.

Fetchers track their own, independent state and can be used to load data, submit
forms, and generally interact with [`action`](../../start/framework/route-module#action)
and [`loader`](../../start/framework/route-module#loader) functions.

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

  // reset fetcher
  fetcher.reset()
}
```

## Signature

```tsx
function useFetcher<T = any>({
  key,
}: {
  key?: string;
} = ): FetcherWithComponents<SerializeFrom<T>> {}
```

## Params

### options.key

A unique key to identify the fetcher. 

By default, `useFetcher` generates a unique fetcher scoped to that component.
If you want to identify a fetcher with your own key such that you can access
it from elsewhere in your app, you can do that with the `key` option:

```tsx
function SomeComp() {
  let fetcher = useFetcher({ key: "my-key" })
  // ...
}

// Somewhere else
function AnotherComp() {
  // this will be the same fetcher, sharing the state across the app
  let fetcher = useFetcher({ key: "my-key" });
  // ...
}
```

## Returns

A [`FetcherWithComponents`](https://api.reactrouter.com/v7/types/react_router.FetcherWithComponents.html) object that contains the fetcher's state, data, and components for submitting forms and loading data.

