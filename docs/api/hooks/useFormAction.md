---
title: useFormAction
---

# useFormAction

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useFormAction.html)

Resolves the URL to the closest route in the component hierarchy instead of
the current URL of the app.

This is used internally by [`Form`](../components/Form) to resolve the `action` to the closest
route, but can be used generically as well.

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
function useFormAction(
  action?: string,
  {
    relative,
  }: {
    relative?: RelativeRoutingType;
  } = ,
): string {}
```

## Params

### action

The action to append to the closest route URL. Defaults to the closest route URL.

### options.relative

The relative routing type to use when resolving the action. Defaults to `"route"`.

## Returns

The resolved action URL.

