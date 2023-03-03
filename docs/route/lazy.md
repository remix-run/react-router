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

Then in your lazy route modules, export the properties you want defined for the route:

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

[pickingarouter]: ../routers/picking-a-router
