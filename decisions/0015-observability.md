# Title

Date: 2025-09-22

Status: proposed

## Context

We want it to be easy to add observability to production React Router applications. This involves the ability to add logging, error reporting, and performance tracing to your application on both the server and the client.

We always had a good story for user-facing error handling via `ErrorBoundary`, but until recently we only had a server-side error-reporting solution via the `entry.server` `handleError` export. In `7.8.2`, we shipped an `onError` client-side equivalent so it should now be possible to report on errors on the server and client pretty easily.

We have not historically had great recommendations for the other 2 facets of observability - logging and performance tracing. Middleware, shipped in `7.3.0` and stabilized in `7.9.0` gave us a way to "wrap" request handlers at any level of the tree, which provides a good solution for logging and _some_ high-level performance tracing. But it's too coarse-grained and does not allow folks to drill down into their applications.

This has also been raised in the (currently) 2nd-most upvoted Proposal in the past year: https://github.com/remix-run/react-router/discussions/13749.

One way to add fine-grained logging/tracing today is to manually include it in all of your loaders and actions, but this is tedious and error-prone.

Another way is to "instrument" the server build, which has long been our suggestion - initially to the folks at Sentry - and over time to RR users here and there in discord and github issues. but, we've never formally documented this as a recommended pattern, and it currently only works on the server and requires that you use a custom server.

## Decision

Adopt instrumentation as a first class API and the recommended way to implement observability in your application.

There are 2 levels in which we want to instrument:

- "router" level - ability to track the start and end of a router operation
  - requests on the server handler
  - navigations and fetchers on the client router
- route level
  - loaders, actions, middlewares, lazy

On the server, if you are using a custom server, this is already possible by wrapping the react router handler and walking the `build.routes` tree and wrapping the route handlers.

To provide the same functionality when using `@react-router/serve` we need to open up a new API. Currently, I am proposing a new `instrumentations` export from `entry.server`. This will be run on the server build in `createRequestHandler` and that way can work without a custom server. This will also allow custom-server users today to move some more code from their custom server into React Router by leveraging these new exports.

```tsx
// entry.server.tsx

export const instrumentations = [
  {
    // Wrap incoming request handlers.  Currently applies to _all_ requests handled
    // by the RR handler, including:
    // - manifest reqeusts
    // - document requests
    // - `.data` requests
    // - resource route requests
    handler({ instrument }) {
      // Calling instrument performs the actual instrumentation
      instrument({
        // Provide the instrumentation implementation for the equest handler
        async request(handleRequest, { request }) {
          let start = Date.now();
          console.log(`Request start: ${request.method} ${request.url}`);
          try {
            await handleRequest();
          } finally {
            let duration = Date.now() - start;
            console.log(
              `Request end: ${request.method} ${request.url} (${duration}ms)`,
            );
          }
        },
      });
    },
    // Instrument an individual route, allowing you to wrap middleware/loader/action/etc.
    // This also gives you a place to do global "shouldRevalidate" which is a nice side
    // effect as folks have asked for that for a long time
    route({ instrument, id }) {
      // `id` is the route id in case you want to instrument only some routes or
      // instrument in a route-specific manner
      if (id === "routes/i-dont-care") return;

      instrument({
        loader(callLoader, { request }) {
          let start = Date.now();
          console.log(`Loader start: ${request.method} ${request.url}`);
          try {
            await callLoader();
          } finally {
            let duration = Date.now() - start;
            console.log(
              `Loader end: ${request.method} ${request.url} (${duration}ms)`,
            );
          }
        },
        // action(), middleware(), lazy()
      });
    },
  },
];
```

Open questions:

- On the server we could technically do this at build time, but I don't expect this to have a large startup cost and doing it at build-time just feels a bit more magical and would differ from any examples we want to show in data mode.
- Another option for custom server folks would be to make these parameters to `createRequestHandler`, but then we'd still need a way for `react-router-server` users to use them and thus we'd still need to support them in `entry.server`, so might as well make it consistent for both.

Client-side, it's a similar story. You could do this today at the route level in Data mode before calling `createBrowserRouter`, and you could wrap `router.navigate`/`router.fetch` after that. but there's no way to instrument the router `initialize` method without "ejecting" to using the lower level `createRouter`. And there is no way to do this in framework mode.

I think we can open up APIs similar to those in `entry.server` but do them on `createBrowserRouter` and `HydratedRouter`:

```tsx
// entry.client.tsx

export const instrumentations = [{
  // Instrument router operations
  router({ instrument }) {
    instrument({
      async initialize(callNavigate, info) { /*...*/ },
      async navigate(callNavigate, info) { /*...*/ },
      async fetch(callNavigate, info) { /*...*/ },
    });
  },
  route({ instrument, id }) {
    instrument({
      lazy(callLazy, info) { /*...*/ },
      middleware(callMiddleware, info) { /*...*/ },
      loader(callLoader, info) { /*...*/ },
      action(callAction, info) { /*...*/ },
    });
  },
}];

// Data mode
let router = createBrowserRouter(routes, { instrumentations })

// Framework mode
<HydratedRouter instrumentations={instrumentations} />
```

In both of these cases, we'll handle the instrumentation at the router creation level. And by passing `instrumentRoute` into the router, we can properly instrument future routes discovered via `route.lazy` or `patchRouteOnNavigation`

### Composition

Instrumentations is an aray so that you can compose together multiple independent instrumentations easily:

```tsx
let router = createBrowserRouter(routes, {
  instrumentations: [logNavigations, addWindowPerfTraces, addSentryPerfTraces],
});
```

### Dynamic Instrumentations

By doing this at runtime, you should be able to enable instrumentation conditionally.

Client side, it's trivial because it can be done on page load and avoid overhead on normal flows:

```tsx
let enableInstrumentation = window.location.search.startsWith("?DEBUG");
let router = createBrowserRouter(routes, {
  instrumentations: enableInstrumentation ? [debuggingInstrumentations] : [],
});
```

Server side, it's a bit tricker but should be doable with a custom server:

```tsx
// Assume you export `instrumentations` from entry.server
let getBuild = () => import("virtual:react-router/server-build");

let instrumentedHandler = createRequestHandler({
  build: getBuild,
});

let unInstrumentedHandler = createRequestHandler({
  build: () =>
    getBuild().then((m) => ({
      ...m,
      entry: {
        ...m.entry,
        module: {
          ...m.entry.module,
          unstable_instrumentations: undefined,
        },
      },
    })),
});

app.use((req, res, next) => {
  let url = new URL(req.url, `http://${req.headers.host}`);
  if (url.searchParams.has("DEBUG")) {
    return instrumentedHandler(req, res, next);
  }
  return unInstrumentedHandler(req, res, next);
});
```

## Alternatives Considered

### Events

Originally we wanted to add an [Events API](https://github.com/remix-run/react-router/discussions/9565), but this proved to [have issues](https://github.com/remix-run/react-router/discussions/13749#discussioncomment-14135422) with the ability to "wrap" logic for easier OTEL instrumentation. These were not [insurmountable](https://github.com/remix-run/react-router/discussions/13749#discussioncomment-14421335), but the solutions didn't feel great.

### patchRoutes

Client side, we also considered whether this could be done via `patchRoutes`, but that's currently intended mostly to add new routes and doesn't work for `route.lazy` routes. In some RSC-use cases it can update parts of an existing route, but it sonly allows updates for the server-rendered RSC "elements," and doesn't walk the entire child tree to update children routes so it's not an ideal solution for updating loaders in the entire tree.

### Naive Function wrapping

The original implementation of this proposal was a naive simple wrapping of functions, but we moved away from this because by putting the wrapped function arguments (i.e., loader) in control of the user, they could potentially modify them and abuse the API to change runtime behavior instead of just instrument/observe. We want instrumentation to be limited to that - and it should not be able to change app behavior.

```tsx
function instrumentRoute(route: RouteModule): RequestHandler {
  let { loader } = route;
  let newRoute = { ...route };
  if (loader) {
    newRoute.loader = (args) => {
      console.log("Loader start");
      try {
        // ⚠️ The user could send whatever they want into the actual loader here
        return await loader(...args);
      } finally {
        console.log("Loader end");
      }
    };
  }
  return newRoute;
}
```
