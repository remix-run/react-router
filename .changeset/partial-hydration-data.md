---
"@remix-run/router": minor
---

Added a new `future.v7_partialHydration` future flag that enables partial hydration of a data router when Server-Side Rendering. This allows you to provide `hydrationData.loaderData` that has values for _some_ initially matched route loaders, but not all. When this flag is enabled, the router will call `loader` functions for routes that do not have hydration loader data during `router.initialize()`, and it will render down to the deepest provided `HydrateFallback` (up to the first route without hydration data) while it executes the unhydrated routes.

For example, the following router has a `root` and `index` route, but only provided `hydrationData.loaderData` for the `root` route. Because the `index` route has a `loader`, we need to run that during initialization. With `future.v7_partialHydration` specified, `<RouterProvider>` will render the `RootComponent` (because it has data) and then the `IndexFallback` (since it does not have data). Once `indexLoader` finishes, application will update and display `IndexComponent`.

```jsx
let router = createBrowserRouter(
  [
    {
      id: "root",
      path: "/",
      loader: rootLoader,
      Component: RootComponent,
      Fallback: RootFallback,
      children: [
        {
          id: "index",
          index: true,
          loader: indexLoader,
          Component: IndexComponent,
          HydrateFallback: IndexFallback,
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
        root: { message: "Hydrated from Root!" },
      },
    },
  }
);
```

If the above example did not have an `IndexFallback`, then `RouterProvider` would instead render the `RootFallback` while it executed the `indexLoader`.

**Note:** When `future.v7_partialHydration` is provided, the `<RouterProvider fallbackElement>` prop is ignored since you can move it to a `Fallback` on your top-most route. The `fallbackElement` prop will be removed in React Router v7 when `v7_partialHydration` behavior becomes the standard behavior.
