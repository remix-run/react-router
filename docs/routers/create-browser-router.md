---
title: createBrowserRouter
new: true
---

# `createBrowserRouter`

This is the recommended router for all React Router web projects. It uses the [DOM History API][historyapi] to update the URL and manage the history stack.

It also enables the v6.4 data APIs like [loaders][loader], [actions][action], [fetchers][fetcher] and more.

```tsx lines=[4,11-24]
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Root, { rootLoader } from "./routes/root";
import Team, { teamLoader } from "./routes/team";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "team",
        element: <Team />,
        loader: teamLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## Type Declaration

```tsx
function createBrowserRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    window?: Window;
  }
): RemixRouter;
```

## `routes`

An array of [`Route`][route] objects with nested routes on the `children` property.

```jsx
createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "events/:id",
        element: <Event />,
        loader: eventLoader,
      },
    ],
  },
]);
```

## `basename`

The basename of the app for situations where you can't deploy to the root of the domain, but a sub directory.

```jsx
createBrowserRouter(routes, {
  basename: "/app",
});
```

The trailing slash will be respected when linking to the root:

```jsx
createBrowserRouter(routes, {
  basename: "/app",
});
<Link to="/" />; // results in <a href="/app" />

createBrowserRouter(routes, {
  basename: "/app/",
});
<Link to="/" />; // results in <a href="/app/" />
```

## `window`

Useful for environments like browser devtool plugins or testing to use a different window than the global `window`.

[loader]: ../route/loader
[action]: ../route/action
[fetcher]: ../hooks/use-fetcher
[browser-router]: ./browser-router
[form]: ../components/form
[route]: ../components/route
[routes]: ../components/routes
[historyapi]: https://developer.mozilla.org/en-US/docs/Web/API/History
