# react-router

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
