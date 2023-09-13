# `react-router-native`

## 6.16.0

### Minor Changes

- Updated dependencies:
  - `react-router@6.16.0`

## 6.15.0

### Minor Changes

- Add's a new `redirectDocument()` function which allows users to specify that a redirect from a `loader`/`action` should trigger a document reload (via `window.location`) instead of attempting to navigate to the redirected location via React Router ([#10705](https://github.com/remix-run/react-router/pull/10705))

### Patch Changes

- Update `@ungap/url-search-params` dependency from `^0.1.4` to `^0.2.2` ([#10590](https://github.com/remix-run/react-router/pull/10590))
- Updated dependencies:
  - `react-router@6.15.0`

## 6.14.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.2`

## 6.14.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.1`

## 6.14.1-pre.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.1-pre.1`

## 6.14.1-pre.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.1-pre.0`

## 6.14.0

### Patch Changes

- Upgrade `typescript` to 5.1 ([#10581](https://github.com/remix-run/react-router/pull/10581))
- Updated dependencies:
  - `react-router@6.14.0`

## 6.13.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.13.0`

## 6.12.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.12.1`

## 6.12.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.12.0`

## 6.11.2

### Patch Changes

- Export `SetURLSearchParams` type ([#10444](https://github.com/remix-run/react-router/pull/10444))
- Updated dependencies:
  - `react-router@6.11.2`

## 6.11.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.1`

## 6.11.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.0`

## 6.10.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.10.0`

## 6.9.0

### Minor Changes

- Updated dependencies:
  - `react-router@6.9.0`

## 6.8.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.8.2`

## 6.8.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.8.1`

## 6.8.0

### Patch Changes

- Fix bug with search params removal via `useSearchParams` ([#9969](https://github.com/remix-run/react-router/pull/9969))
- Updated dependencies:
  - `react-router@6.8.0`

## 6.7.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.7.0`

## 6.6.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.2`

## 6.6.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.1`

## 6.6.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.0`

## 6.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.5.0`

## 6.4.5

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.5`

## 6.4.4

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.4`

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
