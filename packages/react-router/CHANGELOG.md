# react-router

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
            {(data) => <p>{data}</p>}
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
