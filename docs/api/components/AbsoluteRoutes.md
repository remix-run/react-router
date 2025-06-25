---
title: unstable_AbsoluteRoutes
---

# unstable_AbsoluteRoutes

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_AbsoluteRoutes.html)

An alternate version of [<Routes>](./Routes) that expects absolute paths on routes instead of relative paths. This is mostly intended to be used as a tool to help migrate from v5 where absolute paths were a common pattern, or for when you want to define your paths in a separate data structure using absolute paths.

```tsx
import {
  unstable_AbsoluteRoutes as AbsoluteRoutes,
  Route,
} from "react-router";

<AbsoluteRoutes>
  <Route path="/dashboard/*" element={<Dashboard />} />
</AbsoluteRoutes>;

function Dashboard() {
  return (
    <AbsoluteRoutes>
      <Route
        path="/dashboard/settings"
        element={<Settings />}
      />
      <Route path="/dashboard/users" element={<Users />} />
    </AbsoluteRoutes>
  );
}
```

## Props

### children

[modes: framework, data, declarative]

Nested [Route](../components/Route) elements using absolute paths

### location

[modes: framework, data, declarative]

The location to match against. Defaults to the current location.
