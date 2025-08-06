---
title: useActionData
---

# useActionData

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useActionData.html)

Returns the [`action`](../../start/framework/route-module#action) data from
the most recent `POST` navigation form submission or `undefined` if there
hasn't been one.

```tsx
import { Form, useActionData } from "react-router";

export async function action({ request }) {
  const body = await request.formData();
  const name = body.get("visitorsName");
  return { message: `Hello, ${name}` };
}

export default function Invoices() {
  const data = useActionData();
  return (
    <Form method="post">
      <input type="text" name="visitorsName" />
      {data ? data.message : "Waiting..."}
    </Form>
  );
}
```

## Signature

```tsx
function useActionData<T = any>(): SerializeFrom<T> | undefined
```

## Returns

The data returned from the route's [`action`](../../start/framework/route-module#action)
function, or `undefined` if no [`action`](../../start/framework/route-module#action)
has been called

