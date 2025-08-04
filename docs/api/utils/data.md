---
title: data
---

# data

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.data.html)

Create "responses" that contain `headers`/`status` without forcing
serialization into an actual [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)

```tsx
import { data } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let item = await createItem(formData);
  return data(item, {
    headers: { "X-Custom-Header": "value" }
    status: 201,
  });
}
```

## Signature

```tsx
function data<D>(data: D, init?: number | ResponseInit)
```

## Params

### data

The data to be included in the response.

### init

The status code or a `ResponseInit` object to be included in the response.

## Returns

A `DataWithResponseInit` instance containing the data and
response init.

