---
title: Outlet
---

# Outlet

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Outlet.html)

Renders the matching child route of a parent route or nothing if no child route matches.

```tsx
import { Outlet } from "react-router";

export default function SomeParent() {
  return (
    <div>
      <h1>Parent Content</h1>
      <Outlet />
    </div>
  );
}
```

## Props

### context

[modes: framework, data, declarative]

Provides a context value to the element tree below the outlet. Use when the parent route needs to provide values to child routes.

```tsx
<Outlet context={myContextValue} />
```

Access the context with [useOutletContext](../hooks/useOutletContext).
