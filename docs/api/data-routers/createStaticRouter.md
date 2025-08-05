---
title: createStaticRouter
---

# createStaticRouter

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createStaticRouter.html)

Create a static [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) for server-side rendering

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
function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext,
  opts: {
    future?: Partial<FutureConfig>;
  } = ,
): DataRouter {}
```

## Params

### routes

The route objects to create a static [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) for

### context

The [`StaticHandlerContext`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandlerContext.html) returned from [`StaticHandler`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandler.html)'s `query`

### opts.future

Future flags for the static [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html)

## Returns

A static [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that can be used to render the provided routes

