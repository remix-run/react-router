---
"react-router": minor
---

Add granular object-based API for `route.lazy` to support lazy loading of individual route properties, for example:

```ts
createBrowserRouter([
  {
    path: "/show/:showId",
    lazy: {
      loader: async () => (await import("./show.loader.js")).loader,
      action: async () => (await import("./show.action.js")).action,
      Component: async () => (await import("./show.component.js")).Component,
    },
  },
]);
```

**Breaking change for `unstable_middleware` consumers**

The `route.unstable_middleware` property is no longer supported in the return value from `route.lazy`. If you want to lazily load middleware, you must use the new object-based `route.lazy` API with `route.lazy.unstable_middleware`, for example:

```ts
createBrowserRouter([
  {
    path: "/show/:showId",
    lazy: {
      unstable_middleware: async () =>
        (await import("./show.middleware.js")).middleware,
      // etc.
    },
  },
]);
```
