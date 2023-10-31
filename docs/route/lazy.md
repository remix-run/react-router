---
title: lazy
new: true
---

# `lazy`

In order to keep your application bundles small and support code-splitting of your routes, each route can provide an async function that resolves the non-route-matching portions of your route definition (`loader`, `action`, `Component`/`element`, `ErrorBoundary`/`errorElement`, etc.).

Lazy routes are resolved on initial load and during the `loading` or `submitting` phase of a navigation or fetcher call. You cannot lazily define route-matching properties (`path`, `index`, `children`, `caseSensitive`) since we only execute your lazy route functions after we've matched known routes.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

Each `lazy` function will typically return the result of a dynamic import.

```jsx
let routes = createRoutesFromElements(
  <Route path="/" element={<Layout />}>
    <Route path="a" lazy={() => import("./a")} />
    <Route path="b" lazy={() => import("./b")} />
  </Route>
);
```

Then in your lazy route modules, export the properties you want defined for the route (`loader`, `Component`, `ErrorBoundary`):

```jsx
export async function loader({ request }) {
  let data = await fetchData(request);
  return json(data);
}

export function Component() {
  let data = useLoaderData();

  return (
    <>
      <h1>You made it!</h1>
      <p>{data}</p>
    </>
  );
}

// If you want to customize the component display name in React dev tools:
Component.displayName = "SampleLazyRoute";

export function ErrorBoundary() {
  let error = useRouteError();
  return isRouteErrorResponse(error) ? (
    <h1>
      {error.status} {error.statusText}
    </h1>
  ) : (
    <h1>{error.message || error}</h1>
  );
}

// If you want to customize the component display name in React dev tools:
ErrorBoundary.displayName = "SampleErrorBoundary";
```

<docs-info>
Note that there's no `default` export in this lazy-loaded file.  That's because `default` is not a valid key on a route object.  These files generally should only export keys you would define on a route object, such as `loader`, `action`, `Component`, `ErrorBoundary`, etc.  All exports will be spread directly on the route object unless you manually return an object from `lazy`.
</docs-info>

## Statically Defined Properties

Any properties defined statically on the route cannot be overwritten by the `lazy` function, and you'll receive a console warning if you attempt to overwrite them.

Additionally, as an optimization, if you statically define a `loader`/`action` then it will be called in parallel with the `lazy` function. This is useful if you have slim loaders that you don't mind on the critical bundle, and would like to kick off their data fetches in parallel with the component download. This is close to how Remix handles fetching because each route is it's own API route.

```js
let route = {
  path: "projects",
  loader: ({ request }) => fetchDataForUrl(request.url),
  lazy: () => import("./projects"),
};
```

This also allows you to do more granular code splitting. For example, you could split your `loader` and `Component` into different files for parallel downloading:

```js
let route = {
  path: "projects",
  async loader({ request, params }) {
    let { loader } = await import("./projects-loader");
    return loader({ request, params });
  },
  lazy: () => import("./projects-component"),
};
```

## Multiple Routes in a single file

While `lazy` may generally be used 1:1 with an async `import()` per route, you are free to implement a more advanced `lazy` function and just need to return the properties you want added to that route. This opens up some interesting possibilities.

For example, if you want to avoid loading multiple chunks for nested routes, you could store them all in the same file and return them to the individual routes. Modern bundlers will latch onto the same Promise for the different `import()` invocations.

```js
// Assume pages/Dashboard.jsx has all of our loaders/components for multiple
// dashboard routes
let dashboardRoute = {
  path: "dashboard",
  async lazy() {
    let { Layout } = await import("./pages/Dashboard");
    return { Component: Layout };
  },
  children: [
    {
      index: true,
      async lazy() {
        let { Index } = await import("./pages/Dashboard");
        return { Component: Index };
      },
    },
    {
      path: "messages",
      async lazy() {
        let { messagesLoader, Messages } = await import(
          "./pages/Dashboard"
        );
        return {
          loader: messagesLoader,
          Component: Messages,
        };
      },
    },
  ],
};
```

[pickingarouter]: ../routers/picking-a-router
