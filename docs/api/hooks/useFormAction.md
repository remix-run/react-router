---
title: useFormAction
---

# useFormAction

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFormAction.html)

Resolves the URL to the closest route in the component hierarchy instead of the current URL of the app.

This is used internally by [`Form`](../components/Form) resolve the `action` to the closest route, but can be used generically as well.

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
useFormAction()
```

## Params

### action

The action to append to the closest route URL. If not provided, defaults to the closest route URL.

### options.relative

The relative routing type to use when resolving the action. Defaults to `"route"`.

