---
title: Routing
order: 3
---

# Routing

[MODES: data]

## Configuring Routes

Routes are configured as an argument to `matchRSCServerRequest`. At a minimum, you need a path and component:

```tsx
function Root() {
  return <h1>Hello world</h1>;
}

matchRSCServerRequest({
  // ...other options
  routes: [{ path: "/", Component: Root }],
});
```

While you can define components inline, we recommend for both startup performance, as well as code organization, using the `lazy()` option and defining [Route Modules][route_modules]:

```tsx filename=app/routes.ts
import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export function routes() {
  return [
    {
      id: "root",
      path: "",
      lazy: () => import("./root/route"),
      children: [
        {
          id: "home",
          index: true,
          lazy: () => import("./home/route"),
        },
        {
          id: "about",
          path: "about",
          lazy: () => import("./about/route"),
        },
      ],
    },
  ] satisfies RSCRouteConfig;
}
```

For more detailed information about the different route options, refer to the [Data Mode Routing][data_routing] documentation.

## Client Properties

Routes are defined on the server at runtime, but we can still provide `clientLoader`, `clientAction`, and `shouldRevalidate` through the utilization of client references and `"use client"`.

```tsx filename=app/root/route.client.tsx
"use client";

export function clientAction() {}

export function clientLoader() {}

export function shouldRevalidate() {}
```

We can then re-export these from our lazy loaded route module:

```tsx filename=app/root/route.tsx
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
} from "./route.client";

export default function Root() {
  // ...
}
```

[data_routing]: ../data/routing
[route_modules]: ./route-module