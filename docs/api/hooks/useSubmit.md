---
title: useSubmit
---

# useSubmit

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSubmit.html)

The imperative version of [Form](../components/Form) that lets you submit a form from code instead of a user interaction.

```tsx
import { useSubmit } from "react-router";

function SomeComponent() {
  const submit = useSubmit();
  return (
    <Form
      onChange={(event) => {
        submit(event.currentTarget);
      }}
    />
  );
}
```

## Signature

```tsx
useSubmit(): SubmitFunction
```
