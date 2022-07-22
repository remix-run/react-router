# react-router

## 6.4.0-pre.10

### Patch Changes

- 92aa5bb0: Deferred API Updates

  - Removes `<Suspense>` from inside `<Deferred>`, requires users to render their own suspense boundaries
  - Updates `Deferred` to use a true error boundary to catch render errors as well as data errors
  - Support array and single promise usages
    - `return deferred([ await critical(), lazy() ])`
    - `return deferred(lazy())`
  - Remove `Deferrable`/`ResolvedDeferrable` in favor of raw `Promise`'s and `Awaited`
  - Remove generics from `useDeferredData` until `useLoaderData` generic is decided in 6.5

- 9e2f92ac: feat: Add `createStaticRouter` for `@remix-run/router` SSR usage

  **Notable changes:**

  - `request` is now the driving force inside the router utils, so that we can better handle `Request` instances coming form the server (as opposed to `string` and `Path` instances coming from the client)
  - Removed the `signal` param from `loader` and `action` functions in favor of `request.signal`

  **Example usage (Document Requests):**

  ```jsx
  // Create a static handler
  let { dataRoutes, query } = unstable_createStaticHandler(routes);

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
      <DataStaticRouter dataRoutes={dataRoutes} state={state} />
    </React.StrictMode>
  );

  // Grab the hydrationData to send to the client for <DataBrowserRouter>
  let hydrationData = {
    loaderData: state.loaderData,
    actionData: state.actionData,
    errors: state.errors
  };
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

- Updated dependencies [92aa5bb0]
- Updated dependencies [9e2f92ac]
- Updated dependencies [f3182f4a]
  - @remix-run/router@0.2.0-pre.5

## 6.4.0-pre.9

### Patch Changes

- Feat: adds `deferred` support to data routers (#9002)

  Returning a `deferred` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

  ```jsx
  // In your route loader, return a deferred() and choose per-key whether to
  // await the promise or not.  As soon as the awaited promises resolve, the
  // page will be rendered.
  function loader() {
    return deferred({
      critical: await getCriticalData(),
      lazy: getLazyData(),
    });
  };

  // In your route element, grab the values from useLoaderData and render them
  // with <Deferred>
  function DeferredPage() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <Suspense fallback={<p>Loading...</p>}>
          <Deferred value={data.lazy} errorElement={<RenderDeferredError />}>
            <RenderDeferredData />
          </Deferred>
        </Suspense>
      </>
    );
  }

  // Use separate components to render the data once it resolves, and access it
  // via the useDeferredData hook
  function RenderDeferredData() {
    let data = useDeferredData();
    return <p>Lazy: {data}</p>;
  }

  function RenderDeferredError() {
    let data = useRouteError();
    return <p>Error! {data.message} {data.stack}</p>;
  }
  ```

  If you want to skip the separate components, you can use the Render Props
  pattern and handle the rendering of the deferred data inline:

  ```jsx
  function DeferredPage() {
    let data = useLoaderData();
    return (
      <>
        <p>Critical Data: {data.critical}</p>
        <Suspense fallback={<p>Loading...</p>}>
          <Deferred value={data.lazy} errorElement={<RenderDeferredError />}>
            {data => <p>{data}</p>}
          </Deferred>
        </Suspense>
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
