# @remix-run/router

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
      "Content-Type": "application/json; charset=utf-8",
    },
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
