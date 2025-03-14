---
title: useRoutes
---

# useRoutes

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useRoutes.html)

Hook version of [Routes](../components/Routes) that uses objects instead of components. These objects have the same properties as the component props.

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
useRoutes(routes, locationArg): undefined
```

## Params

### routes

[modes: framework, data, declarative]

_No documentation_

### locationArg

[modes: framework, data, declarative]

_No documentation_
