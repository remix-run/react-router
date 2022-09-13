# react-router

## 6.4.0

### Minor Changes

- f264d828: feat: `useSearchParams` supports functional updates like `useState` (#8955)

### Patch Changes

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
- c21e38ef: fix: avoid navigation loops in <Navigate> re-renders in data routers (#9124)
- f264d828: Fix broken require for CJS builds
- f264d828: Make `fallbackElement` optional and change type to `ReactNode` (#8896)
- f264d828: Release script tests
- f264d828: Properly trigger error boundaries on 404 routes
- e766ab5a: fix: update `useLocation` to return the scoped `Location` when inside a `<Routes location>` component
- d5b25602: Feat: adds `defer()` support to data routers

  Returning a `defer()` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

  ```jsx
  // In your route loader, return a defer() and choose per-key whether to
  // await the promise or not.  As soon as the awaited promises resolve, the
  // page will be rendered.
  function loader() {
    return defer({
      critical: await getCriticalData(),
      lazy: getLazyData(),
    });
  };

  // In your route element, grab the values from useLoaderData and render them
  // with <Await> inside a <React.Suspense> boundary
  function Page() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={data.lazy} errorElement={<RenderError />}>
            <RenderData />
          </Await>
        </React.Suspense>
      </>
    );
  }

  // Use separate components to render the data once it resolves, and access it
  // via the useAsyncValue hook
  function RenderData() {
    let data = useAsyncValue();
    return <p>Lazy: {data}</p>;
  }

  function RenderError() {
    let data = useAsyncError();
    return <p>Error! {data.message} {data.stack}</p>;
  }
  ```

  If you want to skip the separate components, you can use the Render Props
  pattern and handle the rendering of the deferred data inline:

  ```jsx
  function Page() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={data.lazy} errorElement={<RenderError />}>
            {data => <p>{data}</p>}
          </Await>
        </React.Suspense>
      </>
    );
  }
  ```

- 92aa5bb0: Deferred API Updates

  - Removes `<Suspense>` from inside `<Deferred>`, requires users to render their own suspense boundaries
  - Updates `Deferred` to use a true error boundary to catch render errors as well as data errors
  - Support array and single promise usages
    - `return defer([ await critical(), lazy() ])`
    - `return defer(lazy())`
  - Remove `Deferrable`/`ResolvedDeferrable` in favor of raw `Promise`'s and `Awaited`
  - Remove generics from `useAsyncValue` until `useLoaderData` generic is decided in 6.5

- a04ab758: fix: rename resetScroll -> preventScrollReset (#9199)
- 112c02c7: fix: Avoid suspense loops on promise aborted values (#9226)
- e6b68116: fix: Additional logic fixed for relative navigation from index/pathless layout routes (#8985)
- d68d03ed: feat: add basename support for data routers
- 9fa39a6d: fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- c3406eb9: fix: Rename `<Deferred>` to `<Await>` (#9095)

  - We are no longer replacing the `Promise` on `loaderData` with the value/error
    when it settles so it's now always a `Promise`.
  - To that end, we changed from `<Deferred value={promise}>` to
    `<Await resolve={promise}>` for clarity, and it also now supports using
    `<Await>` with raw promises from anywhere, not only those on `loaderData`
    from a defer() call.
    - Note that raw promises will not be automatically cancelled on interruptions
      so they are not recommended
  - The hooks are now `useAsyncValue`/`useAsyncError`

- 3e7e502c: fix: Fix trailing slash behavior on pathless routing when using a basename (#9045)
- f264d828: fix: Properly handle relative navigation from index/pathless routes (#8954)
- f264d828: fix: webpack + React 17 won't build because of named imports of React 18 APIs (#8938)
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

- Updated dependencies [e8dda1ba]
- Updated dependencies [f264d828]
- Updated dependencies [5c8fdeca]
- Updated dependencies [0bb4410b]
- Updated dependencies [c17512d8]
- Updated dependencies [9fa39a6d]
- Updated dependencies [8ed30d37]
- Updated dependencies [5bab9ebf]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [f264d828]
- Updated dependencies [d5b25602]
- Updated dependencies [5a56b5c9]
- Updated dependencies [92aa5bb0]
- Updated dependencies [f264d828]
- Updated dependencies [9e2f92ac]
- Updated dependencies [7a057e19]
- Updated dependencies [a04ab758]
- Updated dependencies [112c02c7]
- Updated dependencies [d68d03ed]
- Updated dependencies [9fa39a6d]
- Updated dependencies [b7fadce8]
- Updated dependencies [c3406eb9]
- Updated dependencies [1dc082c0]
- Updated dependencies [3e7e502c]
- Updated dependencies [f3182f4a]
- Updated dependencies [5ba67d83]
- Updated dependencies [f264d828]
- Updated dependencies [26e8b8e7]
- Updated dependencies [d0114e26]
- Updated dependencies [3e99fb22]
  - @remix-run/router@1.0.0

## 6.4.0-pre.15

### Patch Changes

- fix: remove internal router singleton (#9227)
- fix: Avoid suspense loops on promise aborted values (#9226)
- Updated dependencies
  - @remix-run/router@0.2.0-pre.10

## 6.4.0-pre.14

### Patch Changes

- fix: rename resetScroll -> preventScrollReset (#9199)
- Updated dependencies
  - @remix-run/router@0.2.0-pre.9

## 6.4.0-pre.13

### Patch Changes

- feat: add `relative=path` option for url-relative routing (#9160)

  Adds a `relative=path` option to navigation aspects to allow users to opt-into paths behaving relative to the current URL instead of the current route hierarchy. This is useful if you're sharing route patterns in a non-nested structure UI reasons:

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

- Updated dependencies
  - @remix-run/router@0.2.0-pre.8

## 6.4.0-pre.12

### Patch Changes

- fix: avoid navigation loops in `<Navigate>` re-renders in data routers (#9124)
- Updated dependencies
  - @remix-run/router@0.2.0-pre.7

## 6.4.0-pre.11

### Patch Changes

- c3406eb9: fix: Rename `<Deferred>` to `<Await>` (#9095)

  - We are no longer replacing the `Promise` on `loaderData` with the value/error
    when it settles so it's now always a `Promise`.
  - To that end, we changed from `<Deferred value={promise}>` to
    `<Await resolve={promise}>` for clarity, and it also now supports using
    `<Await>` with raw promises from anywhere, not only those on `loaderData`
    from a defer() call.
    - Note that raw promises will not be automatically cancelled on interruptions
      so they are not recommended
  - The hooks are now `useAsyncValue`/`useAsyncError`

- Updated dependencies
  - @remix-run/router@0.2.0-pre.6

## 6.4.0-pre.10

### Patch Changes

- feat: Deferred API Updates (#9070)

  - Removes `<Suspense>` from inside `<Await>`, requires users to render their own suspense boundaries
  - Updates `Await` to use a true error boundary to catch render errors as well as data errors
  - Support array and single promise usages
    - `return defer([ await critical(), lazy() ])`
    - `return defer(lazy())`
  - Remove `Deferrable`/`ResolvedDeferrable` in favor of raw `Promise`'s and `Awaited`
  - Remove generics from `useAsyncValue` until `useLoaderData` generic is decided in 6.5

- Updated dependencies
  - @remix-run/router@0.2.0-pre.5

## 6.4.0-pre.9

### Patch Changes

- Feat: adds `defer()` support to data routers (#9002)

  Returning a `defer()` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

  ```jsx
  // In your route loader, return a defer() and choose per-key whether to
  // await the promise or not.  As soon as the awaited promises resolve, the
  // page will be rendered.
  function loader() {
    return defer({
      critical: await getCriticalData(),
      lazy: getLazyData(),
    });
  };

  // In your route element, grab the values from useLoaderData and render them
  // with <Await>
  function Page() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={data.lazy} errorElement={<RenderError />}>
            <RenderData />
          </Await>
        </React.Suspense>
      </>
    );
  }

  // Use separate components to render the data once it resolves, and access it
  // via the useAsyncValue hook
  function RenderData() {
    let data = useAsyncValue();
    return <p>Lazy: {data}</p>;
  }

  function RenderError() {
    let data = useAsyncError();
    return <p>Error! {data.message} {data.stack}</p>;
  }
  ```

  If you want to skip the separate components, you can use the Render Props
  pattern and handle the rendering of the deferred data inline:

  ```jsx
  function Page() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <React.Suspense fallback={<p>Loading...</p>}>
          <Await resolve={data.lazy} errorElement={<RenderError />}>
            {data => <p>{data}</p>}
          </Await>
        </React.Suspense>
      </>
    );
  }
  ```

- feat: add basename support for data routers (#9026)
- fix: Fix trailing slash behavior on pathless routing when using a basename (#9045)
- Updated dependencies
  - @remix-run/router@0.2.0-pre.4

## 6.4.0-pre.8

### Patch Changes

- fix: Make path resolution trailing slash agnostic (#8861)
- fix: Additional logic fixed for relative navigation from index/pathless layout routes (#8985)
- fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- Updated dependencies
  - @remix-run/router@0.2.0-pre.3

## 6.4.0-pre.7

### Minor Changes

- Add support for functional updates in `useSearchParams` (similar to the `useState` callback signature) (#8955)

### Patch Changes

- Properly handle relative navigation from index/pathless routes (#8954)
- Fix issues building with webpack + React 17 (#8938)
- Updated dependencies
  - `@remix-run/router@0.2.0-pre.2`

## 6.4.0-pre.6

## 6.4.0-pre.5

### Patch Changes

- Fix broken require for CJS builds

## 6.4.0-pre.4

### Patch Changes

- Fix missing `dist` files

## 6.4.0-pre.3

### Patch Changes

- Make `fallbackElement` optional and change type to `ReactNode` (type changes only) (#8896)
- Properly trigger error boundaries on 404 routes
