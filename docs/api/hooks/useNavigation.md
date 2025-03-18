---
title: useNavigation
---

# useNavigation

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
useNavigation(): Navigation
```
