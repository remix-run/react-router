---
title: createBrowserRouter
new: true
---

# `createBrowserRouter`

This is the recommended router for all React Router web projects. It uses the [DOM History API][historyapi] to update the URL and manage the history stack.

It also enables the v6.4 data APIs like [loaders][loader], [actions][action], [fetchers][fetcher] and more.

<docs-info>Due to the decoupling of fetching and rendering in the design of the data APIs, you should create your router outside of the React tree with a statically defined set of routes. For more information on this design, please see the [Remixing React Router][remixing-react-router] blog post and the [When to Fetch][when-to-fetch] conference talk.</docs-info>

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
    future?: FutureConfig;
    hydrationData?: HydrationState;
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

## `future`

An optional set of [Future Flags][api-development-strategy] to enable for this Router. We recommend opting into newly released future flags sooner rather than later to ease your eventual migration to v7.

```js
const router = createBrowserRouter(routes, {
  future: {
    // Normalize `useNavigation()`/`useFetcher()` `formMethod` to uppercase
    v7_normalizeFormMethod: true,
  },
});
```

The following future flags are currently available:

| Flag                                        | Description                                                           |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `v7_fetcherPersist`                         | Delay active fetcher cleanup until they return to an `idle` state     |
| `v7_normalizeFormMethod`                    | Normalize `useNavigation().formMethod` to be an uppercase HTTP Method |
| `v7_partialHydration`                       | Support partial hydration for Server-rendered apps                    |
| `v7_prependBasename`                        | Prepend the router basename to navigate/fetch paths                   |
| [`v7_relativeSplatPath`][relativesplatpath] | Fix buggy relative path resolution in splat routes                    |

## `hydrationData`

When [Server-Rendering][ssr] and [opting-out of automatic hydration][hydrate-false], the `hydrationData` option allows you to pass in hydration data from your server-render. This will almost always be a subset of data from the `StaticHandlerContext` value you get back from [handler.query][query]:

```js
const router = createBrowserRouter(routes, {
  hydrationData: {
    loaderData: {
      // [routeId]: serverLoaderData
    },
    // may also include `errors` and/or `actionData`
  },
});
```

### Partial Hydration Data

You will almost always include a complete set of `loaderData` to hydrate a server-rendered app. But in advanced use-cases (such as Remix's [`clientLoader`][clientloader]), you may want to include `loaderData` for only _some_ routes that were rendered on the server. If you want to enable partial `loaderData` and opt-into granular [`route.HydrateFallback`][hydratefallback] usage, you will need to enable the `future.v7_partialHydration` flag. Prior to this flag, any provided `loaderData` was assumed to be complete and would not result in the execution of route loaders on initial hydration.

When this flag is specified, loaders will run on initial hydration in 2 scenarios:

- No hydration data is provided
  - In these cases the `HydrateFallback` component will render on initial hydration
- The `loader.hydrate` property is set to `true`
  - This allows you to run the `loader` even if you did not render a fallback on initial hydration (i.e., to prime a cache with hydration data)

```js
const router = createBrowserRouter(
  [
    {
      id: "root",
      loader: rootLoader,
      Component: Root,
      children: [
        {
          id: "index",
          loader: indexLoader,
          HydrateFallback: IndexSkeleton,
          Component: Index,
        },
      ],
    },
  ],
  {
    future: {
      v7_partialHydration: true,
    },
    hydrationData: {
      loaderData: {
        root: "ROOT DATA",
        // No index data provided
      },
    },
  }
);
```

## `window`

Useful for environments like browser devtool plugins or testing to use a different window than the global `window`.

[loader]: ../route/loader
[action]: ../route/action
[fetcher]: ../hooks/use-fetcher
[route]: ../route/route
[historyapi]: https://developer.mozilla.org/en-US/docs/Web/API/History
[api-development-strategy]: ../guides/api-development-strategy
[remixing-react-router]: https://remix.run/blog/remixing-react-router
[when-to-fetch]: https://www.youtube.com/watch?v=95B8mnhzoCM
[ssr]: ../guides/ssr
[hydrate-false]: ../routers/static-router-provider#hydrate
[query]: ./create-static-handler#handlerqueryrequest-opts
[clientloader]: https://remix.run/route/client-loader
[hydratefallback]: ../route/hydrate-fallback-element
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
