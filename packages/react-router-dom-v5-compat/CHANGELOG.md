# `react-router-dom-v5-compat`

## 6.16.0-pre.0

### Minor Changes

- Removed internal API only required for the Remix v1 back-compat layer and no longer needed in Remix v2 (`_isFetchActionRedirect`, `_hasFetcherDoneAnything`) ([#10715](https://github.com/remix-run/react-router/pull/10715))

### Patch Changes

- Move the `@private` class export `ErrorResponse` to an `UNSAFE_ErrorResponseImpl` export since it is an implementation detail and there should be no construction of `ErrorResponse` instances in userland. This frees us up to export a `type ErrorResponse` which correlates to an instance of the class via `InstanceType`. Userland code should only ever be using `ErrorResponse` as a type and should be type-narrowing via `isRouteErrorResponse`. ([#10811](https://github.com/remix-run/react-router/pull/10811))
- Export `ShouldRevalidateFunctionArgs` interface ([#10797](https://github.com/remix-run/react-router/pull/10797))
- Updated dependencies:
  - `react-router-dom@6.16.0-pre.0`
  - `react-router@6.16.0-pre.0`

## 6.15.0

### Minor Changes

- Add's a new `redirectDocument()` function which allows users to specify that a redirect from a `loader`/`action` should trigger a document reload (via `window.location`) instead of attempting to navigate to the redirected location via React Router ([#10705](https://github.com/remix-run/react-router/pull/10705))

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.15.0`
  - `react-router@6.15.0`

## 6.14.2

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.14.2`
  - `react-router@6.14.2`

## 6.14.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.1`
  - `react-router-dom@6.14.1`

## 6.14.0

### Patch Changes

- Upgrade `typescript` to 5.1 ([#10581](https://github.com/remix-run/react-router/pull/10581))
- Updated dependencies:
  - `react-router@6.14.0`
  - `react-router-dom@6.14.0`

## 6.13.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.13.0`
  - `react-router-dom@6.13.0`

## 6.12.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.12.1`
  - `react-router-dom@6.12.1`

## 6.12.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.12.0`
  - `react-router@6.12.0`

## 6.11.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.2`
  - `react-router-dom@6.11.2`

## 6.11.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.1`
  - `react-router-dom@6.11.1`

## 6.11.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.0`
  - `react-router-dom@6.11.0`

## 6.10.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.10.0`
  - `react-router-dom@6.10.0`

## 6.9.0

### Minor Changes

- Updated dependencies:
  - `react-router@6.9.0`
  - `react-router-dom@6.9.0`

### Patch Changes

- Add missed data router API re-exports ([#10171](https://github.com/remix-run/react-router/pull/10171))

## 6.8.2

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.8.2`
  - `react-router@6.8.2`

## 6.8.1

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.8.1`
  - `react-router@6.8.1`

## 6.8.0

### Patch Changes

- Fix SSR `useLayoutEffect` `console.error` when using `CompatRouter` ([#9820](https://github.com/remix-run/react-router/pull/9820))
- Updated dependencies:
  - `react-router-dom@6.8.0`
  - `react-router@6.8.0`

## 6.7.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.7.0`
  - `react-router-dom@6.7.0`

## 6.6.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.2`
  - `react-router-dom@6.6.2`

## 6.6.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.1`
  - `react-router-dom@6.6.1`

## 6.6.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.6.0`
  - `react-router@6.6.0`

## 6.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.5.0`
  - `react-router-dom@6.5.0`

## 6.4.5

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.5`
  - `react-router-dom@6.4.5`

## 6.4.4

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.4.4`
  - `react-router@6.4.4`

## 6.4.3

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.4.3`
  - `react-router@6.4.3`

## 6.4.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.2`
  - `react-router-dom@6.4.2`

## 6.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.1`
  - `react-router-dom@6.4.1`

## 6.4.0

**Updated dependencies**

- `react-router-dom@6.4.0`
- `react-router@6.4.0`
