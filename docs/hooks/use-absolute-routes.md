---
title: useAbsoluteRoutes
---

# `useAbsoluteRoutes`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useAbsoluteRoutes(
  routes: RouteObject[],
  location?: Partial<Location> | string;
): React.ReactElement | null;
```

</details>

The `useAbsoluteRoutes` hook is the functional equivalent of [`<AbsoluteRoutes>`][absoluteroutes], but it uses JavaScript objects instead of `<Route>` elements to define your routes. These objects have the same properties as normal [`<Route>` elements][route], but they don't require JSX.

All route paths passed to `useAbsoluteRoutes` should be defined using absolute paths.

<docs-warning>This component is strictly a utility to be used to assist in migration from v5 to v6 so that folks can use absolute paths in descendant route definitions (which was a common pattern in RR v5). The intent is to remove this component in v7 so it is marked "deprecated" from the start as a reminder to work on moving your route definitions upwards out of descendant routes.<br/><br/>We expect the concept of "descendant routes" to be replaced by [Lazy Route Discovery][lazy-route-discovery-rfc] when that feature lands, so the plan is that folks can use `<AbsoluteRoutes>` to migrate from v5 to v6. Then, incrementally migrate those descendant routes to lazily discovered route `children` while on v6. Then when an eventual v7 releases, there will be no need for `AbsoluteRoutes` and it can be safely removed.</docs-warning>

The return value of `useAbsoluteRoutes` is either a valid React element you can use to render the route tree, or `null` if nothing matched.

```tsx
import * as React from "react";
import { useAbsoluteRoutes } from "react-router-dom";

function App() {
  return (
    <AbsoluteRoutes>
      <Route path="/" element={<h1>Home</h1>} />
      <Route path="/auth/*" element={<Auth />} />
    </AbsoluteRoutes>
  );
}

function Auth() {
  let element = useAbsoluteRoutes([
    path: "/auth",
    element: <AuthLayout />,
    children: [{
      path: "/auth",
      element: AuthHome,
    }, {
      path: "/auth/login",
      element: AuthLogin,
    }],
  }]);

  return element;
}
```

See also:

- [`useRoutes`][useroutes]

[absoluteroutes]: ../components/absolute-routes
[route]: ../components/route
[lazy-route-discovery-rfc]: https://github.com/remix-run/react-router/discussions/11113
[useroutes]: ./use-routes
