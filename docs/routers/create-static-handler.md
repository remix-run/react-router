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
  routes: AgnosticRouteObject[],
  opts?: CreateStaticHandlerOptions
): StaticHandler;

interface CreateStaticHandlerOptions {
  basename?: string;
  future?: Partial<StaticHandlerFutureConfig>;
  mapRouteProperties?: MapRoutePropertiesFunction;
}

interface StaticHandlerFutureConfig {
  v7_relativeSplatPath: boolean;
  v7_throwAbortReason: boolean;
}

interface MapRoutePropertiesFunction {
  (route: AgnosticRouteObject): {
    hasErrorBoundary: boolean;
  } & Record<string, any>;
}

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

## `handler.query(request, opts)`

The `handler.query()` method takes in a Fetch request, performs route matching, and executes all relevant route action/loader methods depending on the request. The return `context` value contains all of the information required to render the HTML document for the request (route-level `actionData`, `loaderData`, `errors`, etc.). If any of the matched routes return or throw a redirect response, then `query()` will return that redirect in the form of Fetch `Response`.

If a request is aborted, `query` will throw an error such as `Error("query() call aborted: GET /path")`. If you want to throw the native `AbortSignal.reason` (by default a `DOMException`) you can opt-in into the `future.v7_throwAbortReason` future flag. `DOMException` was added in Node 17 so you must be on Node 17 or higher for this to work properly.

### `opts.requestContext`

If you need to pass information from your server into Remix actions/loaders, you can do so with `opts.requestContext` and it will show up in your actions/loaders in the context parameter.

```ts
const routes = [{
  path: '/',
  loader({ request, context }) {
    // Access `context.dataFormExpressMiddleware` here
  },
}];

export async function render(req: express.Request) {
  let { query, dataRoutes } = createStaticHandler(routes);
  let remixRequest = createFetchRequest(request);
  let staticHandlerContext = await query(remixRequest, {
    // Pass data from the express layer to the remix layer here
    requestContext: {
      dataFromExpressMiddleware: req.something
    }
 });
 ...
}
```

## `handler.queryRoute(request, opts)`

The `handler.queryRoute` is a more-targeted version that queries a singular route and runs it's loader or action based on the request. By default, it will match the target route based on the request URL. The return value is the values returned from the loader or action, which is usually a `Response` object.

If a request is aborted, `query` will throw an error such as `Error("queryRoute() call aborted: GET /path")`. If you want to throw the native `AbortSignal.reason` (by default a `DOMException`) you can opt-in into the `future.v7_throwAbortReason` future flag. `DOMException` was added in Node 17 so you must be on Node 17 or higher for this to work properly.

### `opts.routeId`

If you need to call a specific route action/loader that doesn't exactly correspond to the URL (for example, a parent route loader), you can specify a `routeId`:

```js
staticHandler.queryRoute(new Request("/parent/child"), {
  routeId: "parent",
});
```

### `opts.requestContext`

If you need to pass information from your server into Remix actions/loaders, you can do so with `opts.requestContext` and it will show up in your actions/loaders in the context parameter. See the example in the `query()` section above.

**See also:**

- [`createStaticRouter`][createstaticrouter]
- [`<StaticRouterProvider>`][staticrouterprovider]

[node]: https://nodejs.org/
[ssr]: ../guides/ssr
[createbrowserrouter]: ./create-browser-router
[createstaticrouter]: ../routers/create-static-router
[staticrouterprovider]: ../routers/static-router-provider
