---
title: useLoaderData
---

# useLoaderData

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useLoaderData.html)

Returns the data from the closest route [LoaderFunction](../Other/LoaderFunction) or [ClientLoaderFunction](../Other/ClientLoaderFunction).

```tsx
import { useLoaderData } from "react-router";

export async function loader() {
  return await fakeDb.invoices.findAll();
}

export default function Invoices() {
  let invoices = useLoaderData<typeof loader>();
  // ...
}
```

## Signature

```tsx
useLoaderData(): SerializeFrom
```
