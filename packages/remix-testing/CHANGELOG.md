# `@remix-run/testing`

## 2.0.0-pre.10

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.10`
  - `@remix-run/react@2.0.0-pre.10`

## 2.0.0-pre.9

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.0.0-pre.9`
  - `@remix-run/node@2.0.0-pre.9`

## 2.0.0-pre.8

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.8`
  - `@remix-run/react@2.0.0-pre.8`

## 2.0.0-pre.7

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.7`
  - `@remix-run/react@2.0.0-pre.7`

## 2.0.0-pre.6

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.6`
  - `@remix-run/react@2.0.0-pre.6`

## 2.0.0-pre.5

### Patch Changes

- Updated dependencies:
  - `@remix-run/react@2.0.0-pre.5`
  - `@remix-run/node@2.0.0-pre.5`

## 2.0.0-pre.4

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.4`
  - `@remix-run/react@2.0.0-pre.4`

## 2.0.0-pre.3

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.3`
  - `@remix-run/react@2.0.0-pre.3`

## 2.0.0-pre.2

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.2`
  - `@remix-run/react@2.0.0-pre.2`

## 2.0.0-pre.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/node@2.0.0-pre.1`
  - `@remix-run/react@2.0.0-pre.1`

## 2.0.0-pre.0

### Major Changes

- Drop React 17 support ([#7121](https://github.com/remix-run/remix/pull/7121))
- Require Node >=18.0.0 ([#6939](https://github.com/remix-run/remix/pull/6939))
- We have made a few important changes to the route `meta` API as reflected in the v1 implementation when using the `future.v2_meta` config option. ([#6958](https://github.com/remix-run/remix/pull/6958))

  - The `meta` function should no longer return an object, but an array of objects that map to the HTML tag's respective attributes. This provides more flexibility and control over how certain tags are rendered, and the order in which they appear.
  - In most cases, `meta` descriptor objects render a `<meta>` tag. There are a few notable exceptions:
    - `{ title: "My app" }` will render `<title>My app</title>`.
    - `{ 'script:ld+json': { /* ... */ } }` will render `<script type="application/ld+json">/* ... */</script>`, where the value is serialized to JSON and rendered inside the `<script>` tag.
    - `{ tagName: 'link', ...attributes }` will render `<link {...attributes} />`
      - This is useful for things like setting canonical URLs. For loading assets, we encourage you to use the `links` export instead.
      - It's important to note that `tagName` may only accept `meta` or `link`, so other arbitrary elements will be ignored.
  - `<Meta />` will no longer render the `meta` output from the entire route hierarchy. Only the output from the leaf (current) route will be rendered unless that route does not export a `meta` function, in which case the output from the nearest ancestor route with `meta` will be rendered.
    - This change comes from user feedback that auto-merging meta made effective SEO difficult to implement. Our goal is to give you as much control as you need over meta tags for each individual route.
    - Our suggested approach is to **only export a `meta` function from leaf route modules**. However, if you do want to render a tag from another matched route, `meta` now accepts a `matches` argument for you to merge or override parent route meta as you'd like.
    ```tsx
    export function meta({ matches }) {
      return [
        // render all ancestor route meta except for title tags
        ...matches
          .flatMap((match) => match.meta)
          .filter((match) => !("title" in match)),
        { title: "Override the title!" },
      ];
    }
    ```
  - The `parentsData` argument has been removed. If you need to access data from a parent route, you can use `matches` instead.
    ```tsx
    // before
    export function meta({ parentsData }) {
      return [{ title: parentsData["routes/some-route"].title }];
    }
    // after
    export function meta({ matches }) {
      return [
        {
          title: matches.find((match) => match.id === "routes/some-route").data
            .title,
        },
      ];
    }
    ```

- promote config.future.v2_dev to config.dev ([#7002](https://github.com/remix-run/remix/pull/7002))
- Remove `v2_errorBoundary` flag and `CatchBoundary` implementation ([#6906](https://github.com/remix-run/remix/pull/6906))
- Removed support for "magic exports" from the `remix` package. This package can be removed from your `package.json` and you should update all imports to use the source `@remix-run/*` packages: ([#6895](https://github.com/remix-run/remix/pull/6895))

  ```diff
  - import type { ActionArgs } from "remix";
  - import { json, useLoaderData } from "remix";
  + import type { ActionArgs } from "@remix-run/node";
  + import { json } from "@remix-run/node";
  + import { useLoaderData } from "@remix-run/react";
  ```

- Remove `v2_normalizeFormMethod` future flag - all `formMethod` values will be normalized in v2 ([#6875](https://github.com/remix-run/remix/pull/6875))
- Remove `v2_routeConvention` flag. The flat route file convention is now standard. ([#6969](https://github.com/remix-run/remix/pull/6969))
- Remove `v2_headers` flag. It is now the default behavior to use the deepest `headers` function in the route tree. ([#6979](https://github.com/remix-run/remix/pull/6979))

### Minor Changes

- - `unstable_createRemixStub` now supports adding `meta`/`links` functions on stubbed Remix routes ([#7186](https://github.com/remix-run/remix/pull/7186))
  - ⚠️ `unstable_createRemixStub` no longer supports the `element`/`errorElement` properties on routes. You must use `Component`/`ErrorBoundary` to match what you would export from a Remix route module.
- Update Remix to use React Router `route.lazy` for module loading ([#7133](https://github.com/remix-run/remix/pull/7133))

### Patch Changes

- Fix types for `StubRouteObject` `children` property ([#7098](https://github.com/remix-run/remix/pull/7098))
- Bump router to 1.9.0/6.16.0 prereleases ([#7283](https://github.com/remix-run/remix/pull/7283))
- Updated dependencies:
  - `@remix-run/react@2.0.0-pre.0`
  - `@remix-run/node@2.0.0-pre.0`

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
