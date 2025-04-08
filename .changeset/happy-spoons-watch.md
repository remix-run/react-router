---
"react-router": patch
---

When using the object-based `route.lazy` API, the `HydrateFallback` and `hydrateFallbackElement` properties are now skipped when lazy loading routes after hydration.

If you move the code for these properties into a separate file, you can use this optimization to avoid downloading unused hydration code. For example:

```ts
createBrowserRouter([
  {
    path: "/show/:showId",
    lazy: {
      loader: async () => (await import("./show.loader.js")).loader,
      Component: async () => (await import("./show.component.js")).Component,
      HydrateFallback: async () =>
        (await import("./show.hydrate-fallback.js")).HydrateFallback,
    },
  },
]);
```
