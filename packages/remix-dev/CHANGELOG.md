# `@remix-run/dev`

## 1.15.0

### Minor Changes

- Added deprecation warning for `v2_normalizeFormMethod` ([#5863](https://github.com/remix-run/remix/pull/5863))

- Added a new `future.v2_normalizeFormMethod` flag to normalize the exposed `useNavigation().formMethod` as an uppercase HTTP method to align with the previous `useTransition` behavior as well as the `fetch()` behavior of normalizing to uppercase HTTP methods. ([#5815](https://github.com/remix-run/remix/pull/5815))

  - When `future.v2_normalizeFormMethod === false`,
    - `useNavigation().formMethod` is lowercase
    - `useFetcher().formMethod` is uppercase
  - When `future.v2_normalizeFormMethod === true`:
    - `useNavigation().formMethod` is uppercase
    - `useFetcher().formMethod` is uppercase

- Added deprecation warning for `browserBuildDirectory` in `remix.config` ([#5702](https://github.com/remix-run/remix/pull/5702))

- Added deprecation warning for `CatchBoundary` in favor of `future.v2_errorBoundary` ([#5718](https://github.com/remix-run/remix/pull/5718))

- Added experimental support for Vanilla Extract caching, which can be enabled by setting `future.unstable_vanillaExtract: { cache: true }` in `remix.config`. This is considered experimental due to the use of a brand new Vanilla Extract compiler under the hood. In order to use this feature, you must be using at least `v1.10.0` of `@vanilla-extract/css`. ([#5735](https://github.com/remix-run/remix/pull/5735))

- Added deprecation warning for `serverBuildDirectory` in `remix.config` ([#5704](https://github.com/remix-run/remix/pull/5704))

### Patch Changes

- Fixed issue to ensure changes to CSS inserted via `@remix-run/css-bundle` are picked up during HMR ([#5823](https://github.com/remix-run/remix/pull/5823))
- We now use `path.resolve` when re-exporting `entry.client` ([#5707](https://github.com/remix-run/remix/pull/5707))
- Added support for `.mjs` and `.cjs` extensions when detecting CSS side-effect imports ([#5564](https://github.com/remix-run/remix/pull/5564))
- Fixed resolution issues for pnpm users installing `react-refresh` ([#5637](https://github.com/remix-run/remix/pull/5637))
- Added deprecation warning for `future.v2_meta` ([#5878](https://github.com/remix-run/remix/pull/5878))
- Added optional entry file support for React 17 ([#5681](https://github.com/remix-run/remix/pull/5681))
- Updated dependencies:
  - `@remix-run/server-runtime@1.15.0`

## 1.14.3

### Patch Changes

- dev server is resilient to build failures ([#5795](https://github.com/remix-run/remix/pull/5795))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.3`

## 1.14.2

### Patch Changes

- remove premature deprecation warnings ([#5790](https://github.com/remix-run/remix/pull/5790))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.2`

## 1.14.1

### Patch Changes

- Add types for importing `*.ico` files ([#5430](https://github.com/remix-run/remix/pull/5430))
- Allow `moduleResolution: "bundler"` in tsconfig.json ([#5576](https://github.com/remix-run/remix/pull/5576))
- Fix issue with x-route imports creating multiple entries in the module graph ([#5721](https://github.com/remix-run/remix/pull/5721))
- Add `serverBuildTarget` deprecation warning ([#5624](https://github.com/remix-run/remix/pull/5624))
- Updated dependencies:
  - `@remix-run/server-runtime@1.14.1`

## 1.14.0

### Minor Changes

- Hot Module Replacement and Hot Data Revalidation ([#5259](https://github.com/remix-run/remix/pull/5259))
  - Requires `unstable_dev` future flag to be enabled
  - HMR provided through React Refresh
  - Features:
    - HMR for component and style changes
    - HDR when loaders for current route change
  - Known limitations for MVP:
    - Only implemented for React via React Refresh
    - No `import.meta.hot` API exposed yet
    - Revalidates _all_ loaders on route when loader changes are detected
    - Loader changes do not account for imported dependencies changing
- Make `entry.client` and `entry.server` files optional ([#4600](https://github.com/remix-run/remix/pull/4600))
  - we'll use a bundled version of each unless you provide your own

### Patch Changes

- Fixes flat route inconsistencies where `route.{ext}` wasn't always being treated like `index.{ext}` when used in a folder ([#5459](https://github.com/remix-run/remix/pull/5459))

  - Route conflict no longer throw errors and instead display a helpful warning that we're using the first one we found.

    ```log
    ⚠️ Route Path Collision: "/dashboard"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/dashboard/route.tsx
    ⭕️️ routes/dashboard.tsx
    ```

    ```log
    ⚠️ Route Path Collision: "/"

    The following routes all define the same URL, only the first one will be used

    🟢️️ routes/_landing._index.tsx
    ⭕️️ routes/_dashboard._index.tsx
    ⭕️ routes/_index.tsx
    ```

- Log errors thrown during initial build in development. ([#5441](https://github.com/remix-run/remix/pull/5441))

- Sync `FutureConfig` interface between packages ([#5398](https://github.com/remix-run/remix/pull/5398))

- Add file loader for importing `.csv` files ([#3920](https://github.com/remix-run/remix/pull/3920))

- Updated dependencies:
  - `@remix-run/server-runtime@1.14.0`

## 1.13.0

### Minor Changes

- We are deprecating `serverBuildTarget` in `remix.config`. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5354](https://github.com/remix-run/remix/pull/5354))
- Add built-in support for PostCSS via the `future.unstable_postcss` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))
- Add built-in support for Tailwind via the `future.unstable_tailwind` feature flag ([#5229](https://github.com/remix-run/remix/pull/5229))

### Patch Changes

- Mark Vanilla Extract files as side effects to ensure that files only containing global styles aren't tree-shaken ([#5246](https://github.com/remix-run/remix/pull/5246))
- Support decorators in files using CSS side-effect imports ([#5305](https://github.com/remix-run/remix/pull/5305))
- We made several Flat route fixes and enhancements. See the [release notes for v1.13.0](https://github.com/remix-run/remix/releases/tag/remix%401.13.0) for more information. ([#5228](https://github.com/remix-run/remix/pull/5228))
- Updated dependencies:
  - `@remix-run/server-runtime@1.13.0`

## 1.12.0

### Minor Changes

- Added a new development server available in the Remix config under the `unstable_dev` flag. [See the release notes](https://github.com/remix-run/remix/releases/tag/remix%401.12.0) for a full description. ([#5133](https://github.com/remix-run/remix/pull/5133))

### Patch Changes

- Fixed issues with `v2_routeConvention` on Windows so that new and renamed files are properly included ([#5266](https://github.com/remix-run/remix/pull/5266))
- Server build should not be removed in `remix watch` and `remix dev` ([#5228](https://github.com/remix-run/remix/pull/5228))
- The dev server will now clean up build directories whenever a rebuild starts ([#5223](https://github.com/remix-run/remix/pull/5223))
- Updated dependencies:
  - `@remix-run/server-runtime@1.12.0`

## 1.11.1

### Patch Changes

- Fixed a bug with `v2_routeConvention` that prevented `index` modules from being recognized for route paths ([`195291a3d`](https://github.com/remix-run/remix/commit/195291a3d8c0e098931199bcc26277a45cee0eb9))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.1`

## 1.11.0

### Minor Changes

- Specify file loader for `.fbx`, `.glb`, `.gltf`, `.hdr`, and `.mov` files ([#5030](https://github.com/remix-run/remix/pull/5030))
- Added support for [Vanilla Extract](https://vanilla-extract.style) via the `unstable_vanillaExtract` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#5040](https://github.com/remix-run/remix/pull/5040))
- Add support for CSS side-effect imports via the `unstable_cssSideEffectImports` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4919](https://github.com/remix-run/remix/pull/4919))
- Add support for CSS Modules via the `unstable_cssModules` future flag. **IMPORTANT:** Features marked with `unstable` are … unstable. While we're confident in the use cases they solve, the API and implementation may change without a major version bump. ([#4852](https://github.com/remix-run/remix/pull/4852))

### Patch Changes

- Add new "flat" routing conventions. This convention will be the default in v2 but is available now under the `v2_routeConvention` future flag. ([#4880](https://github.com/remix-run/remix/pull/4880))
- Added support for `handle` in MDX frontmatter ([#4865](https://github.com/remix-run/remix/pull/4865))
- Updated dependencies:
  - `@remix-run/server-runtime@1.11.0`

## 1.10.1

### Patch Changes

- Update babel config to transpile down to node 14 ([#5047](https://github.com/remix-run/remix/pull/5047))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.1`

## 1.10.0

### Patch Changes

- Fixed several issues with TypeScript to JavaScript conversion when running `create-remix` ([#4891](https://github.com/remix-run/remix/pull/4891))
- Resolve asset entry full path to support monorepo import of styles ([#4855](https://github.com/remix-run/remix/pull/4855))
- Updated dependencies:
  - `@remix-run/server-runtime@1.10.0`

## 1.9.0

### Minor Changes

- Allow defining multiple routes for the same route module file ([#3970](https://github.com/remix-run/remix/pull/3970))
- Added support and conventions for optional route segments ([#4706](https://github.com/remix-run/remix/pull/4706))

### Patch Changes

- The Remix compiler now supports new Typescript 4.9 syntax (like the `satisfies` keyword) ([#4754](https://github.com/remix-run/remix/pull/4754))
- Optimize `parentRouteId` lookup in `defineConventionalRoutes`. ([#4800](https://github.com/remix-run/remix/pull/4800))
- Fixed a bug in `.ts` -> `.js` conversion on Windows by using a relative unix-style path ([#4718](https://github.com/remix-run/remix/pull/4718))
- Updated dependencies:
  - `@remix-run/server-runtime@1.9.0`

## 1.8.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.8.2`
  - `@remix-run/serve@1.8.2`

## 1.8.1

### Patch Changes

- Added a missing type definition for the Remix config `future` option to the `@remix-run/dev/server-build` virtual module ([#4771](https://github.com/remix-run/remix/pull/4771))
- Updated dependencies:
  - `@remix-run/serve@1.8.1`
  - `@remix-run/server-runtime@1.8.1`

## 1.8.0

### Minor Changes

- Added support for a new route `meta` API to handle arrays of tags instead of an object. For details, check out the [RFC](https://github.com/remix-run/remix/discussions/4462). ([#4610](https://github.com/remix-run/remix/pull/4610))

### Patch Changes

- Importing functions and types from the `remix` package is deprecated, and all exported modules will be removed in the next major release. For more details,[see the release notes for 1.4.0](https://github.com/remix-run/remix/releases/tag/v1.4.0) where these changes were first announced. ([#4661](https://github.com/remix-run/remix/pull/4661))
- Updated dependencies:
  - `@remix-run/server-runtime@1.8.0`
  - `@remix-run/serve@1.8.0`

## 1.7.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6`
  - `@remix-run/server-runtime@1.7.6`

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.6-pre.0`
  - `@remix-run/server-runtime@1.7.6-pre.0`

## 1.7.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/serve@1.7.5`
  - `@remix-run/server-runtime@1.7.5`

## 1.7.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/server-runtime@1.7.4`
  - `@remix-run/serve@1.7.4`

## 1.7.3

### Patch Changes

- Update `create-remix` to use the new examples repository when using `--template example/<name>` ([#4208](https://github.com/remix-run/remix/pull/4208))
- Add support for setting `moduleResolution` to `node`, `node16` or `nodenext` in `tsconfig.json`. ([#4034](https://github.com/remix-run/remix/pull/4034))
- Add resources imported only by resource routes to `assetsBuildDirectory` ([#3841](https://github.com/remix-run/remix/pull/3841))
- Ensure that any assets referenced in CSS files are hashed and copied to the `assetsBuildDirectory`. ([#4130](https://github.com/remix-run/remix/pull/4130))
- Updated dependencies:
  - `@remix-run/serve@1.7.3`
  - `@remix-run/server-runtime@1.7.3`

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
