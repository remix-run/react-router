---
title: createBrowserRouter
new: true
---

# `createBrowserRouter`

This is the recommended router for all React Router web projects. It uses the [DOM History API][historyapi] to update the URL and manage the history stack.

It also enables the v6.4 data APIs like [loaders][loader], [actions][action], [fetchers][fetcher] and more.

<docs-info>Due to the decoupling of fetching and rendering in the design of the data APIs, you should create your router outside of the React tree with a statically defined set of routes. For more information on this design, please see the [Remixing React Router][remixing-react-router] blog post and the [When to Fetch][when-to-fetch] conference talk.</docs-info>

```tsx lines=[4,11-24]
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Root, { rootLoader } from "./routes/root";
import Team, { teamLoader } from "./routes/team";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "team",
        element: <Team />,
        loader: teamLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## Type Declaration

```tsx
function createBrowserRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    future?: FutureConfig;
    hydrationData?: HydrationState;
    window?: Window;
  }
): RemixRouter;
```

## `routes`

An array of [`Route`][route] objects with nested routes on the `children` property.

```jsx
createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "events/:id",
        element: <Event />,
        loader: eventLoader,
      },
    ],
  },
]);
```

## `basename`

The basename of the app for situations where you can't deploy to the root of the domain, but a sub directory.

```jsx
createBrowserRouter(routes, {
  basename: "/app",
});
```

The trailing slash will be respected when linking to the root:

```jsx
createBrowserRouter(routes, {
  basename: "/app",
});
<Link to="/" />; // results in <a href="/app" />

createBrowserRouter(routes, {
  basename: "/app/",
});
<Link to="/" />; // results in <a href="/app/" />
```

## `future`

An optional set of [Future Flags][api-development-strategy] to enable for this Router. We recommend opting into newly released future flags sooner rather than later to ease your eventual migration to v7.

```js
const router = createBrowserRouter(routes, {
  future: {
    // Normalize `useNavigation()`/`useFetcher()` `formMethod` to uppercase
    v7_normalizeFormMethod: true,
  },
});
```

The following future flags are currently available:

| Flag                                        | Description                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `v7_fetcherPersist`                         | Delay active fetcher cleanup until they return to an `idle` state       |
| `v7_normalizeFormMethod`                    | Normalize `useNavigation().formMethod` to be an uppercase HTTP Method   |
| `v7_partialHydration`                       | Support partial hydration for Server-rendered apps                      |
| `v7_prependBasename`                        | Prepend the router basename to navigate/fetch paths                     |
| [`v7_relativeSplatPath`][relativesplatpath] | Fix buggy relative path resolution in splat routes                      |
| `unstable_skipActionErrorRevalidation`      | Do not revalidate by default if the action returns a 4xx/5xx `Response` |

## `hydrationData`

When [Server-Rendering][ssr] and [opting-out of automatic hydration][hydrate-false], the `hydrationData` option allows you to pass in hydration data from your server-render. This will almost always be a subset of data from the `StaticHandlerContext` value you get back from [handler.query][query]:

```js
const router = createBrowserRouter(routes, {
  hydrationData: {
    loaderData: {
      // [routeId]: serverLoaderData
    },
    // may also include `errors` and/or `actionData`
  },
});
```

### Partial Hydration Data

You will almost always include a complete set of `loaderData` to hydrate a server-rendered app. But in advanced use-cases (such as Remix's [`clientLoader`][clientloader]), you may want to include `loaderData` for only _some_ routes that were rendered on the server. If you want to enable partial `loaderData` and opt-into granular [`route.HydrateFallback`][hydratefallback] usage, you will need to enable the `future.v7_partialHydration` flag. Prior to this flag, any provided `loaderData` was assumed to be complete and would not result in the execution of route loaders on initial hydration.

When this flag is specified, loaders will run on initial hydration in 2 scenarios:

- No hydration data is provided
  - In these cases the `HydrateFallback` component will render on initial hydration
- The `loader.hydrate` property is set to `true`
  - This allows you to run the `loader` even if you did not render a fallback on initial hydration (i.e., to prime a cache with hydration data)

```js
const router = createBrowserRouter(
  [
    {
      id: "root",
      loader: rootLoader,
      Component: Root,
      children: [
        {
          id: "index",
          loader: indexLoader,
          HydrateFallback: IndexSkeleton,
          Component: Index,
        },
      ],
    },
  ],
  {
    future: {
      v7_partialHydration: true,
    },
    hydrationData: {
      loaderData: {
        root: "ROOT DATA",
        // No index data provided
      },
    },
  }
);
```

## `unstable_dataStrategy`

<docs-warning>This is a low-level API intended for advanced use-cases. This overrides React Router's internal handling of `loader`/`action` execution, and if done incorrectly will break your app code. Please use with caution and perform the appropriate testing.</docs-warning>

<docs-warning>This API is marked "unstable" so it is subject to breaking API changes in minor releases</docs-warning>

By default, React Router is opinionated about how your data is loaded/submitted - and most notably, executes all of your loaders in parallel for optimal data fetching. While we think this is the right behavior for most use-cases, we realize that there is no "one size fits all" solution when it comes to data fetching for the wide landscape of application requirements.

The `unstable_dataStrategy` option gives you full control over how your loaders and actions are executed and lays the foundation to build in more advanced APIs such as middleware, context, and caching layers. Over time, we expect that we'll leverage this API internally to bring more first class APIs to React Router, but until then (and beyond), this is your way to add more advanced functionality for your applications data needs.

### Type Declaration

```ts
interface DataStrategyFunction {
  (args: DataStrategyFunctionArgs): Promise<
    HandlerResult[]
  >;
}

interface DataStrategyFunctionArgs<Context = any> {
  request: Request;
  params: Params;
  context?: Context;
  matches: DataStrategyMatch[];
}

interface DataStrategyMatch
  extends AgnosticRouteMatch<
    string,
    AgnosticDataRouteObject
  > {
  shouldLoad: boolean;
  resolve: (
    handlerOverride?: (
      handler: (ctx?: unknown) => DataFunctionReturnValue
    ) => Promise<HandlerResult>
  ) => Promise<HandlerResult>;
}

interface HandlerResult {
  type: "data" | "error";
  result: any; // data, Error, Response, DeferredData
  status?: number;
}
```

`unstable_dataStrategy` receives the same arguments as a `loader`/`action` (`request`, `params`) but it also receives a `matches` array which is an array of the matched routes where each match is extended with 2 new fields for use in the data strategy function:

- **`match.resolve`** - An async function that will resolve any `route.lazy` implementations and execute the route's handler (if necessary), returning a `HandlerResult`
  - You should call `match.resolve` for _all_ matches every time to ensure that all lazy routes are properly resolved
  - This does not mean you're calling the loader/action (the "handler") - `resolve` will only call the `handler` internally if needed and if you don't pass your own `handlerOverride` function parameter
  - See the examples below for how to implement custom handler execution via `match.resolve`
- **`match.shouldLoad`** - A boolean value indicating whether this route handler needs to be called in this pass
  - The `matches` array always includes _all_ matched routes even when only _some_ route handlers need to be called so that things like middleware can be implemented
  - `shouldLoad` is usually only interesting if you are skipping the route handler entirely and implementing custom handler logic - since it lets you determine if that custom logic should run for this route or not
  - For example:
    - If you are on `/parent/child/a` and you navigate to `/parent/child/b` - you'll get an array of three matches (`[parent, child, b]`), but only `b` will have `shouldLoad=true` because the data for `parent` and `child` is already loaded
    - If you are on `/parent/child/a` and you submit to `a`'s `action`, then only `a` will have `shouldLoad=true` for the action execution of `dataStrategy`
      - After the `action`, `dataStrategy` will be called again for the `loader` revalidation, and all matches will have `shouldLoad=true` (assuming no custom `shouldRevalidate` implementations)

The `dataStrategy` function should return a parallel array of `HandlerResult` instances, which indicates if the handler was successful or not. If the returned `handlerResult.result` is a `Response`, React Router will unwrap it for you (via `res.json` or `res.text`). If you need to do custom decoding of a `Response` but preserve the status code, you can return the decoded value in `handlerResult.result` and send the status along via `handlerResult.status` (for example, when using the `future.unstable_skipActionRevalidation` flag). `match.resolve()` will return a `HandlerResult` if you are not passing it a handler override function. If you are, then you need to wrap the `handler` result in a `HandlerResult` (see examples below).

### Example Use Cases

#### Adding logging

In the simplest case, let's look at hooking into this API to add some logging for when our route loaders/actions execute:

```ts
let router = createBrowserRouter(routes, {
  unstable_dataStrategy({ request, matches }) {
    return Promise.all(
      matches.map(async (match) => {
        console.log(`Processing route ${match.route.id}`);
        // Don't override anything - just resolve route.lazy + call loader
        let result = await match.resolve();
        console.log(
          `Done processing route ${match.route.id}`
        );
        return result;
      })
    );
  },
});
```

#### Middleware

Let's define a middleware on each route via `handle` and call middleware sequentially first, then call all loaders in parallel - providing any data made available via the middleware:

```ts
const routes = [
  {
    id: "parent",
    path: "/parent",
    loader({ request }, context) {
      /*...*/
    },
    handle: {
      async middleware({ request }, context) {
        context.parent = "PARENT MIDDLEWARE";
      },
    },
    children: [
      {
        id: "child",
        path: "child",
        loader({ request }, context) {
          /*...*/
        },
        handle: {
          async middleware({ request }, context) {
            context.child = "CHILD MIDDLEWARE";
          },
        },
      },
    ],
  },
];

let router = createBrowserRouter(routes, {
  async unstable_dataStrategy({
    request,
    params,
    matches,
  }) {
    // Run middleware sequentially and let them add data to `context`
    let context = {};
    for (const match of matches) {
      if (match.route.handle?.middleware) {
        await match.route.handle.middleware(
          { request, params },
          context
        );
      }
    }

    // Run loaders in parallel with the `context` value
    return Promise.all(
      matches.map((match, i) =>
        match.resolve(async (handler) => {
          // Whatever you pass to `handler` will be passed as the 2nd parameter
          // to your loader/action
          let result = await handler(context);
          return { type: "data", result };
        })
      )
    );
  },
});
```

#### Custom Handler

It's also possible you don't even want to define a loader implementation at the route level. Maybe you want to just determine the routes and issue a single GraphQL request for all of your data? You can do that by setting your `route.loader=true` so it qualifies as "having a loader", and then store GQL fragments on `route.handle`:

```ts
const routes = [
  {
    id: "parent",
    path: "/parent",
    loader: true,
    handle: {
      gql: gql`
        fragment Parent on Whatever {
          parentField
        }
      `,
    },
    children: [
      {
        id: "child",
        path: "child",
        loader: true,
        handle: {
          gql: gql`
            fragment Child on Whatever {
              childField
            }
          `,
        },
      },
    ],
  },
];

let router = createBrowserRouter(routes, {
  unstable_dataStrategy({ request, params, matches }) {
    // Compose route fragments into a single GQL payload
    let gql = getFragmentsFromRouteHandles(matches);
    let data = await fetchGql(gql);
    // Parse results back out into individual route level HandlerResult's
    let results = parseResultsFromGql(data);
    return results;
  },
});
```

## `window`

Useful for environments like browser devtool plugins or testing to use a different window than the global `window`.

[loader]: ../route/loader
[action]: ../route/action
[fetcher]: ../hooks/use-fetcher
[route]: ../route/route
[historyapi]: https://developer.mozilla.org/en-US/docs/Web/API/History
[api-development-strategy]: ../guides/api-development-strategy
[remixing-react-router]: https://remix.run/blog/remixing-react-router
[when-to-fetch]: https://www.youtube.com/watch?v=95B8mnhzoCM
[ssr]: ../guides/ssr
[hydrate-false]: ../routers/static-router-provider#hydrate
[query]: ./create-static-handler#handlerqueryrequest-opts
[clientloader]: https://remix.run/route/client-loader
[hydratefallback]: ../route/hydrate-fallback-element
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
[currying]: https://stackoverflow.com/questions/36314/what-is-currying
