---
title: Outlet
---

# Outlet

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Outlet.html)

Renders the matching child route of a parent route or nothing if no child
route matches.

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

## Signature

```tsx
function Outlet(props: OutletProps): React.ReactElement | null
```

## Props

### context

Provides a context value to the element tree below the outlet. Use when
the parent route needs to provide values to child routes.

```tsx
<Outlet context={myContextValue} />
```

Access the context with [`useOutletContext`](../hooks/useOutletContext).

