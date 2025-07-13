---
title: useSubmit
---

# useSubmit

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSubmit.html)

The imperative version of [`<Form>`](../components/Form) that lets you submit a form from code instead of a user interaction.

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
useSubmit(): SubmitFunction
```

