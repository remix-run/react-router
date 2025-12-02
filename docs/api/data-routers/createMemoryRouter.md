---
title: createMemoryRouter
---

# createMemoryRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createMemoryRouter.html)

Create a new [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that manages the application path using an
in-memory [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack. Useful for non-browser environments without a DOM API.

## Signature

```tsx
function createMemoryRouter(
  routes: RouteObject[],
  opts?: MemoryRouterOpts,
): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Basename path for the application.

### opts.dataStrategy

Override the default data strategy of running loaders in parallel -
see the [docs](../../how-to/data-strategy) for more information.

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

### opts.future

Future flags to enable for the router.

### opts.getContext

A function that returns an [`RouterContextProvider`](../utils/RouterContextProvider) instance
which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
[`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
This function is called to generate a fresh `context` instance on each
navigation or fetcher call.

### opts.hydrationData

Hydration data to initialize the router with if you have already performed
data loading on the server.

### opts.initialEntries

Initial entries in the in-memory history stack

### opts.initialIndex

Index of `initialEntries` the application should initialize to

### opts.unstable_instrumentations

Array of instrumentation objects allowing you to instrument the router and
individual routes prior to router initialization (and on any subsequently
added routes via `route.lazy` or `patchRoutesOnNavigation`).  This is
mostly useful for observability such as wrapping navigations, fetches,
as well as route loaders/actions/middlewares with logging and/or performance
tracing.  See the [docs](../../how-to/instrumentation) for more information.

```tsx
let router = createBrowserRouter(routes, {
  unstable_instrumentations: [logging]
});


let logging = {
  router({ instrument }) {
    instrument({
      navigate: (impl, info) => logExecution(`navigate ${info.to}`, impl),
      fetch: (impl, info) => logExecution(`fetch ${info.to}`, impl)
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (impl, info) => logExecution(
        `middleware ${info.request.url} (route ${id})`,
        impl
      ),
      loader: (impl, info) => logExecution(
        `loader ${info.request.url} (route ${id})`,
        impl
      ),
      action: (impl, info) => logExecution(
        `action ${info.request.url} (route ${id})`,
        impl
      ),
    })
  }
};

async function logExecution(label: string, impl: () => Promise<void>) {
  let start = performance.now();
  console.log(`start ${label}`);
  await impl();
  let duration = Math.round(performance.now() - start);
  console.log(`end ${label} (${duration}ms)`);
}
```

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations.

## Returns

An initialized [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

