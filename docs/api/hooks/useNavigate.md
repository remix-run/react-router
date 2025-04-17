---
title: useNavigate
---

# useNavigate

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigate.html)

Returns a function that lets you navigate programmatically in the browser in response to user interactions or effects.

```tsx
import { useNavigate } from "react-router";

function SomeComponent() {
  let navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate(-1);
      }}
    />
  );
}
```

It's often better to use [redirect](../utils/redirect) in [ActionFunction](../Other/ActionFunction) and [LoaderFunction](../Other/LoaderFunction) than this hook.

## Signature

```tsx
useNavigate(): NavigateFunction
```
