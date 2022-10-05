# `react-router-dom`

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

[rr-docs]: https://reactrouter.com/
[rr-feature-overview]: https://reactrouter.com/en/v6.4.0/start/overview
[rr-tutorial]: https://reactrouter.com/en/v6.4.0/start/tutorial
