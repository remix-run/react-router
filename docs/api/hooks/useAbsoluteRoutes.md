---
title: useAbsoluteRoutes
---

# useAbsoluteRoutes

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useAbsoluteRoutes.html)

An alternate version of [useRoutes](./useRoutes) that expects absolute paths on routes instead of relative paths. This is mostly intended to be used as a tool to help migrate from v5 where absolute paths were a common pattern, or for when you want to define your paths in a separate data structure using absolute paths. This hook expects absolute paths both when used at the top level of your application, or within a set of descendant routes inside a splat route.

The return value of `useAbsoluteRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

```tsx
import * as React from "react";
import { useAbsoluteRoutes } from "react-router";

const routes = {
  dashboard: {
    path: "/dashboard",
    href: () => `/dashboard`,
  },
  dashboardMessages: {
    path: "/dashboard/messages",
    href: () => `/dashboard/messages`,
  },
  dashboardMessage: {
    path: "/dashboard/:id",
    href: (id: number) => `/dashboard/${id}`,
  },
};

function App() {
  let element = useAbsoluteRoutes([
    {
      path: routes.dashboard.path,
      element: <Dashboard />,
      children: [
        {
          path: routes.dashboardMessages.path,
          element: <DashboardMessages />,
          children: [
            {
              path: routes.dashboardMessage.path,
              element: <DashboardMessage />,
            },
          ],
        },
      ],
    },
  ]);

  return element;
}
```

## Signature

```tsx
useAbsoluteRoutes(routes, locationArg): undefined
```

## Params

### routes

[modes: framework, data, declarative]

Your routes to use to render this location, defined using absolute paths

### locationArg

[modes: framework, data, declarative]

The location to render instead of the current location
