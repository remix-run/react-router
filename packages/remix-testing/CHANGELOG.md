# `@remix-run/testing`

## 1.19.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.19.3`
  - `@remix-run/react@1.19.3`

## 1.19.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.19.2`
  - `@remix-run/react@1.19.2`

## 1.19.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.19.1`
  - `@remix-run/react@1.19.1`

## 1.19.0

### Patch Changes

- Bump RR 6.14.2 ([#6854](https://github.com/remix-run/remix/pull/6854))
- Updated dependencies:
  - `@remix-run/react@1.19.0`
  - `@remix-run/node@1.19.0`
  - [`react-router-dom@6.14.2`](https://github.com/remix-run/react-router/releases/tag/react-router%406.14.2)
  - [`@remix-run/router@1.7.2`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#172)

## 1.18.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.18.1`
  - `@remix-run/node@1.18.1`
  - [`react-router-dom@6.14.1`](https://github.com/remix-run/react-router/releases/tag/react-router%406.14.1)
  - [`@remix-run/router@1.7.1`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#171)

## 1.18.0

### Minor Changes

- stabilize v2 dev server ([#6615](https://github.com/remix-run/remix/pull/6615))

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.18.0`
  - `@remix-run/node@1.18.0`

## 1.17.1

### Patch Changes

- Updated dependencies:
  - [`react-router-dom@6.13.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.13.0)
  - `@remix-run/react@1.17.1`
  - `@remix-run/node@1.17.1`

## 1.17.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.17.0`
  - `@remix-run/node@1.17.0`
  - [`react-router-dom@6.12.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.12.0)
  - [`@remix-run/router@1.6.3`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#163)

## 1.16.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.16.1`
  - `@remix-run/node@1.16.1`

## 1.16.0

### Minor Changes

- Enable support for [CSS Modules](https://github.com/css-modules/css-modules), [Vanilla Extract](http://vanilla-extract.style) and CSS side-effect imports ([#6046](https://github.com/remix-run/remix/pull/6046))

  These CSS bundling features were previously only available via `future.unstable_cssModules`, `future.unstable_vanillaExtract` and `future.unstable_cssSideEffectImports` options in `remix.config.js`, but they have now been stabilized.

  In order to use these features, check out our guide to [CSS bundling](https://remix.run/docs/en/1.16.0/guides/styling#css-bundling) in your project.

### Patch Changes

- feat(remix-testing): cast types to use Remix type definitions + allow passing context ([#6065](https://github.com/remix-run/remix/pull/6065))
- Updated dependencies:
  - [`react-router-dom@6.11.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.11.0)
  - [`@remix-run/router@1.6.0`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#160)
  - `@remix-run/react@1.16.0`
  - `@remix-run/node@1.16.0`

## 1.15.0

### Patch Changes

- Bumped React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.10.0) ([`e14699547`](https://github.com/remix-run/remix/commit/e1469954737a2e45636b6aef73dc9ae251fb1b20))
- Updated dependencies:
  - `@remix-run/react@1.15.0`
  - `@remix-run/node@1.15.0`

## 1.14.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.14.3`
  - `@remix-run/react@1.14.3`

## 1.14.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.14.2`
  - `@remix-run/react@1.14.2`

## 1.14.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.14.1`
  - `@remix-run/node@1.14.1`

## 1.14.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@1.14.0`
  - `@remix-run/node@1.14.0`
  - `@remix-run/router@1.3.3`
  - `react-router-dom@8.6.2`

## 1.13.0

### Minor Changes

- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.1) ([#5389](https://github.com/remix-run/remix/pull/5389))
- Updated dependencies:
  - `@remix-run/react@1.13.0`
  - `@remix-run/node@1.13.0`

## 1.12.0

### Patch Changes

- Ensure all routes have IDs when using the `createRemixStub` testing helper ([#5128](https://github.com/remix-run/remix/pull/5128))
- Bump React Router dependencies to the latest version. [See the release notes for more details.](https://github.com/remix-run/react-router/releases/tag/react-router%406.8.0) ([#5242](https://github.com/remix-run/remix/pull/5242))
- Updated dependencies:
  - `@remix-run/react@1.12.0`
  - `@remix-run/node@1.12.0`

## 1.11.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@1.11.1`
  - `@remix-run/react@1.11.1`

## 1.11.0

### Minor Changes

- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Introduces the `defer()` API from `@remix-run/router` with support for server-rendering and HTTP streaming. This utility allows you to defer values returned from `loader` functions by returning promises instead of resolved values. This has been refered to as _"sending a promise over the wire"_. ([#4920](https://github.com/remix-run/remix/pull/4920))

  Informational Resources:

  - <https://gist.github.com/jacob-ebey/9bde9546c1aafaa6bc8c242054b1be26>
  - <https://github.com/remix-run/remix/blob/main/decisions/0004-streaming-apis.md>

  Documentation Resources (better docs specific to Remix are in the works):

  - <https://reactrouter.com/en/main/utils/defer>
  - <https://reactrouter.com/en/main/components/await>
  - <https://reactrouter.com/en/main/hooks/use-async-value>
  - <https://reactrouter.com/en/main/hooks/use-async-error>

- Updated dependencies:
  - `@remix-run/react@1.11.0`
  - `@remix-run/node@1.11.0`

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
