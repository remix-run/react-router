---
title: createHashRouter
---

# createHashRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createHashRouter.html)

Create a new [data router](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) that manages the application
path via the URL [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).

## Signature

```tsx
function createHashRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter
```

## Params

### routes

Application routes

### opts.basename

Basename path for the application.

### opts.future

Future flags to enable for the router.

### opts.getContext

A function that returns an [`RouterContextProvider`](../utils/RouterContextProvider) instance
which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
[`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
This function is called to generate a fresh `context` instance on each
navigation or fetcher call.

```tsx
import {
  createContext,
  RouterContextProvider,
} from "react-router";

const apiClientContext = createContext<APIClient>();

function createBrowserRouter(routes, {
  getContext() {
    let context = new RouterContextProvider();
    context.set(apiClientContext, getApiClient());
    return context;
  }
})
```

### opts.hydrationData

When Server-Rendering and opting-out of automatic hydration, the
`hydrationData` option allows you to pass in hydration data from your
server-render. This will almost always be a subset of data from the
[`StaticHandlerContext`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandlerContext.html) value you get back from the [`StaticHandler`](https://api.reactrouter.com/v7/interfaces/react_router.StaticHandler.html)'s
`query` method:

```tsx
const router = createBrowserRouter(routes, {
  hydrationData: {
    loaderData: {
      // [routeId]: serverLoaderData
    },
    // may also include `errors` and/or `actionData`
  },
});
```

**Partial Hydration Data**

You will almost always include a complete set of `loaderData` to hydrate a
server-rendered app. But in advanced use-cases (such as Framework Mode's
[`clientLoader`](../../start/framework/route-module#clientLoader)), you may
want to include `loaderData` for only some routes that were loaded/rendered
on the server. This allows you to hydrate _some_ of the routes (such as the
app layout/shell) while showing a `HydrateFallback` component and running
the [`loader`](../../start/data/route-object#loader)s for other routes
during hydration.

A route [`loader`](../../start/data/route-object#loader) will run during
hydration in two scenarios:

 1. No hydration data is provided
    In these cases the `HydrateFallback` component will render on initial
    hydration
 2. The `loader.hydrate` property is set to `true`
    This allows you to run the [`loader`](../../start/data/route-object#loader)
    even if you did not render a fallback on initial hydration (i.e., to
    prime a cache with hydration data)

```tsx
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
    hydrationData: {
      loaderData: {
        root: "ROOT DATA",
        // No index data provided
      },
    },
  }
);
```

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

### opts.patchRoutesOnNavigation

Lazily define portions of the route tree on navigations.
See [`PatchRoutesOnNavigationFunction`](https://api.reactrouter.com/v7/types/react_router.PatchRoutesOnNavigationFunction.html).

By default, React Router wants you to provide a full route tree up front via
`createBrowserRouter(routes)`. This allows React Router to perform synchronous
route matching, execute loaders, and then render route components in the most
optimistic manner without introducing waterfalls. The tradeoff is that your
initial JS bundle is larger by definition — which may slow down application
start-up times as your application grows.

To combat this, we introduced [`route.lazy`](../../start/data/route-object#lazy)
in [v6.9.0](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v690)
which lets you lazily load the route _implementation_ ([`loader`](../../start/data/route-object#loader),
[`Component`](../../start/data/route-object#Component), etc.) while still
providing the route _definition_ aspects up front (`path`, `index`, etc.).
This is a good middle ground. React Router still knows about your route
definitions (the lightweight part) up front and can perform synchronous
route matching, but then delay loading any of the route implementation
aspects (the heavier part) until the route is actually navigated to.

In some cases, even this doesn't go far enough. For huge applications,
providing all route definitions up front can be prohibitively expensive.
Additionally, it might not even be possible to provide all route definitions
up front in certain Micro-Frontend or Module-Federation architectures.

This is where `patchRoutesOnNavigation` comes in ([RFC](https://github.com/remix-run/react-router/discussions/11113)).
This API is for advanced use-cases where you are unable to provide the full
route tree up-front and need a way to lazily "discover" portions of the route
tree at runtime. This feature is often referred to as ["Fog of War"](https://en.wikipedia.org/wiki/Fog_of_war),
because similar to how video games expand the "world" as you move around -
the router would be expanding its routing tree as the user navigated around
the app - but would only ever end up loading portions of the tree that the
user visited.

`patchRoutesOnNavigation` will be called anytime React Router is unable to
match a `path`. The arguments include the `path`, any partial `matches`,
and a `patch` function you can call to patch new routes into the tree at a
specific location. This method is executed during the `loading` portion of
the navigation for `GET` requests and during the `submitting` portion of
the navigation for non-`GET` requests.

<details>
  <summary><b>Example <code>patchRoutesOnNavigation</code> Use Cases</b></summary>

  **Patching children into an existing route**

  ```tsx
  const router = createBrowserRouter(
    [
      {
        id: "root",
        path: "/",
        Component: RootComponent,
      },
    ],
    {
      async patchRoutesOnNavigation({ patch, path }) {
        if (path === "/a") {
          // Load/patch the `a` route as a child of the route with id `root`
          let route = await getARoute();
          //  ^ { path: 'a', Component: A }
          patch("root", [route]);
        }
      },
    }
  );
  ```

  In the above example, if the user clicks a link to `/a`, React Router
  won't match any routes initially and will call `patchRoutesOnNavigation`
  with a `path = "/a"` and a `matches` array containing the root route
  match. By calling `patch('root', [route])`, the new route will be added
  to the route tree as a child of the `root` route and React Router will
  perform matching on the updated routes. This time it will successfully
  match the `/a` path and the navigation will complete successfully.

  **Patching new root-level routes**

  If you need to patch a new route to the top of the tree (i.e., it doesn't
  have a parent), you can pass `null` as the `routeId`:

  ```tsx
  const router = createBrowserRouter(
    [
      {
        id: "root",
        path: "/",
        Component: RootComponent,
      },
    ],
    {
      async patchRoutesOnNavigation({ patch, path }) {
        if (path === "/root-sibling") {
          // Load/patch the `/root-sibling` route as a sibling of the root route
          let route = await getRootSiblingRoute();
          //  ^ { path: '/root-sibling', Component: RootSibling }
          patch(null, [route]);
        }
      },
    }
  );
  ```

  **Patching subtrees asynchronously**

  You can also perform asynchronous matching to lazily fetch entire sections
  of your application:

  ```tsx
  let router = createBrowserRouter(
    [
      {
        path: "/",
        Component: Home,
      },
    ],
    {
      async patchRoutesOnNavigation({ patch, path }) {
        if (path.startsWith("/dashboard")) {
          let children = await import("./dashboard");
          patch(null, children);
        }
        if (path.startsWith("/account")) {
          let children = await import("./account");
          patch(null, children);
        }
      },
    }
  );
  ```

  <docs-info>If in-progress execution of `patchRoutesOnNavigation` is
  interrupted by a later navigation, then any remaining `patch` calls in
  the interrupted execution will not update the route tree because the
  operation was cancelled.</docs-info>

  **Co-locating route discovery with route definition**

  If you don't wish to perform your own pseudo-matching, you can leverage
  the partial `matches` array and the [`handle`](../../start/data/route-object#handle)
  field on a route to keep the children definitions co-located:

  ```tsx
  let router = createBrowserRouter(
    [
      {
        path: "/",
        Component: Home,
      },
      {
        path: "/dashboard",
        children: [
          {
            // If we want to include /dashboard in the critical routes, we need to
            // also include it's index route since patchRoutesOnNavigation will not be
            // called on a navigation to `/dashboard` because it will have successfully
            // matched the `/dashboard` parent route
            index: true,
            // ...
          },
        ],
        handle: {
          lazyChildren: () => import("./dashboard"),
        },
      },
      {
        path: "/account",
        children: [
          {
            index: true,
            // ...
          },
        ],
        handle: {
          lazyChildren: () => import("./account"),
        },
      },
    ],
    {
      async patchRoutesOnNavigation({ matches, patch }) {
        let leafRoute = matches[matches.length - 1]?.route;
        if (leafRoute?.handle?.lazyChildren) {
          let children =
            await leafRoute.handle.lazyChildren();
          patch(leafRoute.id, children);
        }
      },
    }
  );
  ```

  **A note on routes with parameters**

  Because React Router uses ranked routes to find the best match for a
  given path, there is an interesting ambiguity introduced when only a
  partial route tree is known at any given point in time. If we match a
  fully static route such as `path: "/about/contact-us"` then we know we've
  found the right match since it's composed entirely of static URL segments.
  Thus, we do not need to bother asking for any other potentially
  higher-scoring routes.

  However, routes with parameters (dynamic or splat) can't make this
  assumption because there might be a not-yet-discovered route that scores
  higher. Consider a full route tree such as:

  ```tsx
  // Assume this is the full route tree for your app
  const routes = [
    {
      path: "/",
      Component: Home,
    },
    {
      id: "blog",
      path: "/blog",
      Component: BlogLayout,
      children: [
        { path: "new", Component: NewPost },
        { path: ":slug", Component: BlogPost },
      ],
    },
  ];
  ```

  And then assume we want to use `patchRoutesOnNavigation` to fill this in
  as the user navigates around:

  ```tsx
  // Start with only the index route
  const router = createBrowserRouter(
    [
      {
        path: "/",
        Component: Home,
      },
    ],
    {
      async patchRoutesOnNavigation({ patch, path }) {
        if (path === "/blog/new") {
          patch("blog", [
            {
              path: "new",
              Component: NewPost,
            },
          ]);
        } else if (path.startsWith("/blog")) {
          patch("blog", [
            {
              path: ":slug",
              Component: BlogPost,
            },
          ]);
        }
      },
    }
  );
  ```

  If the user were to a blog post first (i.e., `/blog/my-post`) we would
  patch in the `:slug` route. Then, if the user navigated to `/blog/new` to
  write a new post, we'd match `/blog/:slug` but it wouldn't be the _right_
  match! We need to call `patchRoutesOnNavigation` just in case there
  exists a higher-scoring route we've not yet discovered, which in this
  case there is.

  So, anytime React Router matches a path that contains at least one param,
  it will call `patchRoutesOnNavigation` and match routes again just to
  confirm it has found the best match.

  If your `patchRoutesOnNavigation` implementation is expensive or making
  side effect [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
  calls to a backend server, you may want to consider tracking previously
  seen routes to avoid over-fetching in cases where you know the proper
  route has already been found. This can usually be as simple as
  maintaining a small cache of prior `path` values for which you've already
  patched in the right routes:

  ```tsx
  let discoveredRoutes = new Set();

  const router = createBrowserRouter(routes, {
    async patchRoutesOnNavigation({ patch, path }) {
      if (discoveredRoutes.has(path)) {
        // We've seen this before so nothing to patch in and we can let the router
        // use the routes it already knows about
        return;
      }

      discoveredRoutes.add(path);

      // ... patch routes in accordingly
    },
  });
  ```
</details>

### opts.window

[`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
override. Defaults to the global `window` instance.

## Returns

An initialized [data router](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html) to pass to [`<RouterProvider>`](../data-routers/RouterProvider)

