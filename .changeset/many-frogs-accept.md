---
"react-router": minor
"react-router-dom": minor
"@remix-run/router": minor
---

**Introducing Lazy Route Modules!**

In order to keep your application bundles small and provide first-class code-splitting support, we've introduced a new `lazy()` route property. This is an `async` function that returns with the non-route-matching portions of your route definition (`loader`, `element`, `errorElement`, etc.). You cannot define your route-matching properties through `lazy()` (`path`, `index`, `children`) since we only run the `lazy()` functions after we've matched known routes. `lazy()` is executed as part of the `submitting` or `loading` phase of a navigation or fetcher call and will be aborted in the same manner if the navigation or fetch is interrupted.

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

Then in your lazy route modules, you export the properties you want defined for the route:

```jsx
// a.jsx
export function loader({ request }) {
  let data = fetchData(request);
  return json(data);
}

function Component() {
  let data = useLoaderData();

  return (
    <>
      <h1>You made it!</h1>
      <p>{data}</p>
    </>
  );
}

export const element = <Component />;

// Could also export `action`, `errorElement`, `shouldRevalidate`, and `handle`
```
