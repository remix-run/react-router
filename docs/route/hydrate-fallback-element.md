---
title: hydrateFallbackElement
new: true
---

# `hydrateFallbackElement`

If you are using [Server-Side Rendering][ssr] and you are leveraging [partial hydration][partialhydration], then you can specify an Element/Component to render for non-hydrated routes during the initial hydration of the application.

<docs-info>If you do not wish to specify a React element (i.e., `hydrateFallbackElement={<MyFallback />}`) you may specify an `HydrateFallback` component instead (i.e., `HydrateFallback={MyFallback}`) and React Router will call `createElement` for you internally.</docs-info>

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
let router = createBrowserRouter(
  [
    {
      id: "root",
      path: "/",
      loader: rootLoader,
      Component: Root,
      children: [
        {
          id: "invoice",
          path: "invoices/:id",
          loader: loadInvoice,
          Component: Invoice,
          HydrateFallback: InvoiceSkeleton,
        },
      ],
    },
  ],
  {
    future: {
      v7_partialHydration: true,
    },
    hydrationData: {
      root: {
        /*...*/
      },
      // No hydration data provided for the `invoice` route
    },
  }
);
```

<docs-warning>There is no default fallback and it will just render `null` at that route level, so it is recommended that you always provide your own fallback element.</docs-warning>

[pickingarouter]: ../routers/picking-a-router
[ssr]: ../guides/ssr
[partialhydration]: ../routers/create-browser-router#partial-hydration-data
