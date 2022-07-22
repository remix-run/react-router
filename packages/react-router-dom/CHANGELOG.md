# react-router-dom

## 6.4.0-pre.10

### Patch Changes

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
