# `@remix-run/testing`

## 2.9.0-pre.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.9.0-pre.5`
  - `@remix-run/node@2.9.0-pre.5`

## 2.9.0-pre.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.9.0-pre.4`
  - `@remix-run/react@2.9.0-pre.4`

## 2.9.0-pre.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.9.0-pre.3`
  - `@remix-run/react@2.9.0-pre.3`

## 2.9.0-pre.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.9.0-pre.2`
  - `@remix-run/react@2.9.0-pre.2`

## 2.9.0-pre.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.9.0-pre.1`
  - `@remix-run/node@2.9.0-pre.1`

## 2.9.0-pre.0

### Minor Changes

- New `future.unstable_singleFetch` flag ([#8773](https://github.com/remix-run/remix/pull/8773))

  - Naked objects returned from loaders/actions are no longer automatically converted to JSON responses. They'll be streamed as-is via `turbo-stream` so `Date`'s will become `Date` through `useLoaderData()`
  - You can return naked objects with `Promise`'s without needing to use `defer()` - including nested `Promise`'s
    - If you need to return a custom status code or custom response headers, you can still use the `defer` utility
  - `<RemixServer abortDelay>` is no longer used. Instead, you should `export const streamTimeout` from `entry.server.tsx` and the remix server runtime will use that as the delay to abort the streamed response
    - If you export your own streamTimeout, you should decouple that from aborting the react `renderToPipeableStream`. You should always ensure that react is aborted _afer_ the stream is aborted so that abort rejections can be flushed down
  - Actions no longer automatically revalidate on 4xx/5xx responses (via RR `future.unstable_skipActionErrorRevalidation` flag) - you can return a 2xx to opt-into revalidation or use `shouldRevalidate`

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.9.0-pre.0`
  - `@remix-run/react@2.9.0-pre.0`

## 2.8.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.8.1`
  - `@remix-run/node@2.8.1`

## 2.8.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.8.0`
  - `@remix-run/node@2.8.0`

## 2.7.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.7.2`
  - `@remix-run/react@2.7.2`

## 2.7.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.7.1`
  - `@remix-run/react@2.7.1`

## 2.7.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.7.0`
  - `@remix-run/node@2.7.0`

## 2.6.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.6.0`
  - `@remix-run/node@2.6.0`

## 2.5.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.5.1`
  - `@remix-run/node@2.5.1`

## 2.5.0

### Minor Changes

- Add unstable support for "SPA Mode" ([#8457](https://github.com/remix-run/remix/pull/8457))

  You can opt into SPA Mode by setting `unstable_ssr: false` in your Remix Vite plugin config:

  ```js
  // vite.config.ts
  import { unstable_vitePlugin as remix } from "@remix-run/dev";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [remix({ unstable_ssr: false })],
  });
  ```

  Development in SPA Mode is just like a normal Remix app, and still uses the Remix dev server for HMR/HDR:

  ```sh
  remix vite:dev
  ```

  Building in SPA Mode will generate an `index.html` file in your client assets directory:

  ```sh
  remix vite:build
  ```

  To run your SPA, you serve your client assets directory via an HTTP server:

  ```sh
  npx http-server build/client
  ```

  For more information, please refer to the [SPA Mode docs](https://remix.run/future/spa-mode).

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.5.0`
  - `@remix-run/node@2.5.0`

## 2.4.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.4.1`
  - `@remix-run/node@2.4.1`

## 2.4.0

### Minor Changes

- Add support for `clientLoader`/`clientAction`/`HydrateFallback` route exports ([RFC](https://github.com/remix-run/remix/discussions/7634)). ([#8173](https://github.com/remix-run/remix/pull/8173))
- Add a new `future.v3_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. For more information, please see the React Router [`6.21.0` Release Notes](https://github.com/remix-run/react-router/blob/release-next/CHANGELOG.md#futurev7_relativesplatpath) and the [`useResolvedPath` docs](https://remix.run/hooks/use-resolved-path#splat-paths). ([#8216](https://github.com/remix-run/remix/pull/8216))

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.4.0`
  - `@remix-run/node@2.4.0`

## 2.3.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.3.1`
  - `@remix-run/node@2.3.1`

## 2.3.0

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.3.0`
  - `@remix-run/node@2.3.0`

## 2.2.0

### Minor Changes

- Unstable Vite support for Node-based Remix apps ([#7590](https://github.com/remix-run/remix/pull/7590))
  - `remix build` 👉 `vite build && vite build --ssr`
  - `remix dev` 👉 `vite dev`
  - Other runtimes (e.g. Deno, Cloudflare) not yet supported.
  - See "Future > Vite" in the Remix Docs for details

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.2.0`
  - `@remix-run/node@2.2.0`

## 2.1.0

### Minor Changes

- Remove the `unstable_` prefix from `createRemixStub` - after real-world experience, we're confident in the API and ready to commit to it ([#7647](https://github.com/remix-run/remix/pull/7647))
  - **Note**: This involves 1 small breaking change. The `<RemixStub remixConfigFuture>` prop has been renamed to `<RemixStub future>`

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.1.0`
  - `@remix-run/node@2.1.0`

## 2.0.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.0.1`
  - `@remix-run/node@2.0.1`

## 2.0.0

### Major Changes

- Drop React 17 support ([#7121](https://github.com/remix-run/remix/pull/7121))
- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- Remove `v2_normalizeFormMethod` future flag - all `formMethod` values will be normalized in v2 ([#6875](https://github.com/remix-run/remix/pull/6875))
- Remove `v2_routeConvention` flag - the flat route file convention is now standard ([#6969](https://github.com/remix-run/remix/pull/6969))
- Remove `v2_headers` flag - it is now the default behavior to use the deepest `headers` function in the route tree ([#6979](https://github.com/remix-run/remix/pull/6979))
- Remove `v2_errorBoundary` flag and `CatchBoundary` implementation ([#6906](https://github.com/remix-run/remix/pull/6906))
- The route `meta` API now defaults to the new "V2 Meta" API ([#6958](https://github.com/remix-run/remix/pull/6958))
  - Please refer to the ([docs](https://remix.run/docs/en/2.0.0/route/meta) and [Preparing for V2](https://remix.run/docs/en/2.0.0/start/v2#route-meta) guide for more information.
- Promote the `future.v2_dev` flag in `remix.config.js` to a root level `dev` config ([#7002](https://github.com/remix-run/remix/pull/7002))
- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

### Minor Changes

- `unstable_createRemixStub` now supports adding `meta`/`links` functions on stubbed Remix routes ([#7186](https://github.com/remix-run/remix/pull/7186))
  - ⚠️ `unstable_createRemixStub` no longer supports the `element`/`errorElement` properties on routes. You must use `Component`/`ErrorBoundary` to match what you would export from a Remix route module.
- Update Remix to use React Router `route.lazy` for module loading ([#7133](https://github.com/remix-run/remix/pull/7133))

### Patch Changes

- Fix types for `StubRouteObject` `children` property ([#7098](https://github.com/remix-run/remix/pull/7098))
- Updated dependencies:
  - `@remix-run/react@2.0.0`
  - `@remix-run/node@2.0.0`
  - [`react-router-dom@6.16.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.16.0)
  - [`@remix-run/router@1.9.0`](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#190)

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
