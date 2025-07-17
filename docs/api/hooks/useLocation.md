---
title: useLocation
---

# useLocation

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useLocation.html)

Returns the current [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html). This can be useful if you'd like to
perform some side effect whenever it changes.

```tsx
import * as React from 'react'
import { useLocation } from 'react-router'

function SomeComponent() {
  let location = useLocation()

  React.useEffect(() => {
    // Google Analytics
    ga('send', 'pageview')
  }, [location]);

  return (
    // ...
  );
}
```

## Signature

```tsx
function useLocation(): Location
```

## Returns

The current [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) object

