# `@remix-run/dev`

## 1.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.2`
  - `@remix-run/serve@1.7.2`

## 1.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.1`
  - `@remix-run/serve@1.7.1`

## 1.7.0

### Minor Changes

- Added support for importing `.gql` and `.graphql` files as plain text ([#3923](https://github.com/remix-run/remix/pull/3923))
- Added support for importing `.zip` and `.avif` files as resource URLs ([#3985](https://github.com/remix-run/remix/pull/3985))

### Patch Changes

- Removed our compiler's React shim in favor of esbuild's new automatic JSX transform ([#3860](https://github.com/remix-run/remix/pull/3860))
- Updated dependencies:
  - `@remix-run/server-runtime@1.7.0`
  - `@remix-run/serve@1.7.0`

## 1.6.8

### Patch Changes

- Added support for `.mjs` and `.cjs` file extensions for `remix.config` ([#3675](https://github.com/remix-run/remix/pull/3675))
- Added support for importing `.sql` files as text content ([#3190](https://github.com/remix-run/remix/pull/3190))
- Updated the compiler to make MDX builds deterministic (and a little faster!) ([#3966](https://github.com/remix-run/remix/pull/3966))
- Updated dependencies:
  - `@remix-run/server-runtime@1.6.8`
  - `@remix-run/serve@1.6.8`

## 1.6.7

### Patch Changes

- Remove logical nullish assignment, which is incompatible with Node v14. ([#3880](https://github.com/remix-run/remix/pull/3880))
- Don't show ESM warnings when consumed via dynamic import. ([#3872](https://github.com/remix-run/remix/pull/3872))
- Updated dependencies:
  - `@remix-run/serve@1.6.7`
  - `@remix-run/server-runtime@1.6.7`

## 1.6.6

### Patch Changes

- Write server build output files so that only assets imported from resource routes are written to disk ([#3817](https://github.com/remix-run/remix/pull/3817))
- Add support for exporting links in `.mdx` files ([#3801](https://github.com/remix-run/remix/pull/3801))
- Ensure that build hashing is deterministic ([#2027](https://github.com/remix-run/remix/pull/2027))
- Fix types for `@remix-run/dev/server-build` virtual module ([#3743](https://github.com/remix-run/remix/pull/3743))
- Updated dependencies:
  - `@remix-run/serve@1.6.6`
  - `@remix-run/server-runtime@1.6.6`

## 1.6.5

### Patch Changes

- Update `serverBareModulesPlugin` warning to use full import path ([#3656](https://github.com/remix-run/remix/pull/3656))
- Fix broken `--port` flag in `create-remix` ([#3694](https://github.com/remix-run/remix/pull/3694))
- Updated dependencies
  - `@remix-run/server-runtime`
  - `@remix-run/serve`
