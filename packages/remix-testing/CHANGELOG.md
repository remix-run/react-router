# `@remix-run/testing`

## 1.11.0-pre.1

### Patch Changes

- Bump react router versions ([#5120](https://github.com/remix-run/remix/pull/5120))
- Updated dependencies:
  - `@remix-run/react@1.11.0-pre.1`
  - `@remix-run/node@1.11.0-pre.1`

## 1.11.0-pre.0

### Minor Changes

- Add unstable support for [Vanilla Extract](https://vanilla-extract.style) via the `future.unstable_vanillaExtract` feature flag ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add unstable support for CSS side-effect imports via the `future.unstable_cssSideEffectImports` feature flag ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add unstable support for CSS Modules via the `future.unstable_cssModules` feature flag ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Introduces the `defer()` API from `@remix-run/router` with support for server-rendering and HTTP streaming. This utility allows you to defer values returned from loaders by passing promises instead of resolved values. This has been refered to as "promise over the wire". ([#4920](https://github.com/remix-run/remix/pull/4920))

  Informational Resources:

  - https://gist.github.com/jacob-ebey/9bde9546c1aafaa6bc8c242054b1be26
  - https://github.com/remix-run/remix/blob/main/decisions/0004-streaming-apis.md

  Documentation Resources (better docs specific to remix are in the works):

  - https://reactrouter.com/en/main/utils/defer
  - https://reactrouter.com/en/main/components/await
  - https://reactrouter.com/en/main/hooks/use-async-value
  - https://reactrouter.com/en/main/hooks/use-async-error

- Updated dependencies:
  - `@remix-run/react@1.11.0-pre.0`
  - `@remix-run/node@1.11.0-pre.0`

## 1.10.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.10.1`
  - `@remix-run/node@1.10.1`

## 1.10.0

### Patch Changes

- Remove internal `installGlobals` function now that `@remix-run/web-form-data` includes support for passing a `HTMLFormElement` ([#4755](https://github.com/remix-run/remix/pull/4755))
- Use React Router data APIs directly ([#4915](https://github.com/remix-run/remix/pull/4915))
- Updated dependencies:
  - `@remix-run/react@1.10.0`
  - `@remix-run/node@1.10.0`

## 1.9.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.9.0`
  - `@remix-run/server-runtime@1.9.0`
  - `@remix-run/node@1.9.0`
