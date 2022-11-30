# `react-router`

## 6.4.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.0.4`

## 6.4.3

### Patch Changes

- `useRoutes` should be able to return `null` when passing `locationArg` ([#9485](https://github.com/remix-run/react-router/pull/9485))
- fix `initialEntries` type in `createMemoryRouter` ([#9498](https://github.com/remix-run/react-router/pull/9498))
- Updated dependencies:
  - `@remix-run/router@1.0.3`

## 6.4.2

### Patch Changes

- Fix `IndexRouteObject` and `NonIndexRouteObject` types to make `hasErrorElement` optional ([#9394](https://github.com/remix-run/react-router/pull/9394))
- Enhance console error messages for invalid usage of data router hooks ([#9311](https://github.com/remix-run/react-router/pull/9311))
- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))
- Updated dependencies:
  - `@remix-run/router@1.0.2`

## 6.4.1

### Patch Changes

- Preserve state from `initialEntries` ([#9288](https://github.com/remix-run/react-router/pull/9288))
- Updated dependencies:
  - `@remix-run/router@1.0.1`

## 6.4.0

Whoa this is a big one! `6.4.0` brings all the data loading and mutation APIs over from Remix. Here's a quick high level overview, but it's recommended you go check out the [docs][rr-docs], especially the [feature overview][rr-feature-overview] and the [tutorial][rr-tutorial].

**New APIs**

- Create your router with `createMemoryRouter`
- Render your router with `<RouterProvider>`
- Load data with a Route `loader` and mutate with a Route `action`
- Handle errors with Route `errorElement`
- Defer non-critical data with `defer` and `Await`

**Bug Fixes**

- Path resolution is now trailing slash agnostic (#8861)
- `useLocation` returns the scoped location inside a `<Routes location>` component (#9094)

**Updated Dependencies**

- `@remix-run/router@1.0.0`

[rr-docs]: https://reactrouter.com/
[rr-feature-overview]: https://reactrouter.com/en/6.4.0/start/overview
[rr-tutorial]: https://reactrouter.com/en/6.4.0/start/tutorial
