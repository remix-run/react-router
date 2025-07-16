---
title: useRoutes
---

# useRoutes

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRoutes.html)

Hook version of [`<Routes>`](../components/Routes) that uses objects instead of components. These objects have the same properties as the component props.
The return value of `useRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

```tsx
import * as React from "react";
import { useRoutes } from "react-router";

function App() {
  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
      children: [
        {
          path: "messages",
          element: <DashboardMessages />,
        },
        { path: "tasks", element: <DashboardTasks /> },
      ],
    },
    { path: "team", element: <AboutPage /> },
  ]);

  return element;
}
```

## Signature

```tsx
function useRoutes(
  routes: RouteObject[],
  locationArg?: Partial<Location> | string,
): React.ReactElement | null
```

## Params

### routes

An array of route objects that define the route hierarchy

### locationArg

An optional location object or pathname string to use instead of the current location

## Returns

A React element to render the matched route, or `null` if no routes matched

