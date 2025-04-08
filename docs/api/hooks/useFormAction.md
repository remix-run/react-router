---
title: useFormAction
---

# useFormAction

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFormAction.html)

Resolves the URL to the closest route in the component hierarchy instead of the current URL of the app.

This is used internally by [Form](../components/Form) resolve the action to the closest route, but can be used generically as well.

```tsx
import { useFormAction } from "react-router";

function SomeComponent() {
  // closest route URL
  let action = useFormAction();

  // closest route URL + "destroy"
  let destroyAction = useFormAction("destroy");
}
```

## Signature

```tsx
useFormAction(action, __namedParameters): string
```

## Params

### action

[modes: framework, data]

The action to append to the closest route URL.

### \_\_namedParameters

[modes: framework, data]

_No documentation_
