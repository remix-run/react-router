---
title: useNavigation
---

# useNavigation

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx#L1174
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigation.html)

Returns the current navigation, defaulting to an "idle" navigation when no navigation is in progress. You can use this to render pending UI (like a global spinner) or read FormData from a form navigation.

```tsx
import { useNavigation } from "react-router";

function SomeComponent() {
  let navigation = useNavigation();
  navigation.state;
  navigation.formData;
  // etc.
}
```

## Signature

```tsx
function useNavigation(): Navigation
```

## Returns

The current navigation object

