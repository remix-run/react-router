---
title: matchRoutes
---

# `matchRoutes`

<details>
  <summary>Type declaration</summary>

```tsx
declare function matchRoutes(
  routes: RouteObject[],
  location: Partial<Location> | string,
  basename?: string
): RouteMatch[] | null;

interface RouteMatch<ParamKey extends string = string> {
  params: Params<ParamKey>;
  pathname: string;
  route: RouteObject;
}
```

</details>

`matchRoutes` runs the route matching algorithm for a set of routes against a given [`location`][location] to see which routes (if any) match. If it finds a match, an array of `RouteMatch` objects is returned, one for each route that matched.

This is the heart of React Router's matching algorithm. It is used internally by [`useRoutes`][useroutes] and the [`<Routes>` component][routes] to determine which routes match the current location. It can also be useful in some situations where you want to manually match a set of routes.

[location]: ./location
[useroutes]: ../hooks/use-routes
[routes]: ../components/routes
