# @remix-run/router

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
