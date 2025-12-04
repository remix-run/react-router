---
title: Data Strategy
---

# Data Strategy

[MODES: data]

<br />
<br />

<docs-warning>This is a low-level API intended for advanced use-cases. This overrides React Router's internal handling of `action`/`loader` execution, and if done incorrectly will break your app code. Please use with caution and perform the appropriate testing.</docs-warning>

## Overview

By default, React Router is opinionated about how your data is loaded/submitted - and most notably, executes all of your [`loader`][loader] functions in parallel for optimal data fetching. While we think this is the right behavior for most use-cases, we realize that there is no "one size fits all" solution when it comes to data fetching for the wide landscape of application requirements.

The [`dataStrategy`][data-strategy] option gives you full control over how your [`action`][action]/[`loader`][loader] functions are executed and lays the foundation to build in more advanced APIs such as middleware, context, and caching layers. Over time, we expect that we'll leverage this API internally to bring more first class APIs to React Router, but until then (and beyond), this is your way to add more advanced functionality for your application's data needs.

## Usage

A custom `dataStrategy` receives the `loader`/`action` arguments (`request`, `params`, `context`) plus a few more that allow you to decide how you want to control the executions for your application:

- `matches`: An array of `DataStrategyMatch` instances for the routes matched by the current `request`
- `runClientMiddleware`: A helper function to run the middleware for the matched routes
- `fetcherKey`: The fetcher key if this is for a fetcher request and not a navigation

A `DataStrategyMatch` is a normal route match plus a few additional fields:

- `shouldCallHandler`: A function that tells you whether this routes handler should be called for this request
- `shouldRevalidateArgs`: The arguments that to be passed to the routes `shouldRevalidate` for this request
- ~~`shouldLoad`~~: A boolean field for whether this routes handler should be run for this request
  - Deprecated in favor of the more powerful `shouldCallHandler` API
- `resolve`: A function to handle call through to the route handler, and also allow you custom execution of the handler

Here's a basic example that adds logging around the handler executions:

```tsx
let router = createBrowserRouter(routes, {
  async dataStrategy({
    matches,
    request,
    runClientMiddleware,
  }) {
    // Determine which matches are expected to be executed for this request.
    // - For loading navigations, this will return true for new routes + existing
    //   routes requiring revalidation
    // - For submission navigations, this will only return true for the action route
    // - For fetcher calls, this will only return true for the fetcher route
    const matchesToLoad = matches.filter((m) =>
      m.shouldCallHandler(),
    );

    // For each match that we want to execute, call match.resolve() to execute
    // the handler and store the result
    const results: Record<string, DataStrategyResult> = {};
    await runClientMiddleware(() =>
      Promise.all(
        matchesToLoad.map(async (match) => {
          console.log(`Processing ${match.route.id}`);
          // The resolve function calls through to the route handler
          results[match.route.id] = await match.resolve();
        }),
      ),
    );
    return results;
  },
});
```

The `dataStrategy` function should return a `Record<string, DataStrategyResult>` which contains the result for each handler that was executed. A `DataStrategyResult` is just a wrapper object that indicates if the handler returned or threw:

```ts
interface DataStrategyResult {
  type: "data" | "error";
  result: unknown; // data, Error, Response, data()
}
```

### Calling Route Middleware

If you are using `middleware` on your routes, you need to leverage the `callClientMiddleware` helper function to execute `middleware` around your handlers:

```tsx
let router = createBrowserRouter(routes, {
  async dataStrategy({
    matches,
    request,
    runClientMiddleware,
  }) {
    const matchesToLoad = matches.filter((m) =>
      m.shouldCallHandler(),
    );
    const results: Record<string, DataStrategyResult> = {};

    // Run middleware and execute handlers at the end of the middleware chain
    await runClientMiddleware(() =>
      Promise.all(
        matchesToLoad.map(async (match) => {
          results[match.route.id] = await match.resolve();
        }),
      ),
    );
    return results;
  },
});
```

`runClientMiddleware` takes the same arguments as `dataStrategy` so it can also be easily composed with a standalone `dataStrategy` implementation:

```tsx
const loggingDataStrategy: DataStrategyFunction = () => {
  /* ... */
};

let router = createBrowserRouter(routes, {
  async dataStrategy({ runClientMiddleware }) {
    let results = await runClientMiddleware(
      loggingDataStrategy,
    );
    return results;
  },
});
```

### Advanced handler execution

If you want more fine-grained control over the execution of the handler, you can pass a callback to `match.resolve()`:

```tsx
// Assume a loader shape such as
function loader({ request }, customContext) {...}

// In your dataStrategy, you can pass this context from inside a resolve callback
await Promise.all(
  matchesToLoad.map((match, i) =>
    match.resolve((handler) => {
      let customContext = getCustomContext();
      // Call the handler and p[ass a custom parameter as the handler's second argument
      return handler(customContext);
    }),
  ),
);
```

### Custom Revalidation Behavior

If you want to alter the revalidation behavior, you can pass your own `defaultShouldRevalidate` to `match.shouldCallHandler()` which will pass through to any route level `shouldRevalidate` functions. The arguments that would be passed to the route level `shouldRevalidate` are available on `match.shouldRevalidateArgs`:

```tsx
const matchesToLoad = matches.filter((match) => {
  let defaultShouldRevalidate = customShouldRevalidate(
    match.shouldRevalidateArgs,
  );
  return m.shouldCallHandler(defaultShouldRevalidate);
});
```

## Migrating away from `shouldLoad`

Now that we have stabilized the new `match.shouldCallHandler()`/`match.shouldRevalidateArgs` fields, it's recommended to move away from the now-deprecated `match.shouldLoad` API. The prior boolean approach did not allow for custom `dataStrategy`functions to alter the default revalidation behavior, so the new function-based APIs were created to allow that.

The major difference between these two APIs is that when using `shouldLoad`, calling `resolve()` would _only_ call the handler if `shouldLoad` was `true`. You could safely call it for all matches even if only a subset needed to have their handlers executed.

With `shouldCallHandler`, you are in charge of which handlers should be called so calling resolve will automatically call the handler. You should only call resolve on a the set of matches you wish to run handlers for.

Here's an example change from the prior API to the new API. Note that we pre-filter the `matchesToLoad` before calling `resolve()`:

```diff
let results = {};
+let matchesToLoad = matches.filter(m => m.shouldCallHandler());
await Promise.all(() =>
-  matches.map((m) => {
+  matchesToLoad.map((m) => {
    results[m.route.id] = await m.resolve();
  }),
);
return results;
```

## Advanced Use Cases

### Custom Middleware

<docs-info>This is an unlikely use-case now that React Router has built-in middleware, but if you wish to use a custom middleware you can do so with a `dataStrategy`.</docs-info>

Let's define a middleware on each route via [`handle`](../../start/data/route-object#handle)
and call middleware sequentially first, then call all
[`loader`](../../start/data/route-object#loader)s in parallel - providing
any data made available via the middleware:

```ts
const routes = [
  {
    id: "parent",
    path: "/parent",
    loader({ request }, context) {
      // ...
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
          // ...
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
  async dataStrategy({ matches, params, request }) {
    // Run middleware sequentially and let them add data to `context`
    let context = {};
    for (const match of matches) {
      if (match.route.handle?.middleware) {
        await match.route.handle.middleware(
          { request, params },
          context,
        );
      }
    }

    // Run loaders in parallel with the `context` value
    let matchesToLoad = matches.filter((m) =>
      m.shouldCallHandler(),
    );
    let results = await Promise.all(
      matchesToLoad.map((match, i) =>
        match.resolve((handler) => {
          // Whatever you pass to `handler` will be passed as the 2nd parameter
          // to your loader/action
          return handler(context);
        }),
      ),
    );
    return results.reduce(
      (acc, result, i) =>
        Object.assign(acc, {
          [matchesToLoad[i].route.id]: result,
        }),
      {},
    );
  },
});
```

### Custom Handler

It's also possible you don't even want to define a [`loader`](../../start/daoute-object#loader)
implementation at the route level. Maybe you want to just determine the
routes and issue a single GraphQL request for all of your data. You can do
that by setting your `route.loader=true` so it qualifies as "having a
loader", and then store GQL fragments on `route.handle`:

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
  async dataStrategy({ matches, params, request }) {
    const matchesToLoad = matches.filter((m) =>
      m.shouldCallHandler(),
    );
    // Compose route fragments into a single GQL payload
    let gql = getFragmentsFromRouteHandles(matchesToLoad);
    let data = await fetchGql(gql);
    // Parse results back out into individual route level `DataStrategyResult`'s
    // keyed by `routeId`
    let results = parseResultsFromGql(matchesToLoad, data);
    return results;
  },
});
```

Note that we never actually call `match.resolve()` in this scenario since we don't want to call the handlers defined on the routes. We instead make a single GQL call and split the resulting data back out to the proper routes in `results`.

[loader]: ../start/data/route-object#loader
[action]: ../start/data/route-object#action
[data-strategy]: ../api/data-routers/createBrowserRouter#optsdatastrategy
