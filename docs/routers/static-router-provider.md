---
title: StaticRouterProvider
new: true
---

# `<StaticRouterProvider>`

A `<StaticRouterProvider>` accepts a `router` from [`createStaticRouter()`][createstaticrouter] and a `context` from [`createStaticHandler()`][createstatichandler] and renders your application on the server (i.e., [Node][node] or another Javascript runtime). For a more complete overview, please refer to the [Server-Side Rendering][ssr] guide.

```jsx lines=[4,34-37]
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom/server";
import Root, {
  loader as rootLoader,
  ErrorBoundary as RootBoundary,
} from "./root";

const routes = [
  {
    path: "/",
    loader: rootLoader,
    Component: Root,
    ErrorBoundary: RootBoundary,
  },
];

export async function renderHtml(req) {
  let { query, dataRoutes } = createStaticHandler(routes);
  let fetchRequest = createFetchRequest(req);
  let context = await query(fetchRequest);

  // If we got a redirect response, short circuit and let our Express server
  // handle that directly
  if (context instanceof Response) {
    throw context;
  }

  let router = createStaticRouter(dataRoutes, context);
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouterProvider
        router={router}
        context={context}
      />
    </React.StrictMode>
  );
}
```

## Type Declaration

```ts
declare function StaticRouterProvider(props: {
  context: StaticHandlerContext;
  router: Router;
  hydrate?: boolean;
  nonce?: string;
}: JSX.Element;
```

## `context`

This is the `context` returned from the `createStaticHandler().query()` calls which contains all of the fetched data for the request.

## `router`

This is the router created via `createStaticRouter`

## `hydrate`

By default, `<StaticRouterProvider>` will stringify the required hydration data onto `window.__staticRouterHydrationData` in a `<script>` tag which will be read and automatically hydrated by `createBrowserRouter()`.

If you wish to do more advanced hydration manually, you can pass `hydrate={false}` to disable this automatic hydration. Client-side, you would then pass your own `hydrationData` to `createBrowserRouter`.

## `nonce`

When leveraging automatic hydration, you may provide a `nonce` value to be rendered onto the `<script>` tag and used along with your [Content Security Policy][nonce].

**See also:**

- [`createStaticHandler`][createstatichandler]
- [`createStaticRouter`][createstaticrouter]
- [`createBrowserRouter`][createbrowserrouter]

[node]: https://nodejs.org/
[ssr]: ../guides/ssr
[createstaticrouter]: ./create-static-router
[createstatichandler]: ./create-static-handler
[createbrowserrouter]: ./create-browser-router
[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script
