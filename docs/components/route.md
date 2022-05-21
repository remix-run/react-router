---
title: Route
new: true
---

# `<Route>`

Routes are perhaps the most important part of a React Router app. They couple URL segments to components, data loading, and data mutations.

```tsx
<Route
  // it renders this element
  element={<Team />}
  // when the URL matches this segment
  path="teams/:teamId"
  // with this data before rendering
  loader={async ({ params }) => {
    return fetch(`/fake/api/teams/${params.teamId}.json`);
  }}
  // performs this mutation when data is submitted to it
  action={async ({ request }) => {
    return updateFakeTeam(await request.formData());
  }}
  // and renders this element in case something went wrong
  errorElement={<ErrorBoundary />}
/>
```

Routes can also exist to simply be submitted to:

```tsx
<Route
  path="/projects/:projectId/delete"
  action={async ({ params }) => {
    await fakeDeleteProject(params.projectId)
    return redirect("/projects");
  }}
>
```

## Type declaration

```tsx
declare function Route(
  props: RouteProps
): React.ReactElement | null;

interface RouteProps {
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  loader?: DataFunction;
  action?: DataFunction;
  element?: React.ReactNode | null;
  errorElement?: React.Node | null;
  children?: React.ReactNode;
}
```

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

[location]: ../hooks/location
[outlet]: ./outlet
[use-route]: ../hooks/use-routes
