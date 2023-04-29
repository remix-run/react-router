---
title: createStaticHandler
new: true
---

# `createStaticHandler`

`createStaticHandler` is used to perform the data fetching and submissions on the server (i.e., [Node][node] or another Javascript runtime) prior to server-side rendering your application via `<StaticRouterProvider>`. For a more complete overview, please refer to the [Server-Side Rendering][ssr] guide.

```jsx lines=[2,21-23]
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
declare function createStaticHandler(
  routes: RouteObject[],
  opts?: {
    basename?: string;
  }
): StaticHandler;

interface StaticHandler {
  dataRoutes: AgnosticDataRouteObject[];
  query(
    request: Request,
    opts?: {
      requestContext?: unknown;
    }
  ): Promise<StaticHandlerContext | Response>;
  queryRoute(
    request: Request,
    opts?: {
      routeId?: string;
      requestContext?: unknown;
    }
  ): Promise<any>;
}
```

## `routes`/`basename`

These are the same `routes`/`basename` you would pass to [`createBrowserRouter`][createbrowserrouter]

## `handler.query(request)`

The `handler.query()` method takes in a Fetch request, performs route matching, and executes all relevant route action/loader methods depending on the request. The return `context` value contains all of the information required to render the HTML document for the request (route-level `actionData`, `loaderData`, `errors`, etc.). If any of the matched routes return or throw a redirect response, then `query()` will return that redirect in the form of Fetch `Response`.

## `handler.queryRoute(request, routeId?)`

The `handler.queryRoute` is a more-targeted version that queries a singular route and runs it's loader or action based on the request. You can specify a specific `routeId` or let it match the appropriate route automatically based on the request. The return value is the values returned from the loader or action, which is usually a `Response` object.

**See also:**

- [`createStaticRouter`][createstaticrouter]
- [`<StaticRouterProvider>`][staticrouterprovider]

[node]: https://nodejs.org/
[ssr]: ../guides/ssr
[createbrowserrouter]: ./create-browser-router
[createstaticrouter]: ../routers/create-static-router
[staticrouterprovider]: ../routers/static-router-provider
