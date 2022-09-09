---
"react-router": patch
"react-router-dom": patch
"@remix-run/router": patch
---

fix: remove internal router singleton (#9227)

This change removes the internal module-level `routerSingleton` we create and maintain inside our data routers since it was causing a number of headaches for non-simple use cases:

- Unit tests are a pain because you need to find a way to reset the singleton in-between tests
  - Use use a `_resetModuleScope` singleton for our tests
  - ...but this isn't exposed to users who may want to do their own tests around our router
- The JSX children `<Route>` objects cause non-intuitive behavior based on idiomatic react expectations
  - Conditional runtime `<Route>`'s won't get picked up
  - Adding new `<Route>`'s during local dev won't get picked up during HMR
  - Using external state in your elements doesn't work as one might expect (see #9225)

Instead, we are going to lift the singleton out into user-land, so that they create the router singleton and manage it outside the react tree - which is what react 18 is encouraging with `useSyncExternalStore` anyways! This also means that since users create the router - there's no longer any difference in the rendering aspect for memory/browser/hash routers (which only impacts router/history creation) - so we can get rid of those and trim to a simple `RouterProvider`

```jsx
// Before
function App() {
  <DataBrowserRouter>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />}>
    </Route>
  <DataBrowserRouter>
}

// After
let router = createBrowserRouter([{
  path: "/",
  element: <Layout />,
  children: [{
    index: true,
    element: <Home />,
  }]
}]);

function App() {
  return <RouterProvider router={router} />
}
```

If folks still prefer the JSX notation, they can leverage `createRoutesFromElements` (aliased from `createRoutesFromChildren` since they are not "children" in this usage):

```jsx
let routes = createRoutesFromElements(
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />}>
  </Route>
);
let router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />
}
```

And now they can also hook into HMR correctly for router disposal:

```
if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}
```

And finally since `<RouterProvider>` accepts a router, it makes unit testing easer since you can create a fresh router with each test.

**Removed APIs**

- `<DataMemoryRouter>`
- `<DataBrowserRouter>`
- `<DataHashRouter>`
- `<DataRouterProvider>`
- `<DataRouter>`

**Modified APIs**

- `createMemoryRouter`/`createBrowserRouter`/`createHashRouter` used to live in `@remix-run/router` to prevent devs from needing to create their own `history`. These are now moved to `react-router`/`react-router-dom` and handle the `RouteObject -> AgnosticRouteObject` conversion.

**Added APIs**

- `<RouterProvider>`
- `createRoutesFromElements` (alias of `createRoutesFromChildren`)
