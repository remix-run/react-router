# `react-router-native`

## 6.4.3

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.3`

## 6.4.2

### Patch Changes

- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))
- Updated dependencies:
  - `react-router@6.4.2`

## 6.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.1`

## 6.4.0

**Bug Fixes**

- Path resolution is now trailing slash agnostic (#8861)
- `useLocation` returns the scoped location inside a `<Routes location>` component (#9094)

**Updated dependencies**

- `react-router@6.4.0`
