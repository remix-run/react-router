# @remix-run/router

## 0.2.0-pre.10

### Patch Changes

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

- 112c02c7: fix: Avoid suspense loops on promise aborted values

## 0.2.0-pre.9

### Patch Changes

- fix: rename resetScroll -> preventScrollReset (#9199)
- fix: Await should fallback on route params navigations (#9181)
- fix: proxy defer resolve/reject values through tracked promises (#9200)

## 0.2.0-pre.8

### Patch Changes

- fix: avoid uneccesary re-renders on `defer` resolution (#9155)
- fix: pass `useMatches` objects to `ScrollRestoration` `getKey` (#9157)
- fix: fetcher submission revalidating fetchers using wrong key (#9166)
- fix: use a push navigation on submission errors (#9162)

## 0.2.0-pre.7

### Patch Changes

- fix: fix default redirect push/replace behavior (#9117)

## 0.2.0-pre.6

### Patch Changes

- fix: Rename `<Deferred>` to `<Await>` (#9095)

  - We are no longer replacing the `Promise` on `loaderData` with the value/error
    when it settles so it's now always a `Promise`.
  - To that end, we changed from `<Deferred value={promise}>` to
    `<Await resolve={promise}>` for clarity, and it also now supports using
    `<Await>` with raw promises from anywhere, not only those on `loaderData`
    from a defer() call.
    - Note that raw promises will not be automatically cancelled on interruptions
      so they are not recommended
  - The hooks are now `useAsyncValue`/`useAsyncError`

## 0.2.0-pre.5

### Patch Changes

- feat: Deferred API Updates (#9070)

  - Support array and single promise usages
    - `return defer([ await critical(), lazy() ])`
    - `return defer(lazy())`
  - Remove `Deferrable`/`ResolvedDeferrable` in favor of raw `Promise`'s and `Awaited`
  - Remove generics from `useAsyncValue` until `useLoaderData` generic is decided in 6.5

- feat: Add `createStaticRouter` for `@remix-run/router` SSR usage (#9013)

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

- feat: SSR Updates for React Router (#9058)

  _Note: The Data-Router SSR aspects of `@remix-run/router` and `react-router-dom` are being released as **unstable** in this release (`unstable_createStaticHandler` and `unstable_DataStaticRouter`), and we plan to finalize them in a subsequent minor release once the kinks can be worked out with the Remix integration. To that end, they are available for use, but are subject to breaking changes in the next minor release._

  - Remove `useRenderDataRouter()` in favor of `<DataRouterProvider>`/`<DataRouter>`
  - Support automatic hydration in `<DataStaticRouter>`/`<DataBrowserRouter>`/`<DataHashRouter>`
    - Uses `window.__staticRouterHydrationData`
    - Can be disabled on the server via `<DataStaticRouter hydrate={false}>`
    - Can be disabled (or overridden) in the browser by passing `hydrationData` to `<DataBrowserRouter>`/`<DataHashRouter>`
  - `<DataStaticRouter>` now tracks it's own SSR error boundaries on `StaticHandlerContext`
  - `StaticHandlerContext` now exposes `statusCode`/`loaderHeaders`/`actionHeaders`
  - `foundMissingHydrationData` check removed since Remix routes may have loaders (for modules) that don't return data for `loaderData`

## 0.2.0-pre.4

### Patch Changes

- fix: Handle fetcher 404s as normal boundary errors (#9015)
- feat: adds `defer()` support to data routers (#9002)
- feat: add basename support for data routers (#9026)
- ci: simplify dist/ directory for CJS/ESM only (#9017)
- fix: Fix trailing slash behavior on pathless routing when using a basename (#9045)

## 0.2.0-pre.3

### Patch Changes

- fix: properly handle `<Form encType="multipart/form-data">` submissions (#8984)
- fix: Make path resolution trailing slash agnostic (#8861)
- fix: don't default to a `REPLACE` navigation on form submissions if the action redirected. The redirect takes care of avoiding the back-button-resubmit scenario, so by using a `PUSH` we allow the back button to go back to the pre-submission form page (#8979)
- fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- fix: preserve loader data for loaders that opted out of revalidation (#8973)

[Full Changes](https://github.com/remix-run/react-router/compare/%40remix-run/router%400.2.0-pre.2...%40remix-run/router%400.2.0-pre.3)

## 0.2.0-pre.2

### Patch Changes

- Capture fetcher errors at contextual route error boundaries (#8945)

## 0.2.0-pre.1

### Patch Changes

- Fix missing `dist` files

## 0.2.0-pre.0

### Minor Changes

- Change `formMethod=GET` to be a loading navigation instead of submitting

### Patch Changes

- Make `fallbackElement` optional and change type to `ReactNode` (type changes only) (#8896)
- Properly trigger error boundaries on 404 routes
- Fix `resolveTo` so that it does not mutate the provided pathname (#8839)
- Pass fetcher `actionResult` through to `shouldRevalidate` on fetcher submissions
