---
"react-router": minor
"react-router-dom": minor
"@remix-run/router": minor
---

**Introducing Lazy Route Modules!**

In order to keep your application bundles small and support code-splitting of your routes, we've introduced a new `lazy()` route property. This is an async function that resolves the non-route-matching portions of your route definition (`loader`, `action`, `element`/`Component`, `errorElement`/`ErrorBoundary`, `shouldRevalidate`, `handle`).

Lazy routes are resolved on initial load and during the `loading` or `submitting` phase of a navigation or fetcher call. You cannot lazily define route-matching properties (`path`, `index`, `children`) since we only execute your lazy route functions after we've matched known routes.

Your `lazy` functions will typically return the result of a dynamic import.

```jsx
// In this example, we assume most folks land on the homepage so we include that
// in our critical-path bundle, but then we lazily load modules for /a and /b so
// they don't load until the user navigates to those routes
let routes = createRoutesFromElements(
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
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

// Export a `Component` directly instead of needing to create a React Element from it
export function Component() {
  let data = useLoaderData();

  return (
    <>
      <h1>You made it!</h1>
      <p>{data}</p>
    </>
  );
}

// Export an `ErrorBoundary` directly instead of needing to create a React Element from it
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
```

An example of this in action can be found in the [`examples/lazy-loading-router-provider`](https://github.com/remix-run/react-router/tree/main/examples/lazy-loading-router-provider) directory of the repository.

🙌 Huge thanks to @rossipedia for the [Initial Proposal](https://github.com/remix-run/react-router/discussions/9826) and [POC Implementation](https://github.com/remix-run/react-router/pull/9830).
