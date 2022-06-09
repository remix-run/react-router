---
title: createRoutesFromChildren
---

# `createRoutesFromChildren`

<details>
  <summary>Type declaration</summary>

```tsx
declare function createRoutesFromChildren(
  children: React.ReactNode
): RouteObject[];

interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}
```

</details>

`createRoutesFromChildren` is a helper that creates route objects from `<Route>` elements. It is used internally in a [`<Routes>` element][routes] to generate a route config from its [`<Route>`][route] children.

[routes]: ../components/routes
[route]: ../components/route
