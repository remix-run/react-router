---
"@remix-run/router": minor
---

Add a new `future.v7_partialHydration` future flag which enables partial hydration of a `RouterProvider`. This means that you can provide `hydrationData.loaderData` that has _some_ values in it - but not necessarily a value for every initially matched route that contains a loader. The router will call _only_ the loaders that do not have data on initalization, and it will render down to the deepest provided `Fallback` element (up to the first route without hydration data) while it executes the remaining loaders.

For example, the following router has a `root` and `index` route, but only provided `hydrationData.loaderData` for the `root` route. Because the `index` route has a `loader`, we need to run that during initialization. With `future.v7_partialHydration` specified, `<RouterProvider>` will render the `RootComponent` (because it has data) and then the `IndexFallback` (since it does not have data).

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
          Fallback: IndexFallback,
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

**Note:** When `future.v7_partialHydration` is provided, the `<RouterProvider fallbackElement>` prop is ignored since you can move it to a `Fallback` on your top-most route. The `fallbackElement` prop will be deprecated in React Router v7 when `v7_partialHydration` behavior becomes the standard behavior.
