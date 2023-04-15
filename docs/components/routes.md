---
title: Routes
---

# `<Routes>`

Rendered anywhere in the app, `<Routes>` will match a set of child routes from the current [location][location].

```tsx
interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}

<Routes location>
  <Route />
</Routes>;
```

<docs-info>If you're using a data router like [`createBrowserRouter`][createbrowserrouter] it is uncommon to use this component as it does not participate in data loading.</docs-info>

Whenever the location changes, `<Routes>` looks through all its child routes to find the best match and renders that branch of the UI. `<Route>` elements may be nested to indicate nested UI, which also correspond to nested URL paths. Parent routes render their child routes by rendering an [`<Outlet>`][outlet].

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

[location]: ../utils/location
[outlet]: ./outlet
[use-route]: ../hooks/use-routes
[createbrowserrouter]: ../routers/create-browser-router
