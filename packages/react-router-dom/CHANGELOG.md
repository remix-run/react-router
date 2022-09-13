# react-router-dom

## 6.4.0

### Patch Changes

- 5c8fdeca: fix: pass useMatches objects to ScrollRestoration getKey (#9157)
- 815e1d17: feat: add `relative=path` option for url-relative routing (#9160)

  Adds a `relative=path` option to navigation aspects to allow users to opt-into paths behaving relative to the current URL instead of the current route hierarchy. This is useful if you're sharing route patterns in a non-nested structure for UI reasons:

  ```jsx
  // Contact and EditContact do not share UI layout
  <Route path="contacts/:id" element={<Contact />} />
  <Route path="contacts:id/edit" element={<EditContact />} />

  function EditContact() {
    return <Link to=".." relative="path">Cancel</Link>
  }
  ```

  Without this, the user would need to reconstruct the `contacts/:id` url using `useParams` and either hardcoding the `/contacts` prefix or parsing it from `useLocation`.

  This applies to all path-related hooks and components:

  - `react-router`: `useHref`, `useResolvedPath`, `useNavigate`, `Navigate`
  - `react-router-dom`: `useLinkClickHandler`, `useFormAction`, `useSubmit`, `Link`, `Form`
  - `react-router-native`: `useLinkPressHandler`, `Link`

- c17512d8: fix: remove internal router singleton (#9227)

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

- 9fa39a6d: fix: Make path resolution trailing slash agnostic (#8861)
- f264d828: Fix broken require for CJS builds
- f0579d8a: fix: do not overwrite input value from button with same name (#9139)
- f264d828: Make `fallbackElement` optional and change type to `ReactNode` (#8896)
- f264d828: Release script tests
- e766ab5a: fix: update `useLocation` to return the scoped `Location` when inside a `<Routes location>` component
- f264d828: fix: respect the `<Link replace>` prop if it is defined (#8779)
- b25d53f9: fix: unspecified `<Form>` action should preserve search params (#9060)
- 9e2f92ac: feat: Add `createStaticRouter` for `@remix-run/router` SSR usage

  **Notable changes:**

  - `request` is now the driving force inside the router utils, so that we can better handle `Request` instances coming form the server (as opposed to `string` and `Path` instances coming from the client)
  - Removed the `signal` param from `loader` and `action` functions in favor of `request.signal`

  **Example usage (Document Requests):**

  ```jsx
  // Create a static handler
  let { query } = unstable_createStaticHandler(routes);

  // Perform a full-document query for the incoming Fetch Request.  This will
  // execute the appropriate action/loaders and return either the state or a
  // Fetch Response in the case of redirects.
  let state = await query(fetchRequest);

  // If we received a Fetch Response back, let our server runtime handle directly
  if (state instanceof Response) {
    throw state;
  }

  // Otherwise, render our application providing the data routes and state
  let html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <DataStaticRouter routes={routes} state={state} />
    </React.StrictMode>
  );
  ```

  **Example usage (Data Requests):**

  ```jsx
  // Create a static route handler
  let { queryRoute } = unstable_createStaticHandler(routes);

  // Perform a single-route query for the incoming Fetch Request.  This will
  // execute the appropriate singular action/loader and return either the raw
  // data or a Fetch Response
  let data = await queryRoute(fetchRequest);

  // If we received a Fetch Response back, return it directly
  if (data instanceof Response) {
    return data;
  }

  // Otherwise, construct a Response from the raw data (assuming json here)
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
  ```

- a04ab758: fix: rename resetScroll -> preventScrollReset (#9199)
- d68d03ed: feat: add basename support for data routers
- 9fa39a6d: fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- f3182f4a: SSR Updates for React Router

  _Note: The Data-Router SSR aspects of `@remix-run/router` and `react-router-dom` are being released as **unstable** in this release (`unstable_createStaticHandler` and `unstable_DataStaticRouter`), and we plan to finalize them in a subsequent minor release once the kinks can be worked out with the Remix integration. To that end, they are available for use, but are subject to breaking changes in the next minor release._

  - Remove `useRenderDataRouter()` in favor of `<DataRouterProvider>`/`<DataRouter>`
  - Support automatic hydration in `<DataStaticRouter>`/`<DataBrowserRouter>`/`<DataHashRouter>`
    - Uses `window.__staticRouterHydrationData`
    - Can be disabled on the server via `<DataStaticRouter hydrate={false}>`
    - Can be disabled (or overridden) in the browser by passing `hydrationData` to `<DataBrowserRouter>`/`<DataHashRouter>`
  - `<DataStaticRouter>` now tracks it's own SSR error boundaries on `StaticHandlerContext`
  - `StaticHandlerContext` now exposes `statusCode`/`loaderHeaders`/`actionHeaders`
  - `foundMissingHydrationData` check removed since Remix routes may have loaders (for modules) that don't return data for `loaderData`

- 6fef589d: fix: useFormAction should not include pathless splat portion (#9144)
- Updated dependencies [815e1d17]
- Updated dependencies [c17512d8]
- Updated dependencies [9fa39a6d]
- Updated dependencies [c21e38ef]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [e766ab5a]
- Updated dependencies [d5b25602]
- Updated dependencies [92aa5bb0]
- Updated dependencies [a04ab758]
- Updated dependencies [112c02c7]
- Updated dependencies [e6b68116]
- Updated dependencies [d68d03ed]
- Updated dependencies [9fa39a6d]
- Updated dependencies [f264d828]
- Updated dependencies [c3406eb9]
- Updated dependencies [3e7e502c]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [f3182f4a]
  - react-router@6.4.0

## 6.4.0-pre.15

### Patch Changes

- fix: remove internal router singleton (#9227)

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

- Updated dependencies
  - react-router@6.4.0-pre.15

## 6.4.0-pre.14

### Patch Changes

- fix: rename resetScroll -> preventScrollReset (#9199)
- Updated dependencies
  - react-router@6.4.0-pre.14

## 6.4.0-pre.13

### Patch Changes

- fix: pass `useMatches` objects to `ScrollRestoration` `getKey` (#9157)
- feat: add `relative=path` option for url-relative routing (#9160)

  Adds a `relative=path` option to navigation aspects to allow users to opt-into paths behaving relative to the current URL instead of the current route hierarchy. This is useful if you're sharing route patterns in a non-nested structure for UI reasons:

  ```jsx
  // Contact and EditContact do not share UI layout
  <Route path="contacts/:id" element={<Contact />} />
  <Route path="contacts:id/edit" element={<EditContact />} />

  function EditContact() {
    return <Link to=".." relative="path">Cancel</Link>
  }
  ```

  Without this, the user would need to reconstruct the `contacts/:id` url using `useParams` and either hardcoding the `/contacts` prefix or parsing it from `useLocation`.

  This applies to all path-related hooks and components:

  - `react-router`: `useHref`, `useResolvedPath`, `useNavigate`, `Navigate`
  - `react-router-dom`: `useLinkClickHandler`, `useFormAction`, `useSubmit`, `Link`, `Form`
  - `react-router-native`: `useLinkPressHandler`, `Link`

- fix: `useFormAction` should not include pathless splat portion (#9144)
- Updated dependencies
  - react-router@6.4.0-pre.13

## 6.4.0-pre.12

### Patch Changes

- fix: do not overwrite input value from button with same name (#9139)
- fix: unspecified `<Form>` action should preserve search params (#9060)
- Updated dependencies
  - react-router@6.4.0-pre.12

## 6.4.0-pre.11

### Patch Changes

- Updated dependencies [c3406eb9]
  - react-router@6.4.0-pre.11

## 6.4.0-pre.10

### Patch Changes

- SSR Updates for React Router (#9058)

  _Note: The Data-Router SSR aspects of `@remix-run/router` and `react-router-dom` are being released as **unstable** in this release (`unstable_createStaticHandler` and `unstable_DataStaticRouter`), and we plan to finalize them in a subsequent minor release once the kinks can be worked out with the Remix integration. To that end, they are available for use, but are subject to breaking changes in the next minor release._

  - Remove `useRenderDataRouter()` in favor of `<DataRouterProvider>`/`<DataRouter>`
  - Support automatic hydration in `<DataStaticRouter>`/`<DataBrowserRouter>`/`<DataHashRouter>`
    - Uses `window.__staticRouterHydrationData`
    - Can be disabled on the server via `<DataStaticRouter hydrate={false}>`
    - Can be disabled (or overridden) in the browser by passing `hydrationData` to `<DataBrowserRouter>`/`<DataHashRouter>`
  - `<DataStaticRouter>` now tracks it's own SSR error boundaries on `StaticHandlerContext`
  - `StaticHandlerContext` now exposes `statusCode`/`loaderHeaders`/`actionHeaders`
  - `foundMissingHydrationData` check removed since Remix routes may have loaders (for modules) that don't return data for `loaderData`

- Updated dependencies
  - react-router@6.4.0-pre.10

## 6.4.0-pre.9

### Patch Changes

- feat: add basename support for data routers (#9026)
- Updated dependencies
  - react-router@6.4.0-pre.9

## 6.4.0-pre.8

### Patch Changes

- fix: Make path resolution trailing slash agnostic (#8861)
- fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- Updated dependencies
  - react-router@6.4.0-pre.8

## 6.4.0-pre.7

### Patch Changes

- Respect the `<Link replace>` prop if it is defined (#8779)
- Updated dependencies
  - `react-router@6.4.0-pre.7`

## 6.4.0-pre.6

### Patch Changes

- Updated dependencies
  - `react-router@6.4.0-pre.6`

## 6.4.0-pre.5

### Patch Changes

- Fix broken require for CJS builds
- Updated dependencies
  - `react-router@6.4.0-pre.5`

## 6.4.0-pre.4

### Patch Changes

- Fix missing `dist` files

## 6.4.0-pre.3

### Patch Changes

- Make `fallbackElement` optional and change type to `ReactNode` (type changes only) (#8896)
- Properly trigger error boundaries on 404 routes
