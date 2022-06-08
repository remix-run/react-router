# @remix-run/router

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
