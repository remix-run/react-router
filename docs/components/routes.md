---
title: Routes
---

# `<Routes>` and `<Route>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Routes(
  props: RoutesProps
): React.ReactElement | null;

interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}

declare function Route(
  props: RouteProps
): React.ReactElement | null;

interface RouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  index?: boolean;
  path?: string;
}
```

</details>

`<Routes>` and `<Route>` are the primary ways to render something in React Router based on the current [`location`][location]. You can think about a `<Route>` kind of like an `if` statement; if its `path` matches the current URL, it renders its `element`! The `<Route caseSensitive>` prop determines if the matching should be done in a case-sensitive manner (defaults to `false`).

Whenever the location changes, `<Routes>` looks through all its `children` `<Route>` elements to find the best match and renders that branch of the UI. `<Route>` elements may be nested to indicate nested UI, which also correspond to nested URL paths. Parent routes render their child routes by rendering an [`<Outlet>`][outlet].

```tsx
<Routes>
  <Route path="/" element={<Dashboard />}>
    <Route
      path="messages"
      element={<DashboardMessages />}
    />
    <Route path="tasks" element={<DashboardTasks />} />
  </Route>
  <Route path="about" element={<AboutPage />} />
</Routes>
```

> **Note:**
>
> If you'd prefer to define your routes as regular JavaScript objects instead
> of using JSX, [try `useRoutes` instead][use-routes].

The default `<Route element>` is an [`<Outlet>`][outlet]. This means the route will still render its children even without an explicit `element` prop, so you can nest route paths without nesting UI around the child route elements.

For example, in the following config the parent route renders an `<Outlet>` by default, so the child route will render without any surrounding UI. But the child route's path is `/users/:id` because it still builds on its parent.

```tsx
<Route path="users">
  <Route path=":id" element={<UserProfile />} />
</Route>
```

[location]: ../utils/location
[outlet]: ./outlet
[use-routes]: ../hooks/use-routes
