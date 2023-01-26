# `react-router-dom`

## 6.8.0

### Minor Changes

- Support absolute URLs in `<Link to>`. If the URL is for the current origin, it will still do a client-side navigation. If the URL is for a different origin then it will do a fresh document request for the new origin. ([#9900](https://github.com/remix-run/react-router/pull/9900))

  ```tsx
  <Link to="https://neworigin.com/some/path">    {/* Document request */}
  <Link to="//neworigin.com/some/path">          {/* Document request */}
  <Link to="https://www.currentorigin.com/path"> {/* Client-side navigation */}
  ```

### Patch Changes

- Fix bug with search params removal via `useSearchParams` ([#9969](https://github.com/remix-run/react-router/pull/9969))
- Respect `preventScrollReset` on `<fetcher.Form>` ([#9963](https://github.com/remix-run/react-router/pull/9963))
- Fix navigation for hash routers on manual URL changes ([#9980](https://github.com/remix-run/react-router/pull/9980))
- Use `pagehide` instead of `beforeunload` for `<ScrollRestoration>`. This has better cross-browser support, specifically on Mobile Safari. ([#9945](https://github.com/remix-run/react-router/pull/9945))
- Updated dependencies:
  - `@remix-run/router@1.3.1`
  - `react-router@6.8.0`

## 6.7.0

### Minor Changes

- Add `unstable_useBlocker` hook for blocking navigations within the app's location origin ([#9709](https://github.com/remix-run/react-router/pull/9709))
- Add `unstable_usePrompt` hook for blocking navigations within the app's location origin ([#9932](https://github.com/remix-run/react-router/pull/9932))
- Add `preventScrollReset` prop to `<Form>` ([#9886](https://github.com/remix-run/react-router/pull/9886))

### Patch Changes

- Added pass-through event listener options argument to `useBeforeUnload` ([#9709](https://github.com/remix-run/react-router/pull/9709))
- Streamline jsdom bug workaround in tests ([#9824](https://github.com/remix-run/react-router/pull/9824))
- Updated dependencies:
  - `@remix-run/router@1.3.0`
  - `react-router@6.7.0`

## 6.6.2

### Patch Changes

- Ensure `useId` consistency during SSR ([#9805](https://github.com/remix-run/react-router/pull/9805))
- Updated dependencies:
  - `react-router@6.6.2`

## 6.6.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.2.1`
  - `react-router@6.6.1`

## 6.6.0

### Minor Changes

- Add `useBeforeUnload()` hook ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Remove `unstable_` prefix from `createStaticHandler`/`createStaticRouter`/`StaticRouterProvider` ([#9738](https://github.com/remix-run/react-router/pull/9738))

### Patch Changes

- Proper hydration of `Error` objects from `StaticRouterProvider` ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Support uppercase `<Form method>` and `useSubmit` method values ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Skip initial scroll restoration for SSR apps with `hydrationData` ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Fix `<button formmethod>` form submission overriddes ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Updated dependencies:
  - `@remix-run/router@1.2.0`
  - `react-router@6.6.0`

## 6.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.5.0`
  - `@remix-run/router@1.1.0`

## 6.4.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.0.5`
  - `react-router@6.4.5`

## 6.4.4

### Patch Changes

- Fix issues with encoded characters in `NavLink` and descendant `<Routes>` ([#9589](https://github.com/remix-run/react-router/pull/9589), [#9647](https://github.com/remix-run/react-router/pull/9647))
- Properly serialize/deserialize `ErrorResponse` instances when using built-in hydration ([#9593](https://github.com/remix-run/react-router/pull/9593))
- Support `basename` in static data routers ([#9591](https://github.com/remix-run/react-router/pull/9591))
- Updated dependencies:
  - `@remix-run/router@1.0.4`
  - `react-router@6.4.4`

## 6.4.3

### Patch Changes

- Fix hrefs generated for `createHashRouter` ([#9409](https://github.com/remix-run/react-router/pull/9409))
- fix encoding/matching issues with special chars ([#9477](https://github.com/remix-run/react-router/pull/9477), [#9496](https://github.com/remix-run/react-router/pull/9496))
- Properly support `index` routes with a `path` in `useResolvedPath` ([#9486](https://github.com/remix-run/react-router/pull/9486))
- Respect `relative=path` prop on `NavLink` ([#9453](https://github.com/remix-run/react-router/pull/9453))
- Fix `NavLink` behavior for root urls ([#9497](https://github.com/remix-run/react-router/pull/9497))
- Updated dependencies:
  - `@remix-run/router@1.0.3`
  - `react-router@6.4.3`

## 6.4.2

### Patch Changes

- Respect `basename` in `useFormAction` ([#9352](https://github.com/remix-run/react-router/pull/9352))
- Enhance console error messages for invalid usage of data router hooks ([#9311](https://github.com/remix-run/react-router/pull/9311))
- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))
- Updated dependencies:
  - `react-router@6.4.2`
  - `@remix-run/router@1.0.2`

## 6.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.1`
  - `@remix-run/router@1.0.1`

## 6.4.0

Whoa this is a big one! `6.4.0` brings all the data loading and mutation APIs over from Remix. Here's a quick high level overview, but it's recommended you go check out the [docs][rr-docs], especially the [feature overview][rr-feature-overview] and the [tutorial][rr-tutorial].

**New APIs**

- Create your router with `createMemoryRouter`/`createBrowserRouter`/`createHashRouter`
- Render your router with `<RouterProvider>`
- Load data with a Route `loader` and mutate with a Route `action`
- Handle errors with Route `errorElement`
- Submit data with the new `<Form>` component
- Perform in-page data loads and mutations with `useFetcher()`
- Defer non-critical data with `defer` and `Await`
- Manage scroll position with `<ScrollRestoration>`

**New Features**

- Perform path-relative navigations with `<Link relative="path">` (#9160)

**Bug Fixes**

- Path resolution is now trailing slash agnostic (#8861)
- `useLocation` returns the scoped location inside a `<Routes location>` component (#9094)
- respect the `<Link replace>` prop if it is defined (#8779)

**Updated Dependencies**

- `react-router@6.4.0`

[rr-docs]: https://reactrouter.com
[rr-feature-overview]: https://reactrouter.com/start/overview
[rr-tutorial]: https://reactrouter.com/start/tutorial
