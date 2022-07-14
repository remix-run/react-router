# react-router

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
        <Deferred
          value={data.lazy}
          fallback={<p>Loading...</p>}
          errorElement={<RenderDeferredError />}>
          <RenderDeferredData />
        </Deferred>
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
        <Deferred value={data.lazy} fallback={<p>Loading...</p>}>
          {(data) => <p>{data}</p>}
        </Deferred>
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
