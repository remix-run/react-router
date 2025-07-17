---
title: StaticRouterProvider
---

# StaticRouterProvider

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.StaticRouterProvider.html)

A [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that may not navigate to any other [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html).
This is useful on the server where there is no stateful UI.

```tsx
export async function handleRequest(request: Request) {
  let { query, dataRoutes } = createStaticHandler(routes);
  let context = await query(request));

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
function StaticRouterProvider({
  context,
  router,
  hydrate = true,
  nonce,
}: StaticRouterProviderProps)
```

## Props

### context

The [`StaticHandlerContext`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandlerContext.html) returned from [`StaticHandler`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandler.html)'s
`query`

### hydrate

Whether to hydrate the router on the client (default `true`)

### nonce

The [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
to use for the hydration [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
tag

### router

The static [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) from [`createStaticRouter`](../data-routers/createStaticRouter)

