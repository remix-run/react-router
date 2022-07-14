# @remix-run/router

## 0.2.0-pre.4

### Patch Changes

- 8ed30d37: fix: Handle fetcher 404s as normal boundary errors
- d5b25602: Feat: adds `deferred` support to data routers

  Returning a `deferred` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

  ```jsx
  // In your route loader, return a deferred() and choose per-key whether to
  // await the promise or not.  As soon as the awaited promises resolve, the
  // page will be rendered.
  function loader() {
    return deferred({
      critical: await getCriticalData(),
      lazy1: getLazyData(),
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
          {data => <p>{data}</p>}
        </Deferred>
      </>
    );
  }
  ```

- d68d03ed: feat: add basename support for data routers
- b7fadce8: ci: simplify dist/ directory for CJS/ESM only
- 3e7e502c: fix: Fix trailing slash behavior on pathless routing when using a basename (#9045)

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
