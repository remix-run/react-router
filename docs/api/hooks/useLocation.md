---
title: useLocation
---

# useLocation

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useLocation.html)

Returns the current [Location]([../Other/Location](https://api.reactrouter.com/v7/interfaces/react_router.Location.html)). This can be useful if you'd like to perform some side effect whenever it changes.

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
useLocation(): Location
```
