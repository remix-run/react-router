---
title: DataBrowserRouter
new: true
---

# `DataBrowserRouter`

This is the recommended router for all React Router DOM applications.

`DataBrowserRouter` enables the route data APIs like [loaders][loader], [actions][action], [fetchers][fetcher] and more for browser environments.

```tsx lines=[3,7,11]
import * as React from "react";
import * as ReactDOM from "react-dom";
import { DataBrowserRouter } from "react-router-dom";
import Root from "./routes/root";

ReactDOM.render(
  <DataBrowserRouter>
    <Route element={<Root />} loader={Root.loader}>
      <Route path="team" element={<Team />} loader={Team.loader}>
    </Route>
  </DataBrowserRouter>,
  root
);
```

## Type Declaration

```tsx
declare function DataBrowserRouter(
  props: DataBrowserRouterProps
): React.ReactElement;

export interface DataBrowserRouterProps {
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  window?: Window;
}
```

## `children`

The children should always be [`Route`][route] components.

```tsx lines=[2-8]
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Route path="/" element={<Root />} loader={rootLoader}>
    <Route
      path="events/:id"
      element={<Event />}
      loader={eventLoader}
    />
  </Route>
</DataBrowserRouter>
```

Unlike [`BrowserRouter`][browser-router], you do not use [`Routes`][routes].

<docs-error>Do not do this</docs-error>

```tsx bad lines=[2,10]
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Routes>
    <Route path="/" element={<Root />} loader={rootLoader}>
      <Route
        path="events/:id"
        element={<Event />}
        loader={eventLoader}
      />
    </Route>
  </Routes>
</DataBrowserRouter>
```

## `hydrationData`

When server side rendering your React Router app, it's likely the server fetched data and included it into the HTML. In order for the client side hydration to work, the routes need to be able to render with the same data.

Typically, SSR implementations will provide that data on `window`. The `hydrationData` prop enables `DataBrowserRouter` to render with the same data as the server without needing to fetch it again client side.

```tsx
// hypothetical implementation where the server puts the hydration data on
// `window.routeData`
<DataBrowserRouter
  hydrationData={{
    // data for the loaders keyed by route ids
    loaderData: {
      "/": window._remix.routeData.root,
      "/event/:id": window.routeData.event,
    },

    // data for an action, same shape as loaderData or null
    actionData: null,

    // if the server failed to load the data or render you can put the errors
    // keyed by route ID here to trigger the route error boundaries
    errors: null,
  }}
/>
```

## `fallbackElement`

If you are not server rendering your app, `DataBrowserRouter` will initiate all matching route loaders when it mounts. During this time, you can provide a `fallbackElement` to give the user some indication that the app is working.

```tsx
<DataBrowserRouter fallbackElement={<SpinnerOfDoom />} />
```

[loader]: ../route/loader
[action]: ../route/action
[fetcher]: ../hooks/use-fetcher
[browser-router]: ./browser-router
[form]: ../components/form
[route]: ../components/route
[routes]: ../components/routes
