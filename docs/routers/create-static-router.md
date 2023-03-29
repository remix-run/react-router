---
title: createStaticRouter
new: true
---

# `createStaticRouter`

`createStaticRouter` is used when you want to leverage a [data router][picking-a-router] for rendering on your server (i.e., [Node][node] or another Javascript runtime). For a more complete overview, please refer to the [Server-Side Rendering][ssr] guide.

```jsx lines=[3,31]
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
declare function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext
): Router;
```

**See also:**

- [`createStaticHandler`][createstatichandler]
- [`<StaticRouterProvider>`][staticrouterprovider]

[picking-a-router]: ./picking-a-router
[node]: https://nodejs.org/
[ssr]: ../guides/ssr
[createstatichandler]: ../routers/create-static-handler
[staticrouterprovider]: ../routers/static-router-provider
