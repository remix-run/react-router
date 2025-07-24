---
title: createStaticHandler
---

# createStaticHandler

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/server.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createStaticHandler.html)

Create a static handler to perform server-side data loading

```tsx
export async function handleRequest(request: Request) {
  let { query, dataRoutes } = createStaticHandler(routes);
  let context = await query(request);

  if (context instanceof Response) {
    return context;
  }

  let router = createStaticRouter(dataRoutes, context);
  return new Response(
    ReactDOMServer.renderToString(<StaticRouterProvider ... />),
    { headers: { "Content-Type": "text/html" } }
  );
}
```

## Signature

```tsx
function createStaticHandler(
  routes: RouteObject[],
  opts?: CreateStaticHandlerOptions,
)
```

## Params

### routes

The [route objects](https://api.reactrouter.com/v7/types/react_router.RouteObject.html) to create a static handler for

### opts.basename

The base URL for the static handler (default: `/`)

### opts.future

Future flags for the static handler

## Returns

A static handler that can be used to query data for the provided
routes

