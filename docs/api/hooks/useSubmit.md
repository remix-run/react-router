---
title: useSubmit
---

# useSubmit

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSubmit.html)

The imperative version of [`<Form>`](../components/Form) that lets you submit a form
from code instead of a user interaction.

```tsx
import { useSubmit } from "react-router";

function SomeComponent() {
  const submit = useSubmit();
  return (
    <Form onChange={(event) => submit(event.currentTarget)} />
  );
}
```

## Signature

```tsx
function useSubmit(): SubmitFunction
```

## Returns

A function that can be called to submit a [`Form`](../components/Form) imperatively.

