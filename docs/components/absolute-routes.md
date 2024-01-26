---
title: AbsoluteRoutes
---

# `<AbsoluteRoutes>`

Rendered anywhere in the app, `<AbsoluteRoutes>` will match a set of child routes using absolute paths against the current [location][location] pathname.

```tsx
interface AbsoluteRoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}
```

<docs-info>If you're using a data router like [`createBrowserRouter`][createbrowserrouter] it is uncommon to use this component as routes defined as part of a descendant `<AbsoluteRoutes>` tree cannot leverage the [Data APIs][data-apis] available to [`RouterProvider`][router-provider] apps. You **can and should** use this component within your `RouterProvider` application [while you are migrating][migrating-to-router-provider].</docs-info>

<docs-warning>This component is strictly a utility to be used to assist in migration from v5 to v6 so that folks can use absolute paths in descendant route definitions (which was a common pattern in RR v5). The intent is to remove this component in v7 so it is marked "deprecated" from the start as a reminder to work on moving your route definitions upwards out of descendant routes.<br/><br/>We expect the concept of "descendant routes" to be replaced by [Lazy Route Discovery][lazy-route-discovery-rfc] when that feature lands, so the plan is that folks can use `<AbsoluteRoutes>` to migrate from v5 to v6. Then, incrementally migrate those descendant routes to lazily discovered route `children` while on v6. Then when an eventual v7 releases, there will be no need for `AbsoluteRoutes` and it can be safely removed.</docs-warning>

Whenever the location changes, `<AbsoluteRoutes>` looks through all its child routes to find the best absolute-path match and renders that branch of the UI. `<Route>` elements may be nested to indicate nested UI, but their paths should all be specified via absolute paths. Parent routes render their child routes by rendering an [`<Outlet>`][outlet].

```tsx
function App() {
  return (
    <AbsoluteRoutes>
      <Route path="/" element={<h1>Home</h1>} />
      <Route path="/auth/*" element={<Auth />} />
    </AbsoluteRoutes>
  );
}

function Auth() {
  return (
    <AbsoluteRoutes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="/auth" element={<AuthHome />} />
        <Route path="/auth/login" element={<AuthLogin />} />
      </Route>
    </AbsoluteRoutes>
  );
}
```

See also:

- [`<Routes>`][routes]

[location]: ../utils/location
[outlet]: ./outlet
[createbrowserrouter]: ../routers/create-browser-router
[data-apis]: ../routers/picking-a-router#data-apis
[router-provider]: ../routers/router-provider
[migrating-to-router-provider]: ../upgrading/v6-data
[lazy-route-discovery-rfc]: https://github.com/remix-run/react-router/discussions/11113
[routes]: ./routes
