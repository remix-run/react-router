<!-- markdownlint-disable no-duplicate-header no-emphasis-as-heading no-inline-html -->

# React Router Releases

This page lists all releases/release notes for React Router back to `v6.0.0`. For releases prior to v6, please refer to the [Github Releases Page](https://github.com/remix-run/react-router/releases).

We manage release notes in this file instead of the paginated Github Releases Page for 2 reasons:

- Pagination in the Github UI means that you cannot easily search release notes for a large span of releases at once
- The paginated Github interface also cuts off longer releases notes without indication in list view, and you need to click into the detail view to see the full set of release notes

<details>
  <summary>Table of Contents</summary>

- [React Router Releases](#react-router-releases)
  - [v7.2.0](#v720)
    - [What's Changed](#whats-changed)
      - [Type-safe `href` utility](#type-safe-href-utility)
      - [Prerendering with a SPA Fallback](#prerendering-with-a-spa-fallback)
      - [Allow a root `loader` in SPA Mode](#allow-a-root-loader-in-spa-mode)
    - [Minor Changes](#minor-changes)
    - [Patch Changes](#patch-changes)
    - [Unstable Changes](#unstable-changes)
    - [Changes by Package](#changes-by-package)
  - [v7.1.5](#v715)
    - [Patch Changes](#patch-changes-1)
  - [v7.1.4](#v714)
    - [Patch Changes](#patch-changes-2)
  - [v7.1.3](#v713)
    - [Patch Changes](#patch-changes-3)
  - [v7.1.2](#v712)
    - [Patch Changes](#patch-changes-4)
  - [v7.1.1](#v711)
    - [Patch Changes](#patch-changes-5)
  - [v7.1.0](#v710)
    - [Minor Changes](#minor-changes-1)
    - [Patch Changes](#patch-changes-6)
    - [Changes by Package](#changes-by-package-1)
  - [v7.0.2](#v702)
    - [Patch Changes](#patch-changes-7)
  - [v7.0.1](#v701)
    - [Patch Changes](#patch-changes-8)
  - [v7.0.0](#v700)
    - [Breaking Changes](#breaking-changes)
      - [Package Restructuring](#package-restructuring)
      - [Removed Adapter Re-exports](#removed-adapter-re-exports)
      - [Removed APIs](#removed-apis)
      - [Minimum Versions](#minimum-versions)
      - [Adopted Future Flag Behaviors](#adopted-future-flag-behaviors)
      - [Vite Compiler](#vite-compiler)
      - [Exposed Router Promises](#exposed-router-promises)
    - [Other Notable Changes](#other-notable-changes)
      - [`routes.ts`](#routests)
      - [Typesafety improvements](#typesafety-improvements)
      - [Prerendering](#prerendering)
    - [Major Changes (`react-router`)](#major-changes-react-router)
    - [Major Changes (`@react-router/*`)](#major-changes-react-router-1)
    - [Minor Changes](#minor-changes-2)
    - [Patch Changes](#patch-changes-9)
    - [Changes by Package](#changes-by-package-2)
- [React Router v6 Releases](#react-router-v6-releases)
  - [v6.30.0](#v6300)
    - [Minor Changes](#minor-changes-3)
    - [Patch Changes](#patch-changes-10)
  - [v6.29.0](#v6290)
    - [Minor Changes](#minor-changes-4)
    - [Patch Changes](#patch-changes-11)
  - [v6.28.2](#v6282)
    - [Patch Changes](#patch-changes-12)
  - [v6.28.1](#v6281)
    - [Patch Changes](#patch-changes-13)
  - [v6.28.0](#v6280)
    - [What's Changed](#whats-changed-1)
    - [Minor Changes](#minor-changes-5)
    - [Patch Changes](#patch-changes-14)
  - [v6.27.0](#v6270)
    - [What's Changed](#whats-changed-2)
      - [Stabilized APIs](#stabilized-apis)
    - [Minor Changes](#minor-changes-6)
    - [Patch Changes](#patch-changes-15)
  - [v6.26.2](#v6262)
    - [Patch Changes](#patch-changes-16)
  - [v6.26.1](#v6261)
    - [Patch Changes](#patch-changes-17)
  - [v6.26.0](#v6260)
    - [Minor Changes](#minor-changes-7)
    - [Patch Changes](#patch-changes-18)
  - [v6.25.1](#v6251)
    - [Patch Changes](#patch-changes-19)
  - [v6.25.0](#v6250)
    - [What's Changed](#whats-changed-3)
      - [Stabilized `v7_skipActionErrorRevalidation`](#stabilized-v7_skipactionerrorrevalidation)
    - [Minor Changes](#minor-changes-8)
    - [Patch Changes](#patch-changes-20)
  - [v6.24.1](#v6241)
    - [Patch Changes](#patch-changes-21)
  - [v6.24.0](#v6240)
    - [What's Changed](#whats-changed-4)
      - [Lazy Route Discovery (a.k.a. "Fog of War")](#lazy-route-discovery-aka-fog-of-war)
    - [Minor Changes](#minor-changes-9)
    - [Patch Changes](#patch-changes-22)
  - [v6.23.1](#v6231)
    - [Patch Changes](#patch-changes-23)
  - [v6.23.0](#v6230)
    - [What's Changed](#whats-changed-5)
      - [Data Strategy (unstable)](#data-strategy-unstable)
      - [Skip Action Error Revalidation (unstable)](#skip-action-error-revalidation-unstable)
    - [Minor Changes](#minor-changes-10)
  - [v6.22.3](#v6223)
    - [Patch Changes](#patch-changes-24)
  - [v6.22.2](#v6222)
    - [Patch Changes](#patch-changes-25)
  - [v6.22.1](#v6221)
    - [Patch Changes](#patch-changes-26)
  - [v6.22.0](#v6220)
    - [What's Changed](#whats-changed-6)
      - [Core Web Vitals Technology Report Flag](#core-web-vitals-technology-report-flag)
    - [Minor Changes](#minor-changes-11)
    - [Patch Changes](#patch-changes-27)
  - [v6.21.3](#v6213)
    - [Patch Changes](#patch-changes-28)
  - [v6.21.2](#v6212)
    - [Patch Changes](#patch-changes-29)
  - [v6.21.1](#v6211)
    - [Patch Changes](#patch-changes-30)
  - [v6.21.0](#v6210)
    - [What's Changed](#whats-changed-7)
      - [`future.v7_relativeSplatPath`](#futurev7_relativesplatpath)
      - [Partial Hydration](#partial-hydration)
    - [Minor Changes](#minor-changes-12)
    - [Patch Changes](#patch-changes-31)
  - [v6.20.1](#v6201)
    - [Patch Changes](#patch-changes-32)
  - [v6.20.0](#v6200)
    - [Minor Changes](#minor-changes-13)
    - [Patch Changes](#patch-changes-33)
  - [v6.19.0](#v6190)
    - [What's Changed](#whats-changed-8)
      - [`unstable_flushSync` API](#unstable_flushsync-api)
    - [Minor Changes](#minor-changes-14)
    - [Patch Changes](#patch-changes-34)
  - [v6.18.0](#v6180)
    - [What's Changed](#whats-changed-9)
      - [New Fetcher APIs](#new-fetcher-apis)
      - [Persistence Future Flag (`future.v7_fetcherPersist`)](#persistence-future-flag-futurev7_fetcherpersist)
    - [Minor Changes](#minor-changes-15)
    - [Patch Changes](#patch-changes-35)
  - [v6.17.0](#v6170)
    - [What's Changed](#whats-changed-10)
      - [View Transitions 🚀](#view-transitions-)
    - [Minor Changes](#minor-changes-16)
    - [Patch Changes](#patch-changes-36)
  - [v6.16.0](#v6160)
    - [Minor Changes](#minor-changes-17)
    - [Patch Changes](#patch-changes-37)
  - [v6.15.0](#v6150)
    - [Minor Changes](#minor-changes-18)
    - [Patch Changes](#patch-changes-38)
  - [v6.14.2](#v6142)
    - [Patch Changes](#patch-changes-39)
  - [v6.14.1](#v6141)
    - [Patch Changes](#patch-changes-40)
  - [v6.14.0](#v6140)
    - [What's Changed](#whats-changed-11)
      - [JSON/Text Submissions](#jsontext-submissions)
    - [Minor Changes](#minor-changes-19)
    - [Patch Changes](#patch-changes-41)
  - [v6.13.0](#v6130)
    - [What's Changed](#whats-changed-12)
      - [`future.v7_startTransition`](#futurev7_starttransition)
    - [Minor Changes](#minor-changes-20)
    - [Patch Changes](#patch-changes-42)
  - [v6.12.1](#v6121)
    - [Patch Changes](#patch-changes-43)
  - [v6.12.0](#v6120)
    - [What's Changed](#whats-changed-13)
      - [`React.startTransition` support](#reactstarttransition-support)
    - [Minor Changes](#minor-changes-21)
    - [Patch Changes](#patch-changes-44)
  - [v6.11.2](#v6112)
    - [Patch Changes](#patch-changes-45)
  - [v6.11.1](#v6111)
    - [Patch Changes](#patch-changes-46)
  - [v6.11.0](#v6110)
    - [Minor Changes](#minor-changes-22)
    - [Patch Changes](#patch-changes-47)
  - [v6.10.0](#v6100)
    - [What's Changed](#whats-changed-14)
    - [Minor Changes](#minor-changes-23)
      - [`future.v7_normalizeFormMethod`](#futurev7_normalizeformmethod)
    - [Patch Changes](#patch-changes-48)
  - [v6.9.0](#v690)
    - [What's Changed](#whats-changed-15)
      - [`Component`/`ErrorBoundary` route properties](#componenterrorboundary-route-properties)
      - [Introducing Lazy Route Modules](#introducing-lazy-route-modules)
    - [Minor Changes](#minor-changes-24)
    - [Patch Changes](#patch-changes-49)
  - [v6.8.2](#v682)
    - [Patch Changes](#patch-changes-50)
  - [v6.8.1](#v681)
    - [Patch Changes](#patch-changes-51)
  - [v6.8.0](#v680)
    - [Minor Changes](#minor-changes-25)
    - [Patch Changes](#patch-changes-52)
  - [v6.7.0](#v670)
    - [Minor Changes](#minor-changes-26)
    - [Patch Changes](#patch-changes-53)
  - [v6.6.2](#v662)
    - [Patch Changes](#patch-changes-54)
  - [v6.6.1](#v661)
    - [Patch Changes](#patch-changes-55)
  - [v6.6.0](#v660)
    - [What's Changed](#whats-changed-16)
    - [Minor Changes](#minor-changes-27)
    - [Patch Changes](#patch-changes-56)
  - [v6.5.0](#v650)
    - [What's Changed](#whats-changed-17)
    - [Minor Changes](#minor-changes-28)
    - [Patch Changes](#patch-changes-57)
  - [v6.4.5](#v645)
    - [Patch Changes](#patch-changes-58)
  - [v6.4.4](#v644)
    - [Patch Changes](#patch-changes-59)
  - [v6.4.3](#v643)
    - [Patch Changes](#patch-changes-60)
  - [v6.4.2](#v642)
    - [Patch Changes](#patch-changes-61)
  - [v6.4.1](#v641)
    - [Patch Changes](#patch-changes-62)
  - [v6.4.0](#v640)
    - [What's Changed](#whats-changed-18)
      - [Remix Data APIs](#remix-data-apis)
    - [Patch Changes](#patch-changes-63)
  - [v6.3.0](#v630)
    - [Minor Changes](#minor-changes-29)
  - [v6.2.2](#v622)
    - [Patch Changes](#patch-changes-64)
  - [v6.2.1](#v621)
    - [Patch Changes](#patch-changes-65)
  - [v6.2.0](#v620)
    - [Minor Changes](#minor-changes-30)
    - [Patch Changes](#patch-changes-66)
  - [v6.1.1](#v611)
    - [Patch Changes](#patch-changes-67)
  - [v6.1.0](#v610)
    - [Minor Changes](#minor-changes-31)
    - [Patch Changes](#patch-changes-68)
  - [v6.0.2](#v602)
    - [Patch Changes](#patch-changes-69)
  - [v6.0.1](#v601)
    - [Patch Changes](#patch-changes-70)
  - [v6.0.0](#v600)

</details>

<!-- To add a new release, copy from this template:

## v7.X.Y

Date: YYYY-MM-DD

### What's Changed

#### Big New Feature 1

#### Big New Feature 2

### Minor Changes

### Patch Changes

### Unstable Changes

⚠️  _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_


### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/create-react-router/CHANGELOG.md#7XY)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router/CHANGELOG.md#7XY)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-architect/CHANGELOG.md#7XY)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-cloudflare/CHANGELOG.md#7XY)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-dev/CHANGELOG.md#7XY)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-express/CHANGELOG.md#7XY)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-fs-routes/CHANGELOG.md#7XY)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-node/CHANGELOG.md#7XY)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#7XY)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.X.Y/packages/react-router-serve/CHANGELOG.md#7XY)

**Full Changelog**: [`v7.X.Y...v7.X.Y`](https://github.com/remix-run/react-router/compare/react-router@7.X.Y...react-router@7.X.Y)
-->

## v7.2.0

Date: 2025-02-18

### What's Changed

#### Type-safe `href` utility

In framework mode, we now provide you with a fully type-safe `href` utility to give you all the warm and fuzzy feelings of path auto-completion and param validation for links in your application:

```tsx
import { href } from "react-router";

export default function Component() {
  const link = href("/blog/:slug", { slug: "my-first-post" });
  //                ^ type-safe!     ^ Also type-safe!

  return (
    <main>
      <Link to={href("/products/:id", { id: "asdf" })} />
      <NavLink to={href("/:lang?/about", { lang: "en" })} />
    </main>
  );
}
```

You'll now get type errors if you pass a bad path value or a bad param value:

```ts
const badPath = href("/not/a/valid/path");
//                   ^ Error!

const badParam = href("/blog/:slug", { oops: "bad param" });
//                                     ^ Error!
```

#### Prerendering with a SPA Fallback

This release enhances the ability to use a combination of pre-rendered paths alongside other paths that operate in "SPA Mode" when pre-rendering with `ssr:false`.

- If you specify `ssr:false` without a `prerender` config, this is considered "SPA Mode" and the generated `index.html` file will only render down to the root route and will be able to hydrate for any valid application path
- If you specify `ssr:false` with a `prerender` config but _do not_ include the `/` path (i.e., `prerender: ['/blog/post']`), then we still generate a "SPA Mode" `index.html` file that can hydrate for any path in the application
- If you specify `ssr:false` and include the `/` path in your `prerender` config, the generated `index.html` file will be specific to the root index route, so we will now also generate a separate "SPA Mode" file in `__spa-fallback.html` that you can serve/hydrate for non-prerendered paths

For more info, see the [Pre-rendering](https://reactrouter.com/dev/how-to/pre-rendering#pre-rendering-with-a-spa-fallback) docs for more info.

#### Allow a root `loader` in SPA Mode

SPA Mode used to prohibit the use of loaders in all routes so that we could hydrate for any path in the application. However, because the root route is always rendered at build time, we can lift this restriction for the root route.

In order to use your build-time loader data during pre-rendering, we now also expose the `loaderData` as an optional prop for the `HydrateFallback` component on routes:

- This will be defined so long as the `HydrateFallback` is rendering because _children_ routes are loading
- This will be `undefined` if the `HydrateFallback` is rendering because the route itself has it's own hydrating `clientLoader`
  - In SPA mode, this will allow you to render loader root data into the SPA Mode HTML file

### Minor Changes

- `react-router` - New type-safe `href` utility that guarantees links point to actual paths in your app ([#13012](https://github.com/remix-run/react-router/pull/13012))
- `@react-router/dev` - Generate a "SPA fallback" HTML file when pre-rendering the `/` route with `ssr:false` ([#12948](https://github.com/remix-run/react-router/pull/12948))
- `@react-router/dev` - Allow a `loader` in the root route in SPA mode because it can be called/server-rendered at build time ([#12948](https://github.com/remix-run/react-router/pull/12948))
  - `Route.HydrateFallbackProps` now also receives `loaderData`

### Patch Changes

- `react-router` - Disable Lazy Route Discovery for all `ssr:false` apps and not just "SPA Mode" because there is no runtime server to serve the search-param-configured `__manifest` requests ([#12894](https://github.com/remix-run/react-router/pull/12894))
  - We previously only disabled this for "SPA Mode" but we realized it should apply to all `ssr:false` apps
  - In those `prerender` scenarios we would pre-render the `/__manifest` file but that makes some unnecessary assumptions about the static file server behaviors
- `react-router` - Don't apply Single Fetch revalidation de-optimization when in SPA mode since there is no server HTTP request ([#12948](https://github.com/remix-run/react-router/pull/12948))
- `react-router` - Properly handle revalidations to across a pre-render/SPA boundary ([#13021](https://github.com/remix-run/react-router/pull/13021))
  - In "hybrid" applications where some routes are pre-rendered and some are served from a SPA fallback, we need to avoid making `.data` requests if the path wasn't pre-rendered because the request will 404
  - We don't know all the pre-rendered paths client-side, however:
    - All `loader` data in `ssr:false` mode is static because it's generated at build time
    - A route must use a `clientLoader` to do anything dynamic
    - Therefore, if a route only has a `loader` and not a `clientLoader`, we disable revalidation by default because there is no new data to retrieve
    - We short circuit and skip single fetch `.data` request logic if there are no server loaders with `shouldLoad=true` in our single fetch `dataStrategy`
    - This ensures that the route doesn't cause a `.data` request that would 404 after a submission
- `react-router` - Align dev server behavior with static file server behavior when `ssr:false` is set ([#12948](https://github.com/remix-run/react-router/pull/12948))
  - When no `prerender` config exists, only SSR down to the root `HydrateFallback` (SPA Mode)
  - When a `prerender` config exists but the current path is not pre-rendered, only SSR down to the root `HydrateFallback` (SPA Fallback)
  - Return a 404 on `.data` requests to non-pre-rendered paths
- `react-router` - Improve prefetch performance of CSS side effects in framework mode ([#12889](https://github.com/remix-run/react-router/pull/12889))
- `react-router` - Properly handle interrupted manifest requests in lazy route discovery ([#12915](https://github.com/remix-run/react-router/pull/12915))
- `@react-router/dev` - Handle custom `envDir` in Vite config ([#12969](https://github.com/remix-run/react-router/pull/12969))
- `@react-router/dev` - Fix CLI parsing to allow argument-less `npx react-router` usage ([#12925](https://github.com/remix-run/react-router/pull/12925))
- `@react-router/dev` - Skip action-only resource routes when using `prerender:true` ([#13004](https://github.com/remix-run/react-router/pull/13004))
- `@react-router/dev` - Enhance invalid export detection when using `ssr:false` ([#12948](https://github.com/remix-run/react-router/pull/12948))
  - `headers`/`action` functions are prohibited in all routes with `ssr:false` because there will be no runtime server on which to run them
  - `loader` functions are more nuanced and depend on whether a given route is prerendered
    - When using `ssr:false` without a `prerender` config, only the `root` route can have a `loader`
    - When using `ssr:false` with a `prerender` config, only routes matched by a `prerender` path can have a `loader`
- `@react-router/dev` - Error at build time in `ssr:false` + `prerender` apps for the edge case scenario of: ([#13021](https://github.com/remix-run/react-router/pull/13021))
  - A parent route has only a `loader` (does not have a `clientLoader`)
  - The parent route is pre-rendered
  - The parent route has children routes which are not prerendered
  - This means that when the child paths are loaded via the SPA fallback, the parent won't have any `loaderData` because there is no server on which to run the `loader`
  - This can be resolved by either adding a parent `clientLoader` or pre-rendering the child paths
  - If you add a `clientLoader`, calling the `serverLoader()` on non-prerendered paths will throw a 404
- `@react-router/dev` - Limit prerendered resource route `.data` files to only the target route ([#13004](https://github.com/remix-run/react-router/pull/13004))
- `@react-router/dev` - Fix pre-rendering of binary files ([#13039](https://github.com/remix-run/react-router/pull/13039))
- `@react-router/dev` - Fix typegen for repeated params ([#13012](https://github.com/remix-run/react-router/pull/13012))
  - In React Router, path parameters are keyed by their name, so for a path pattern like `/a/:id/b/:id?/c/:id`, the last `:id` will set the value for `id` in `useParams` and the `params` prop
    - For example, `/a/1/b/2/c/3` will result in the value `{ id: 3 }` at runtime
  - Previously, generated types for params incorrectly modeled repeated params with an array
    - For example, `/a/1/b/2/c/3` generated a type like `{ id: [1,2,3] }`.
  - To be consistent with runtime behavior, the generated types now correctly model the "last one wins" semantics of path parameters.
    - For example, `/a/1/b/2/c/3` now generates a type like `{ id: 3 }`.
- `@react-router/dev` - Fix path to load `package.json` for `react-router --version` ([#13012](https://github.com/remix-run/react-router/pull/13012))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add `unstable_SerializesTo` brand type for library authors to register types serializable by React Router's streaming format (`turbo-stream`) ([#12264](https://github.com/remix-run/react-router/pull/12264))
- `@react-router/dev` - Add unstable support for splitting route modules in framework mode via `future.unstable_splitRouteModules` ([#11871](https://github.com/remix-run/react-router/pull/11871))
- `@react-router/dev` - Add `future.unstable_viteEnvironmentApi` flag to enable experimental Vite Environment API support ([#12936](https://github.com/remix-run/react-router/pull/12936))

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/create-react-router/CHANGELOG.md#720)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router/CHANGELOG.md#720)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-architect/CHANGELOG.md#720)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-cloudflare/CHANGELOG.md#720)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-dev/CHANGELOG.md#720)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-express/CHANGELOG.md#720)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-fs-routes/CHANGELOG.md#720)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-node/CHANGELOG.md#720)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#720)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.2.0/packages/react-router-serve/CHANGELOG.md#720)

**Full Changelog**: [`v7.1.5...v7.2.0`](https://github.com/remix-run/react-router/compare/react-router@7.1.5...react-router@7.2.0)

## v7.1.5

Date: 2025-01-31

### Patch Changes

- `react-router` - Fix regression introduced in `7.1.4` via [#12800](https://github.com/remix-run/react-router/pull/12800) that caused issues navigating to hash routes inside splat routes for applications using Lazy Route Discovery (`patchRoutesOnNavigation`) ([#12927](https://github.com/remix-run/react-router/pull/12927))

**Full Changelog**: [`v7.1.4...v7.1.5`](https://github.com/remix-run/react-router/compare/react-router@7.1.4...react-router@7.1.5)

## v7.1.4

Date: 2025-01-30

### Patch Changes

- `@react-router/dev` - Properly resolve Windows file paths to scan for Vite's dependency optimization when using the `unstable_optimizeDeps` future flag ([#12637](https://github.com/remix-run/react-router/pull/12637))
- `@react-router/dev` - Fix prerendering when using a custom server - previously we ended up trying to import the users custom server when we actually want to import the virtual server build module ([#12759](https://github.com/remix-run/react-router/pull/12759))
- `react-router` - Properly handle status codes that cannot have a body in single fetch responses (204, etc.) ([#12760](https://github.com/remix-run/react-router/pull/12760))
- `react-router` - Properly bubble headers as `errorHeaders` when throwing a `data()` result ([#12846](https://github.com/remix-run/react-router/pull/12846))
  - Avoid duplication of `Set-Cookie` headers if also returned from `headers`
- `react-router` - Stop erroring on resource routes that return raw strings/objects and instead serialize them as `text/plain` or `application/json` responses ([#12848](https://github.com/remix-run/react-router/pull/12848))
  - This only applies when accessed as a resource route without the `.data` extension
  - When accessed from a Single Fetch `.data` request, they will still be encoded via `turbo-stream`
- `react-router` - Optimize Lazy Route Discovery path discovery to favor a single `querySelectorAll` call at the `body` level instead of many calls at the sub-tree level ([#12731](https://github.com/remix-run/react-router/pull/12731))
- `react-router` - Optimize route matching by skipping redundant `matchRoutes` calls when possible ([#12800](https://github.com/remix-run/react-router/pull/12800), [#12882](https://github.com/remix-run/react-router/pull/12882))
- `react-router` - Internal reorg to clean up some duplicated route module types ([#12799](https://github.com/remix-run/react-router/pull/12799))

**Full Changelog**: [`v7.1.3...v7.1.4`](https://github.com/remix-run/react-router/compare/react-router@7.1.3...react-router@7.1.4)

## v7.1.3

Date: 2025-01-17

### Patch Changes

- `@react-router/dev` - Fix `reveal` and `routes` CLI commands ([#12745](https://github.com/remix-run/react-router/pull/12745))

**Full Changelog**: [`v7.1.2...v7.1.3`](https://github.com/remix-run/react-router/compare/react-router@7.1.2...react-router@7.1.3)

## v7.1.2

Date: 2025-01-16

### Patch Changes

- `react-router` - Fix issue with fetcher data cleanup in the data layer on fetcher unmount ([#12681](https://github.com/remix-run/react-router/pull/12681))
- `react-router` - Do not rely on `symbol` for filtering out `redirect` responses from loader data ([#12694](https://github.com/remix-run/react-router/pull/12694))
  - Previously, some projects were getting type checking errors like:
    ```ts
    error TS4058: Return type of exported function has or is using name 'redirectSymbol' from external module "node_modules/..." but cannot be named.
    ```
  - Now that `symbol`s are not used for the `redirect` response type, these errors should no longer be present
- `@react-router/dev` - Fix default external conditions in Vite v6 ([#12644](https://github.com/remix-run/react-router/pull/12644))
  - This fixes resolution issues with certain npm packages
- `@react-router/dev` - Fix mismatch in prerendering html/data files when path is missing a leading slash ([#12684](https://github.com/remix-run/react-router/pull/12684))
- `@react-router/dev` - Use `module-sync` server condition when enabled in the runtime. This fixes React context mismatches (e.g. `useHref() may be used only in the context of a <Router> component.`) during development on Node 22.10.0+ when using libraries that have a peer dependency on React Router ([#12729](https://github.com/remix-run/react-router/pull/12729))
- `@react-router/dev` - Fix `react-refresh` source maps ([#12686](https://github.com/remix-run/react-router/pull/12686))

**Full Changelog**: [`v7.1.1...v7.1.2`](https://github.com/remix-run/react-router/compare/react-router@7.1.1...react-router@7.1.2)

## v7.1.1

Date: 2024-12-23

### Patch Changes

- `@react-router/dev` - Fix for a crash when optional args are passed to the CLI ([#12609](https://github.com/remix-run/react-router/pull/12609))

**Full Changelog**: [`v7.1.0...v7.1.1`](https://github.com/remix-run/react-router/compare/react-router@7.1.0...react-router@7.1.1)

## v7.1.0

Date: 2024-12-20

### Minor Changes

- Add support for Vite v6 ([#12469](https://github.com/remix-run/react-router/pull/12469))

### Patch Changes

- `react-router` - Throw unwrapped Single Fetch `redirect` to align with pre-Single Fetch behavior ([#12506](https://github.com/remix-run/react-router/pull/12506))
- `react-router` - Ignore redirects when inferring loader data types ([#12527](https://github.com/remix-run/react-router/pull/12527))
- `react-router` - Remove `<Link prefetch>` warning which suffers from false positives in a lazy route discovery world ([#12485](https://github.com/remix-run/react-router/pull/12485))
- `create-react-router` - Fix missing `fs-extra` dependency ([#12556](https://github.com/remix-run/react-router/pull/12556))
- `@react-router/dev`/`@react-router/serve` - Properly initialize `NODE_ENV` if not already set for compatibility with React 19 ([#12578](https://github.com/remix-run/react-router/pull/12578))
- `@react-router/dev` - Remove the leftover/unused `abortDelay` prop from `ServerRouter` and update the default `entry.server.tsx` to use the new `streamTimeout` value for Single Fetch ([#12478](https://github.com/remix-run/react-router/pull/12478))
  - The `abortDelay` functionality was removed in v7 as it was coupled to the `defer` implementation from Remix v2, but this removal of this prop was missed
  - If you were still using this prop in your `entry.server` file, it's likely your app is not aborting streams as you would expect and you will need to adopt the new [`streamTimeout`](https://reactrouter.com/explanation/special-files#streamtimeout) value introduced with Single Fetch
- `@react-router/fs-routes` - Throw error in `flatRoutes` if routes directory is missing ([#12407](https://github.com/remix-run/react-router/pull/12407))

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/create-react-router/CHANGELOG.md#710)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router/CHANGELOG.md#710)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-architect/CHANGELOG.md#710)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-cloudflare/CHANGELOG.md#710)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-dev/CHANGELOG.md#710)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-express/CHANGELOG.md#710)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-fs-routes/CHANGELOG.md#710)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-node/CHANGELOG.md#710)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#710)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.1.0/packages/react-router-serve/CHANGELOG.md#710)

**Full Changelog**: [`v7.0.2...v7.1.0`](https://github.com/remix-run/react-router/compare/react-router@7.0.2...react-router@7.1.0)

## v7.0.2

Date: 2024-12-02

### Patch Changes

- `react-router` - Temporarily only use one build in export map so packages can have a peer dependency on react router ([#12437](https://github.com/remix-run/react-router/pull/12437))
- `@react-router/dev` - Support `moduleResolution` `Node16` and `NodeNext` ([#12440](https://github.com/remix-run/react-router/pull/12440))
- `@react-router/dev` - Generate wide `matches` and `params` types for child routes ([#12397](https://github.com/remix-run/react-router/pull/12397))
  - At runtime, `matches` includes child route matches and `params` include child route path parameters
  - But previously, we only generated types for parent routes and the current route in `matches` and `params`
  - To align our generated types more closely to the runtime behavior, we now generate more permissive, wider types when accessing child route information

**Full Changelog**: [`v7.0.1...v7.0.2`](https://github.com/remix-run/react-router/compare/react-router@7.0.1...react-router@7.0.2)

## v7.0.1

Date: 2024-11-22

### Patch Changes

- `@react-router/dev` - Ensure typegen file watcher is cleaned up when Vite dev server restarts ([#12331](https://github.com/remix-run/react-router/pull/12331))
- `@react-router/dev` - Pass route `error` to `ErrorBoundary` as a prop ([#12338](https://github.com/remix-run/react-router/pull/12338))

**Full Changelog**: [`v7.0.0...v7.0.1`](https://github.com/remix-run/react-router/compare/react-router@7.0.0...react-router@7.0.1)

## v7.0.0

Date: 2024-11-21

### Breaking Changes

#### Package Restructuring

- The `react-router-dom`, `@remix-run/react`, `@remix-run/server-runtime`, and `@remix-run/router` have been collapsed into the `react-router` package
  - To ease migration, `react-router-dom` is still published in v7 as a re-export of everything from `react-router`
- The `@remix-run/cloudflare-pages` and `@remix-run/cloudflare-workers` have been collapsed into `@react-router/cloudflare` package`
- The `react-router-dom-v5-compat` and `react-router-native` packages are removed starting with v7

#### Removed Adapter Re-exports

Remix v2 used to re-export all common `@remix-run/server-runtime` APIs through the various runtime packages (`node`, `cloudflare`, `deno`) so that you wouldn't need an additional `@remix-run/server-runtime` dependency in your `package.json`. With the collapsing of packages into `react-router`, these common APIs are now no longer re-exported through the runtime adapters. You should import all common APIs from `react-router`, and only import runtime-specific APIs from the runtime packages:

```jsx
// Runtime-specific APIs
import { createFileSessionStorage } from "@react-router/node";
// Runtime-agnostic APIs
import { redirect, useLoaderData } from "react-router";
```

#### Removed APIs

The following APIs have been removed in React Router v7:

- `json`
- `defer`
- `unstable_composeUploadHandlers`
- `unstable_createMemoryUploadHandler`
- `unstable_parseMultipartFormData`

#### Minimum Versions

React Router v7 requires the following minimum versions:

- `node@20`
  - React Router no longer provides an `installGlobals` method to [polyfill](https://reactrouter.com/dev/guides/deploying/custom-node#polyfilling-fetch) the `fetch` API
- `react@18`, `react-dom@18`

#### Adopted Future Flag Behaviors

Remix and React Router follow an [API Development Strategy](https://reactrouter.com/en/main/guides/api-development-strategy) leveraging "Future Flags" to avoid introducing a slew of breaking changes in a major release. Instead, breaking changes are introduced in minor releases behind a flag, allowing users to opt-in at their convenience. In the next major release, all future flag behaviors become the default behavior.

The following previously flagged behaviors are now the default in React Router v7:

- [React Router v6 flags](https://reactrouter.com/en/v6/upgrading/future)
  - `future.v7_relativeSplatPath`
  - `future.v7_startTransition`
  - `future.v7_fetcherPersist`
  - `future.v7_normalizeFormMethod`
  - `future.v7_partialHydration`
  - `future.v7_skipActionStatusRevalidation`
- [Remix v2 flags](https://remix.run/docs/en/v2/start/future-flags)
  - `future.v3_fetcherPersist`
  - `future.v3_relativeSplatPath`
  - `future.v3_throwAbortReason`
  - `future.v3_singleFetch`
  - `future.v3_lazyRouteDiscovery`
  - `future.v3_optimizeDeps`

#### Vite Compiler

The [Remix Vite plugin](https://remix.run/docs/en/2.12.1/start/future-flags#vite-plugin) is the proper way to build full-stack SSR apps using React Router v7. The former `esbuild`-based compiler is no longer available.

**Renamed `vitePlugin` and `cloudflareDevProxyVitePlugin`**

For Remix consumers migrating to React Router, the `vitePlugin` and `cloudflareDevProxyVitePlugin` exports have been renamed and moved ([#11904](https://github.com/remix-run/react-router/pull/11904))

```diff
-import {
-  vitePlugin as remix,
-  cloudflareDevProxyVitePlugin,
-} from "@remix/dev";

+import { reactRouter } from "@react-router/dev/vite";
+import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
```

**Removed `manifest` option**

For Remix consumers migrating to React Router, the Vite plugin's `manifest` option has been removed. The `manifest` option been superseded by the more powerful `buildEnd` hook since it's passed the `buildManifest` argument. You can still write the build manifest to disk if needed, but you'll most likely find it more convenient to write any logic depending on the build manifest within the `buildEnd` hook itself. ([#11573](https://github.com/remix-run/react-router/pull/11573))

If you were using the `manifest` option, you can replace it with a `buildEnd` hook that writes the manifest to disk like this:

```js
// react-router.config.ts
import { type Config } from "@react-router/dev/config";
import { writeFile } from "node:fs/promises";

export default {
  async buildEnd({ buildManifest }) {
    await writeFile(
      "build/manifest.json",
      JSON.stringify(buildManifest, null, 2),
      "utf-8"
    );
  },
} satisfies Config;
```

#### Exposed Router Promises

Because React 19 will have first-class support for handling promises in the render pass (via `React.use` and `useAction`), we are now comfortable exposing the promises for the APIs that previously returned `undefined`:

- `useNavigate()`
- `useSubmit()`
- `useFetcher().load`
- `useFetcher().submit`
- `useRevalidator().revalidate()`

### Other Notable Changes

#### `routes.ts`

When using the React Router Vite plugin, routes are defined in `app/routes.ts`. Route config is exported via the `routes` export, conforming to the `RouteConfig` type. Route helper functions `route`, `index`, and `layout` are provided to make declarative type-safe route definitions easier.

```ts
// app/routes.ts
import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes";

export const routes: RouteConfig = [
  index("./home.tsx"),
  route("about", "./about.tsx"),

  layout("./auth/layout.tsx", [
    route("login", "./auth/login.tsx"),
    route("register", "./auth/register.tsx"),
  ]),

  route("concerts", [
    index("./concerts/home.tsx"),
    route(":city", "./concerts/city.tsx"),
    route("trending", "./concerts/trending.tsx"),
  ]),
];
```

For Remix consumers migrating to React Router, you can still configure file system routing within `routes.ts` using the `@react-router/fs-routes` package. A minimal route config that reproduces the default Remix setup looks like this:

```ts
// app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export const routes: RouteConfig = flatRoutes();
```

If you want to migrate from file system routing to config-based routes, you can mix and match approaches by spreading the results of the async `flatRoutes` function into the array of config-based routes.

```ts
// app/routes.ts
import { type RouteConfig, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export const routes: RouteConfig = [
  // Example config-based route:
  route("/hello", "./routes/hello.tsx"),

  // File system routes scoped to a different directory:
  ...(await flatRoutes({
    rootDirectory: "fs-routes",
  })),
];
```

If you were using Remix's `routes` option to use alternative file system routing conventions, you can adapt these to the new `RouteConfig` format using `@react-router/remix-config-routes-adapter`.

For example, if you were using [Remix v1 route conventions](https://remix.run/docs/en/1.19.3/file-conventions/routes-files) in Remix v2, you can combine `@react-router/remix-config-routes-adapter` with `@remix-run/v1-route-convention` to adapt this to React Router:

```ts
// app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { remixConfigRoutes } from "@react-router/remix-config-routes-adapter";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

export const routes: RouteConfig = remixConfigRoutes(async (defineRoutes) => {
  return createRoutesFromFolders(defineRoutes, {
    ignoredFilePatterns: ["**/.*", "**/*.css"],
  });
});
```

Also note that, if you were using Remix's `routes` option to define config-based routes, you can also adapt these to the new `RouteConfig` format using `@react-router/remix-config-routes-adapter` with minimal code changes. While this makes for a fast migration path, we recommend migrating any config-based routes from Remix to the new `RouteConfig` format since it's a fairly straightforward migration.

```diff
// app/routes.ts
-import { type RouteConfig } from "@react-router/dev/routes";
+import { type RouteConfig, route } from "@react-router/dev/routes";
-import { remixConfigRoutes } from "@react-router/remix-config-routes-adapter";

-export const routes: RouteConfig = remixConfigRoutes(async (defineRoutes) => {
-  defineRoutes((route) => {
-    route("/parent", "./routes/parent.tsx", () => [
-      route("/child", "./routes/child.tsx"),
-    ]);
-  });
-});
+export const routes: RouteConfig = [
+  route("/parent", "./routes/parent.tsx", [
+    route("/child", "./routes/child.tsx"),
+  ]),
+];
```

#### Typesafety improvements

React Router now generates types for each of your route modules and passes typed props to route module component exports ([#11961](https://github.com/remix-run/react-router/pull/11961), [#12019](https://github.com/remix-run/react-router/pull/12019)). You can access those types by importing them from `./+types/<route filename without extension>`.

See [_How To > Route Module Type Safety_](https://reactrouter.com/dev/how-to/route-module-type-safety) and [_Explanations > Type Safety_](https://reactrouter.com/dev/explanation/type-safety) for more details.

#### Prerendering

React Router v7 includes a new `prerender` config in the vite plugin to support SSG use-cases. This will pre-render your `.html` and `.data` files at build time and so you can serve them statically at runtime from a running server or a CDN ([#11539](https://github.com/remix-run/react-router/pull/11539))

```ts
export default defineConfig({
  plugins: [
    reactRouter({
      async prerender({ getStaticPaths }) {
        let slugs = await fakeGetSlugsFromCms();
        return [
          ...getStaticPaths(),
          ...slugs.map((slug) => `/product/${slug}`),
        ];
      },
    }),
    tsconfigPaths(),
  ],
});

async function fakeGetSlugsFromCms() {
  await new Promise((r) => setTimeout(r, 1000));
  return ["shirt", "hat"];
}
```

### Major Changes (`react-router`)

- Remove the original `defer` implementation in favor of using raw promises via single fetch and `turbo-stream` ([#11744](https://github.com/remix-run/react-router/pull/11744))
  - This removes these exports from React Router:
    - `defer`
    - `AbortedDeferredError`
    - `type TypedDeferredData`
    - `UNSAFE_DeferredData`
    - `UNSAFE_DEFERRED_SYMBOL`
- Collapse packages into `react-router`([#11505](https://github.com/remix-run/react-router/pull/11505))
  - `@remix-run/router`
  - `react-router-dom`
  - `@remix-run/server-runtime`
  - `@remix-run/testing`
  - As a note, the `react-router-dom` package is maintained to ease adoption but it simply re-exports all APIs from `react-router`
- Drop support for Node 16, React Router SSR now requires Node 18 or higher ([#11391](https://github.com/remix-run/react-router/pull/11391), [#11690](https://github.com/remix-run/react-router/pull/11690))
- Remove `future.v7_startTransition` flag ([#11696](https://github.com/remix-run/react-router/pull/11696))
- Expose the underlying router promises from the following APIs for composition in React 19 APIs: ([#11521](https://github.com/remix-run/react-router/pull/11521))
- Remove `future.v7_normalizeFormMethod` future flag ([#11697](https://github.com/remix-run/react-router/pull/11697))
- Imports/Exports cleanup ([#11840](https://github.com/remix-run/react-router/pull/11840))
  - Removed the following exports that were previously public API from `@remix-run/router`
    - types
      - `AgnosticDataIndexRouteObject`
      - `AgnosticDataNonIndexRouteObject`
      - `AgnosticDataRouteMatch`
      - `AgnosticDataRouteObject`
      - `AgnosticIndexRouteObject`
      - `AgnosticNonIndexRouteObject`
      - `AgnosticRouteMatch`
      - `AgnosticRouteObject`
      - `TrackedPromise`
      - `unstable_AgnosticPatchRoutesOnMissFunction`
      - `Action` -> exported as `NavigationType` via `react-router`
      - `Router` exported as `RemixRouter` to differentiate from RR's `<Router>`
    - API
      - `getToPathname` (`@private`)
      - `joinPaths` (`@private`)
      - `normalizePathname` (`@private`)
      - `resolveTo` (`@private`)
      - `stripBasename` (`@private`)
      - `createBrowserHistory` -> in favor of `createBrowserRouter`
      - `createHashHistory` -> in favor of `createHashRouter`
      - `createMemoryHistory` -> in favor of `createMemoryRouter`
      - `createRouter`
      - `createStaticHandler` -> in favor of wrapper `createStaticHandler` in RR Dom
      - `getStaticContextFromError`
  - Removed the following exports that were previously public API from `react-router`
    - `Hash`
    - `Pathname`
    - `Search`
- Remove `future.v7_prependBasename` from the internalized `@remix-run/router` package ([#11726](https://github.com/remix-run/react-router/pull/11726))
- Remove `future.v7_throwAbortReason` from internalized `@remix-run/router` package ([#11728](https://github.com/remix-run/react-router/pull/11728))
- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))
- Renamed `RemixContext` to `FrameworkContext` ([#11705](https://github.com/remix-run/react-router/pull/11705))
- Update the minimum React version to 18 ([#11689](https://github.com/remix-run/react-router/pull/11689))
- `PrefetchPageDescriptor` replaced by `PageLinkDescriptor` ([#11960](https://github.com/remix-run/react-router/pull/11960))
- Remove the `future.v7_partialHydration` flag ([#11725](https://github.com/remix-run/react-router/pull/11725))
  - This also removes the `<RouterProvider fallbackElement>` prop
    - To migrate, move the `fallbackElement` to a `hydrateFallbackElement`/`HydrateFallback` on your root route
  - Also worth nothing there is a related breaking changer with this future flag:
    - Without `future.v7_partialHydration` (when using `fallbackElement`), `state.navigation` was populated during the initial load
    - With `future.v7_partialHydration`, `state.navigation` remains in an `"idle"` state during the initial load
- Remove `future.v7_relativeSplatPath` future flag ([#11695](https://github.com/remix-run/react-router/pull/11695))
- Remove remaining future flags ([#11820](https://github.com/remix-run/react-router/pull/11820))
  - React Router `v7_skipActionErrorRevalidation`
  - Remix `v3_fetcherPersist`, `v3_relativeSplatPath`, `v3_throwAbortReason`
- Rename `createRemixStub` to `createRoutesStub` ([#11692](https://github.com/remix-run/react-router/pull/11692))
- Remove `@remix-run/router` deprecated `detectErrorBoundary` option in favor of `mapRouteProperties` ([#11751](https://github.com/remix-run/react-router/pull/11751))
- Add `react-router/dom` subpath export to properly enable `react-dom` as an optional `peerDependency` ([#11851](https://github.com/remix-run/react-router/pull/11851))
  - This ensures that we don't blindly `import ReactDOM from "react-dom"` in `<RouterProvider>` in order to access `ReactDOM.flushSync()`, since that would break `createMemoryRouter` use cases in non-DOM environments
  - DOM environments should import from `react-router/dom` to get the proper component that makes `ReactDOM.flushSync()` available:
    - If you are using the Vite plugin, use this in your `entry.client.tsx`:
      - `import { HydratedRouter } from 'react-router/dom'`
    - If you are not using the Vite plugin and are manually calling `createBrowserRouter`/`createHashRouter`:
      - `import { RouterProvider } from "react-router/dom"`
- Remove `future.v7_fetcherPersist` flag ([#11731](https://github.com/remix-run/react-router/pull/11731))
- Allow returning `undefined` from loaders and actions ([#11680](https://github.com/remix-run/react-router/pull/11680), [#12057]([https://github.com/remix-run/react-router/pull/1205))
- Use `createRemixRouter`/`RouterProvider` in `entry.client` instead of `RemixBrowser` ([#11469](https://github.com/remix-run/react-router/pull/11469))
- Remove the deprecated `json` utility ([#12146](https://github.com/remix-run/react-router/pull/12146))
  - You can use [`Response.json`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static) if you still need to construct JSON responses in your app

### Major Changes (`@react-router/*`)

- Remove `future.v3_singleFetch` flag ([#11522](https://github.com/remix-run/react-router/pull/11522))
- Drop support for Node 16 and 18, update minimum Node version to 20 ([#11690](https://github.com/remix-run/react-router/pull/11690), [#12171](https://github.com/remix-run/react-router/pull/12171))
  - Remove `installGlobals()` as this should no longer be necessary
- Add `exports` field to all packages ([#11675](https://github.com/remix-run/react-router/pull/11675))
- No longer re-export APIs from `react-router` through different runtime/adapter packages ([#11702](https://github.com/remix-run/react-router/pull/11702))
- For Remix consumers migrating to React Router, the `crypto` global from the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is now required when using cookie and session APIs
  - This means that the following APIs are provided from `react-router` rather than platform-specific packages: ([#11837](https://github.com/remix-run/react-router/pull/11837))
    - `createCookie`
    - `createCookieSessionStorage`
    - `createMemorySessionStorage`
    - `createSessionStorage`
  - For consumers running older versions of Node, the `installGlobals` function from `@remix-run/node` has been updated to define `globalThis.crypto`, using [Node's `require('node:crypto').webcrypto` implementation](https://nodejs.org/api/webcrypto.html)
  - Since platform-specific packages no longer need to implement this API, the following low-level APIs have been removed:
    - `createCookieFactory`
    - `createSessionStorageFactory`
    - `createCookieSessionStorageFactory`
    - `createMemorySessionStorageFactory`
- Consolidate types previously duplicated across `@remix-run/router`, `@remix-run/server-runtime`, and `@remix-run/react` now that they all live in `react-router` ([#12177](https://github.com/remix-run/react-router/pull/12177))
  - Examples: `LoaderFunction`, `LoaderFunctionArgs`, `ActionFunction`, `ActionFunctionArgs`, `DataFunctionArgs`, `RouteManifest`, `LinksFunction`, `Route`, `EntryRoute`
  - The `RouteManifest` type used by the "remix" code is now slightly stricter because it is using the former `@remix-run/router` `RouteManifest`
    - `Record<string, Route> -> Record<string, Route | undefined>`
  - Removed `AppData` type in favor of inlining `unknown` in the few locations it was used
  - Removed `ServerRuntimeMeta*` types in favor of the `Meta*` types they were duplicated from
- Migrate Remix v2 type generics to React Router ([#12180](https://github.com/remix-run/react-router/pull/12180))
  - These generics are provided for Remix v2 migration purposes
  - These generics and the APIs they exist on should be considered informally deprecated in favor of the new `Route.*` types
  - Anyone migrating from React Router v6 should probably not leverage these new generics and should migrate straight to the `Route.*` types
  - For React Router v6 users, these generics are new and should not impact your app, with one exception
    - `useFetcher` previously had an optional generic (used primarily by Remix v2) that expected the data type
    - This has been updated in v7 to expect the type of the function that generates the data (i.e., `typeof loader`/`typeof action`)
    - Therefore, you should update your usages:
      - ❌ `useFetcher<LoaderData>()`
      - ✅ `useFetcher<typeof loader>()`
- Update `cookie` dependency to `^1.0.1` - please see the [release notes](https://github.com/jshttp/cookie/releases) for any breaking changes ([#12172](https://github.com/remix-run/react-router/pull/12172))
- `@react-router/cloudflare` - For Remix consumers migrating to React Router, all exports from `@remix-run/cloudflare-pages` are now provided for React Router consumers in the `@react-router/cloudflare` package. There is no longer a separate package for Cloudflare Pages. ([#11801](https://github.com/remix-run/react-router/pull/11801))
- `@react-router/cloudflare` - The `@remix-run/cloudflare-workers` package has been deprecated. Remix consumers migrating to React Router should use the `@react-router/cloudflare` package directly. For guidance on how to use `@react-router/cloudflare` within a Cloudflare Workers context, refer to the Cloudflare Workers template. ([#11801](https://github.com/remix-run/react-router/pull/11801))
- `@react-router/dev` - For Remix consumers migrating to React Router, the `vitePlugin` and `cloudflareDevProxyVitePlugin` exports have been renamed and moved. ([#11904](https://github.com/remix-run/react-router/pull/11904))
- `@react-router/dev` - For Remix consumers migrating to React Router who used the Vite plugin's `buildEnd` hook, the resolved `reactRouterConfig` object no longer contains a `publicPath` property since this belongs to Vite, not React Router ([#11575](https://github.com/remix-run/react-router/pull/11575))
- `@react-router/dev` - For Remix consumers migrating to React Router, the Vite plugin's `manifest` option has been removed ([#11573](https://github.com/remix-run/react-router/pull/11573))
- `@react-router/dev` - Update default `isbot` version to v5 and drop support for `isbot@3` ([#11770](https://github.com/remix-run/react-router/pull/11770))
  - If you have `isbot@4` or `isbot@5` in your `package.json`:
    - You do not need to make any changes
  - If you have `isbot@3` in your `package.json` and you have your own `entry.server.tsx` file in your repo
    - You do not need to make any changes
    - You can upgrade to `isbot@5` independent of the React Router v7 upgrade
  - If you have `isbot@3` in your `package.json` and you do not have your own `entry.server.tsx` file in your repo
    - You are using the internal default entry provided by React Router v7 and you will need to upgrade to `isbot@5` in your `package.json`
- `@react-router/dev` - For Remix consumers migrating to React Router, Vite manifests (i.e. `.vite/manifest.json`) are now written within each build subdirectory, e.g. `build/client/.vite/manifest.json` and `build/server/.vite/manifest.json` instead of `build/.vite/client-manifest.json` and `build/.vite/server-manifest.json`. This means that the build output is now much closer to what you'd expect from a typical Vite project. ([#11573](https://github.com/remix-run/react-router/pull/11573))
  - Originally the Remix Vite plugin moved all Vite manifests to a root-level `build/.vite` directory to avoid accidentally serving them in production, particularly from the client build. This was later improved with additional logic that deleted these Vite manifest files at the end of the build process unless Vite's `build.manifest` had been enabled within the app's Vite config. This greatly reduced the risk of accidentally serving the Vite manifests in production since they're only present when explicitly asked for. As a result, we can now assume that consumers will know that they need to manage these additional files themselves, and React Router can safely generate a more standard Vite build output.

### Minor Changes

- `react-router` - Params, loader data, and action data as props for route component exports ([#11961](https://github.com/remix-run/react-router/pull/11961))
- `react-router` - Add route module type generation ([#12019](https://github.com/remix-run/react-router/pull/12019))
- `react-router` - Remove duplicate `RouterProvider` implementations ([#11679](https://github.com/remix-run/react-router/pull/11679))
- `react-router` - Stabilize `unstable_dataStrategy` ([#11969](https://github.com/remix-run/react-router/pull/11969))
- `react-router` - Stabilize `unstable_patchRoutesOnNavigation` ([#11970](https://github.com/remix-run/react-router/pull/11970))
- `react-router` - Add prefetching support to `Link`/`NavLink` when using Remix SSR ([#11402](https://github.com/remix-run/react-router/pull/11402))
- `react-router` - Enhance `ScrollRestoration` so it can restore properly on an SSR'd document load ([#11401](https://github.com/remix-run/react-router/pull/11401))
- `@react-router/dev` - Add support for the `prerender` config in the React Router vite plugin, to support existing SSG use-cases ([#11539](https://github.com/remix-run/react-router/pull/11539))
- `@react-router/dev` - Remove internal `entry.server.spa.tsx` implementation which was not compatible with the Single Fetch async hydration approach ([#11681](https://github.com/remix-run/react-router/pull/11681))
- `@react-router/serve`: Update `express.static` configurations to support new `prerender` API ([#11547](https://github.com/remix-run/react-router/pull/11547))
  - Assets in the `build/client/assets` folder are served as before, with a 1-year immutable `Cache-Control` header
  - Static files outside of assets, such as pre-rendered `.html` and `.data` files are not served with a specific `Cache-Control` header
  - `.data` files are served with `Content-Type: text/x-turbo`
    - For some reason, when adding this via `express.static`, it seems to also add a `Cache-Control: public, max-age=0` to `.data` files

### Patch Changes

- Replace `substr` with `substring` ([#12080](https://github.com/remix-run/react-router/pull/12080))
- `react-router` - Fix redirects returned from loaders/actions using `data()` ([#12021](https://github.com/remix-run/react-router/pull/12021))
- `@react-router/dev` - Enable prerendering for resource routes ([#12200](https://github.com/remix-run/react-router/pull/12200))
- `@react-router/dev` - resolve config directory relative to flat output file structure ([#12187](https://github.com/remix-run/react-router/pull/12187))

### Changes by Package

- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router/CHANGELOG.md#700)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-architect/CHANGELOG.md#700)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-cloudflare/CHANGELOG.md#700)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-dev/CHANGELOG.md#700)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-express/CHANGELOG.md#700)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-fs-routes/CHANGELOG.md#700)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-node/CHANGELOG.md#700)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#700)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.0.0/packages/react-router-serve/CHANGELOG.md#700)

**Full Changelog**: [`v6.28.0...v7.0.0`](https://github.com/remix-run/react-router/compare/react-router@6.28.0...react-router@7.0.0)

# React Router v6 Releases

## v6.30.0

Date: 2025-02-27

### Minor Changes

- Add `fetcherKey` as a parameter to `patchRoutesOnNavigation` ([#13109](https://github.com/remix-run/react-router/pull/13109))

### Patch Changes

- Fix regression introduced in `6.29.0` via [#12169](https://github.com/remix-run/react-router/pull/12169) that caused issues navigating to hash routes inside splat routes for applications using Lazy Route Discovery (`patchRoutesOnNavigation`) ([#13108](https://github.com/remix-run/react-router/pull/13108))

**Full Changelog**: [`v6.29.0...v6.30.0`](https://github.com/remix-run/react-router/compare/react-router@6.29.0...react-router@6.30.0)

## v6.29.0

Date: 2025-01-30

### Minor Changes

- Provide the request `signal` as a parameter to `patchRoutesOnNavigation` ([#12900](https://github.com/remix-run/react-router/pull/12900))
  - This can be used to abort any manifest fetches if the in-flight navigation/fetcher is aborted

### Patch Changes

- Do not log v7 deprecation warnings in production builds ([#12794](https://github.com/remix-run/react-router/pull/12794))
- Properly bubble headers when throwing a `data()` result ([#12845](https://github.com/remix-run/react-router/pull/12845))
- Optimize route matching by skipping redundant `matchRoutes` calls when possible ([#12169](https://github.com/remix-run/react-router/pull/12169))
- Strip search parameters from `patchRoutesOnNavigation` `path` param for fetcher calls ([#12899](https://github.com/remix-run/react-router/pull/12899))

**Full Changelog**: [`v6.28.2...v6.29.0`](https://github.com/remix-run/react-router/compare/react-router@6.28.2...react-router@6.29.0)

## v6.28.2

Date: 2025-01-16

### Patch Changes

- Fix manual fetcher `key` usage when not opted into `future.v7_fetcherPersist` ([#12674](https://github.com/remix-run/react-router/pull/12674))
- Fix issue with fetcher data cleanup in the data layer on fetcher unmount ([#12674](https://github.com/remix-run/react-router/pull/12674))

**Full Changelog**: [`v6.28.1...v6.28.2`](https://github.com/remix-run/react-router/compare/react-router@6.28.1...react-router@6.28.2)

## v6.28.1

Date: 2024-12-20

### Patch Changes

- Allow users to opt out of v7 deprecation warnings by setting flags to `false` ([#12441](https://github.com/remix-run/react-router/pull/12441))

**Full Changelog**: [`v6.28.0...v6.28.1`](https://github.com/remix-run/react-router/compare/react-router@6.28.0...react-router@6.28.1)

## v6.28.0

Date: 2024-11-06

### What's Changed

- In preparation for v7 we've added deprecation warnings for any future flags that you have not yet opted into. Please use the flags to better prepare for eventually upgrading to v7.

### Minor Changes

- Log deprecation warnings for v7 flags ([#11750](https://github.com/remix-run/react-router/pull/11750))
  - Add deprecation warnings to `json`/`defer` in favor of returning raw objects
    - These methods will be removed in React Router v7

### Patch Changes

- Update JSDoc URLs for new website structure (add /v6/ segment) ([#12141](https://github.com/remix-run/react-router/pull/12141))

**Full Changelog**: [`v6.27.0...v6.28.0`](https://github.com/remix-run/react-router/compare/react-router@6.27.0...react-router@6.28.0)

## v6.27.0

Date: 2024-10-11

### What's Changed

#### Stabilized APIs

This release stabilizes a handful of "unstable" APIs in preparation for the [pending](https://x.com/remix_run/status/1841926034868077009) React Router v7 release (see [these](https://remix.run/blog/merging-remix-and-react-router) [posts](https://remix.run/blog/incremental-path-to-react-19) for more info):

- `unstable_dataStrategy` → `dataStrategy` (`createBrowserRouter` and friends) ([Docs](https://reactrouter.com/v6/routers/create-browser-router#optsdatastrategy))
- `unstable_patchRoutesOnNavigation` → `patchRoutesOnNavigation` (`createBrowserRouter` and friends) ([Docs](https://reactrouter.com/v6/routers/create-browser-router#optspatchroutesonnavigation))
- `unstable_flushSync` → `flushSync` (`useSubmit`, `fetcher.load`, `fetcher.submit`) ([Docs](https://reactrouter.com/v6/hooks/use-submit#optionsflushsync))
- `unstable_viewTransition` → `viewTransition` (`<Link>`, `<Form>`, `useNavigate`, `useSubmit`) ([Docs](https://reactrouter.com/v6/components/link#viewtransition))

### Minor Changes

- Stabilize the `unstable_flushSync` option for navigations and fetchers ([#11989](https://github.com/remix-run/react-router/pull/11989))
- Stabilize the `unstable_viewTransition` option for navigations and the corresponding `unstable_useViewTransitionState` hook ([#11989](https://github.com/remix-run/react-router/pull/11989))
- Stabilize `unstable_dataStrategy` ([#11974](https://github.com/remix-run/react-router/pull/11974))
- Stabilize `unstable_patchRoutesOnNavigation` ([#11973](https://github.com/remix-run/react-router/pull/11973))
  - Add new `PatchRoutesOnNavigationFunctionArgs` type for convenience ([#11967](https://github.com/remix-run/react-router/pull/11967))

### Patch Changes

- Fix bug when submitting to the current contextual route (parent route with an index child) when an `?index` param already exists from a prior submission ([#12003](https://github.com/remix-run/react-router/pull/12003))
- Fix `useFormAction` bug - when removing `?index` param it would not keep other non-Remix `index` params ([#12003](https://github.com/remix-run/react-router/pull/12003))
- Fix bug with fetchers not persisting `preventScrollReset` through redirects during concurrent fetches ([#11999](https://github.com/remix-run/react-router/pull/11999))
- Avoid unnecessary `console.error` on fetcher abort due to back-to-back revalidation calls ([#12050](https://github.com/remix-run/react-router/pull/12050))
- Fix bugs with `partialHydration` when hydrating with errors ([#12070](https://github.com/remix-run/react-router/pull/12070))
- Remove internal cache to fix issues with interrupted `patchRoutesOnNavigation` calls ([#12055](https://github.com/remix-run/react-router/pull/12055))
  - ⚠️ This may be a breaking change if you were relying on this behavior in the `unstable_` API
  - We used to cache in-progress calls to `patchRoutesOnNavigation` internally so that multiple navigations with the same start/end would only execute the function once and use the same promise
  - However, this approach was at odds with `patch` short circuiting if a navigation was interrupted (and the `request.signal` aborted) since the first invocation's `patch` would no-op
  - This cache also made some assumptions as to what a valid cache key might be - and is oblivious to any other application-state changes that may have occurred
  - So, the cache has been removed because in _most_ cases, repeated calls to something like `import()` for async routes will already be cached automatically - and if not it's easy enough for users to implement this cache in userland
- Remove internal `discoveredRoutes` FIFO queue from `unstable_patchRoutesOnNavigation` ([#11977](https://github.com/remix-run/react-router/pull/11977))
  - ⚠️ This may be a breaking change if you were relying on this behavior in the `unstable_` API
  - This was originally implemented as an optimization but it proved to be a bit too limiting
  - If you need this optimization you can implement your own cache inside `patchRoutesOnNavigation`
- Fix types for `RouteObject` within `PatchRoutesOnNavigationFunction`'s `patch` method so it doesn't expect agnostic route objects passed to `patch` ([#11967](https://github.com/remix-run/react-router/pull/11967))
- Expose errors thrown from `patchRoutesOnNavigation` directly to `useRouteError` instead of wrapping them in a 400 `ErrorResponse` instance ([#12111](https://github.com/remix-run/react-router/pull/12111))

**Full Changelog**: [`v6.26.2...v6.27.0`](https://github.com/remix-run/react-router/compare/react-router@6.26.2...react-router@6.27.0)

## v6.26.2

Date: 2024-09-09

### Patch Changes

- Update the `unstable_dataStrategy` API to allow for more advanced implementations ([#11943](https://github.com/remix-run/react-router/pull/11943))
  - ⚠️ If you have already adopted `unstable_dataStrategy`, please review carefully as this includes breaking changes to this API
  - Rename `unstable_HandlerResult` to `unstable_DataStrategyResult`
  - Change the return signature of `unstable_dataStrategy` from a parallel array of `unstable_DataStrategyResult[]` (parallel to `matches`) to a key/value object of `routeId => unstable_DataStrategyResult`
    - This allows more advanced control over revalidation behavior because you can opt-into or out-of revalidating data that may not have been revalidated by default (via `match.shouldLoad`)
  - You should now return/throw a result from your `handlerOverride` instead of returning a `DataStrategyResult`
    - The return value (or thrown error) from your `handlerOverride` will be wrapped up into a `DataStrategyResult` and returned fromm `match.resolve`
    - Therefore, if you are aggregating the results of `match.resolve()` into a final results object you should not need to think about the `DataStrategyResult` type
    - If you are manually filling your results object from within your `handlerOverride`, then you will need to assign a `DataStrategyResult` as the value so React Router knows if it's a successful execution or an error (see examples in the documentation for details)
  - Added a new `fetcherKey` parameter to `unstable_dataStrategy` to allow differentiation from navigational and fetcher calls
- Preserve opted-in view transitions through redirects ([#11925](https://github.com/remix-run/react-router/pull/11925))
- Preserve pending view transitions through a router revalidation call ([#11917](https://github.com/remix-run/react-router/pull/11917))
- Fix blocker usage when `blocker.proceed` is called quickly/synchronously ([#11930](https://github.com/remix-run/react-router/pull/11930))

**Full Changelog**: [`v6.26.1...v6.26.2`](https://github.com/remix-run/react-router/compare/react-router@6.26.1...react-router@6.26.2)

## v6.26.1

Date: 2024-08-15

### Patch Changes

- Rename `unstable_patchRoutesOnMiss` to `unstable_patchRoutesOnNavigation` to match new behavior ([#11888](https://github.com/remix-run/react-router/pull/11888))
- Update `unstable_patchRoutesOnNavigation` logic so that we call the method when we match routes with dynamic param or splat segments in case there exists a higher-scoring static route that we've not yet discovered ([#11883](https://github.com/remix-run/react-router/pull/11883))
  - We also now leverage an internal FIFO queue of previous paths we've already called `unstable_patchRoutesOnNavigation` against so that we don't re-call on subsequent navigations to the same path

**Full Changelog**: [`v6.26.0...v6.26.1`](https://github.com/remix-run/react-router/compare/react-router@6.26.0...react-router@6.26.1)

## v6.26.0

Date: 2024-08-01

### Minor Changes

- Add a new `replace(url, init?)` alternative to `redirect(url, init?)` that performs a `history.replaceState` instead of a `history.pushState` on client-side navigation redirects ([#11811](https://github.com/remix-run/react-router/pull/11811))
- Add a new `unstable_data()` API for usage with Remix Single Fetch ([#11836](https://github.com/remix-run/react-router/pull/11836))
  - This API is not intended for direct usage in React Router SPA applications
  - It is primarily intended for usage with `createStaticHandler.query()` to allow loaders/actions to return arbitrary data along with custom `status`/`headers` without forcing the serialization of data into a `Response` instance
  - This allows for more advanced serialization tactics via `unstable_dataStrategy` such as serializing via `turbo-stream` in Remix Single Fetch
  - ⚠️ This removes the `status` field from `HandlerResult`
    - If you need to return a specific `status` from `unstable_dataStrategy` you should instead do so via `unstable_data()`

### Patch Changes

- Fix internal cleanup of interrupted fetchers to avoid invalid revalidations on navigations ([#11839](https://github.com/remix-run/react-router/pull/11839))
- Fix initial hydration behavior when using `future.v7_partialHydration` along with `unstable_patchRoutesOnMiss` ([#11838](https://github.com/remix-run/react-router/pull/11838))
  - During initial hydration, `router.state.matches` will now include any partial matches so that we can render ancestor `HydrateFallback` components

**Full Changelog**: [`v6.25.1...v6.26.0`](https://github.com/remix-run/react-router/compare/react-router@6.25.1...react-router@6.26.0)

## v6.25.1

Date: 2024-07-17

### Patch Changes

- Memoize some `RouterProvider` internals to reduce unnecessary re-renders ([#11803](https://github.com/remix-run/react-router/pull/11803))

**Full Changelog**: [`v6.25.0...v6.25.1`](https://github.com/remix-run/react-router/compare/react-router@6.25.0...react-router@6.25.1)

## v6.25.0

Date: 2024-07-16

### What's Changed

#### Stabilized `v7_skipActionErrorRevalidation`

This release stabilizes the `future.unstable_skipActionErrorRevalidation` flag into [`future.v7_skipActionErrorRevalidation`](https://reactrouter.com/v6/upgrading/future#v7_skipactionstatusrevalidation) in preparation for the upcoming React Router v7 release.

- When this flag is enabled, actions that return/throw a `4xx/5xx` `Response` will not trigger a revalidation by default
- This also stabilizes `shouldRevalidate`'s `unstable_actionStatus` parameter to `actionStatus`

### Minor Changes

- Stabilize `future.unstable_skipActionErrorRevalidation` as `future.v7_skipActionErrorRevalidation` ([#11769](https://github.com/remix-run/react-router/pull/11769))

### Patch Changes

- Fix regression and properly decode paths inside `useMatch` so matches/params reflect decoded params ([#11789](https://github.com/remix-run/react-router/pull/11789))
- Fix bubbling of errors thrown from `unstable_patchRoutesOnMiss` ([#11786](https://github.com/remix-run/react-router/pull/11786))
- Fix hydration in SSR apps using `unstable_patchRoutesOnMiss` that matched a splat route on the server ([#11790](https://github.com/remix-run/react-router/pull/11790))

**Full Changelog**: [`v6.24.1...v6.25.0`](https://github.com/remix-run/react-router/compare/react-router@6.24.1...react-router@6.25.0)

## v6.24.1

Date: 2024-07-03

### Patch Changes

- Remove `polyfill.io` reference from warning message because the domain was sold and has since been determined to serve malware ([#11741](https://github.com/remix-run/react-router/pull/11741))
  - See https://sansec.io/research/polyfill-supply-chain-attack
- Export `NavLinkRenderProps` type for easier typing of custom `NavLink` callback ([#11553](https://github.com/remix-run/react-router/pull/11553))
- When using `future.v7_relativeSplatPath`, properly resolve relative paths in splat routes that are children of pathless routes ([#11633](https://github.com/remix-run/react-router/pull/11633))
- Fog of War (unstable): Trigger a new `router.routes` identity/reflow during route patching ([#11740](https://github.com/remix-run/react-router/pull/11740))
- Fog of War (unstable): Fix initial matching when a splat route matches ([#11759](https://github.com/remix-run/react-router/pull/11759))

**Full Changelog**: [`v6.24.0...v6.24.1`](https://github.com/remix-run/react-router/compare/react-router@6.24.0...react-router@6.24.1)

## v6.24.0

Date: 2024-06-24

### What's Changed

#### Lazy Route Discovery (a.k.a. "Fog of War")

We're really excited to release our new API for "Lazy Route Discovery" in `v6.24.0`! For some background information, please check out the original [RFC](https://github.com/remix-run/react-router/discussions/11113). The **tl;dr;** is that ever since we introduced the Data APIs in v6.4 via `<RouterProvider>`, we've been a little bummed that one of the tradeoffs was the lack of a compelling code-splitting story mirroring what we had in the `<BrowserRouter>`/`<Routes>` apps. We took a baby-step towards improving that story with `route.lazy` in `v6.9.0`, but with `v6.24.0` we've gone the rest of the way.

With "Fog of War", you can now load portions of the route tree lazily via the new `unstable_patchRoutesOnMiss` option passed to `createBrowserRouter` (and it's memory/hash counterparts). This gives you a way to hook into spots where React Router is unable to match a given path and patch new routes into the route tree during the navigation (or fetcher call).

Here's a very small example, but please refer to the [documentation](https://reactrouter.com/v6/routers/create-browser-router#optsunstable_patchroutesonmiss) for more information and use cases:

```js
const router = createBrowserRouter(
  [
    {
      id: "root",
      path: "/",
      Component: RootComponent,
    },
  ],
  {
    async unstable_patchRoutesOnMiss({ path, patch }) {
      if (path === "/a") {
        // Load the `a` route (`{ path: 'a', Component: A }`)
        let route = await getARoute();
        // Patch the `a` route in as a new child of the `root` route
        patch("root", [route]);
      }
    },
  }
);
```

### Minor Changes

- Add support for Lazy Route Discovery (a.k.a. "Fog of War") ([#11626](https://github.com/remix-run/react-router/pull/11626))

### Patch Changes

- Fix `fetcher.submit` types - remove incorrect `navigate`/`fetcherKey`/`unstable_viewTransition` options because they are only relevant for `useSubmit` ([#11631](https://github.com/remix-run/react-router/pull/11631))
- Allow falsy `location.state` values passed to `<StaticRouter>` ([#11495](https://github.com/remix-run/react-router/pull/11495))

**Full Changelog**: [`v6.23.1...v6.24.0`](https://github.com/remix-run/react-router/compare/react-router@6.23.1...react-router@6.24.0)

## v6.23.1

Date: 2024-05-10

### Patch Changes

- Allow `undefined` to be resolved through `<Await>` ([#11513](https://github.com/remix-run/react-router/pull/11513))
- Add defensive `document` check when checking for `document.startViewTransition` availability ([#11544](https://github.com/remix-run/react-router/pull/11544))
- Change the `react-router-dom/server` import back to `react-router-dom` instead of `index.ts` ([#11514](https://github.com/remix-run/react-router/pull/11514))
- `@remix-run/router` - Support `unstable_dataStrategy` on `staticHandler.queryRoute` ([#11515](https://github.com/remix-run/react-router/pull/11515))

**Full Changelog**: [`v6.23.0...v6.23.1`](https://github.com/remix-run/react-router/compare/react-router@6.23.0...react-router@6.23.1)

## v6.23.0

Date: 2024-04-23

### What's Changed

#### Data Strategy (unstable)

The new `unstable_dataStrategy` API is a low-level API designed for advanced use-cases where you need to take control over the data strategy for your `loader`/`action` functions. The default implementation is today's behavior, to fetch all loaders in parallel, but this option allows users to implement more advanced data flows including Remix ["Single Fetch"](https://remix.run/docs/guides/single-fetch), user-land middleware/context APIs, automatic loader caching, and more. Please see the [docs](https://reactrouter.com/v6/routers/create-browser-router#unstable_datastrategy) for more information.

**Note:** This is a low-level API intended for advanced use-cases. This overrides React Router's internal handling of `loader`/`action` execution, and if done incorrectly will break your app code. Please use with caution and perform the appropriate testing.

#### Skip Action Error Revalidation (unstable)

Currently, all active `loader`'s revalidate after any `action` submission, regardless of the `action` result. However, in the majority of cases a `4xx`/`5xx` response from an `action` means that no data was actually changed and the revalidation is unnecessary. We've introduced a new `future.unstable_skipActionErrorRevalidation` flag that changes the behavior here, and we plan to make this the default in future version of React Router.

With this flag enabled, `action`'s that return/throw a `4xx`/`5xx` response status will no longer automatically revalidate. If you need to revalidate after a `4xx`/`5xx` result with this flag enabled, you can still do that via returning `true` from `shouldRevalidate` - which now also receives a new `unstable_actionStatus` argument alongside `actionResult` so you can make decision based on the status of the `action` response without having to encode it into the action data.

### Minor Changes

- Add a new `unstable_dataStrategy` configuration option ([#11098](https://github.com/remix-run/react-router/pull/11098), [#11377](https://github.com/remix-run/react-router/pull/11377))
- `@remix-run/router` - Add a new `future.unstable_skipActionRevalidation` future flag ([#11098](https://github.com/remix-run/react-router/pull/11098))
- `@remix-run/router` - SSR: Added a new `skipLoaderErrorBubbling` options to the `staticHandler.query` method to disable error bubbling by the static handler for use in Remix's Single Fetch implementation ([#11098](https://github.com/remix-run/react-router/pull/11098), ([#11377](https://github.com/remix-run/react-router/pull/11377)))

**Full Changelog**: [`v6.22.3...v6.23.0`](https://github.com/remix-run/react-router/compare/react-router@6.22.3...react-router@6.23.0)

## v6.22.3

Date: 2024-03-07

### Patch Changes

- Fix a `future.v7_partialHydration` bug that would re-run loaders below the boundary on hydration if SSR loader errors bubbled to a parent boundary ([#11324](https://github.com/remix-run/react-router/pull/11324))
- Fix a `future.v7_partialHydration` bug that would consider the router uninitialized if a route did not have a loader ([#11325](https://github.com/remix-run/react-router/pull/11325))

**Full Changelog**: [`v6.22.2...v6.22.3`](https://github.com/remix-run/react-router/compare/react-router@6.22.2...react-router@6.22.3)

## v6.22.2

Date: 2024-02-28

### Patch Changes

- Preserve hydrated errors during partial hydration runs ([#11305](https://github.com/remix-run/react-router/pull/11305))

**Full Changelog**: [`v6.22.1...v6.22.2`](https://github.com/remix-run/react-router/compare/react-router@6.22.1...react-router@6.22.2)

## v6.22.1

Date: 2024-02-16

### Patch Changes

- Fix encoding/decoding issues with pre-encoded dynamic parameter values ([#11199](https://github.com/remix-run/react-router/pull/11199))

**Full Changelog**: [`v6.22.0...v6.22.1`](https://github.com/remix-run/react-router/compare/react-router@6.22.0...react-router@6.22.1)

## v6.22.0

Date: 2024-02-01

### What's Changed

#### Core Web Vitals Technology Report Flag

In 2021, the HTTP Archive launched the [Core Web Vitals Technology Report dashboard](https://discuss.httparchive.org/t/new-dashboard-the-core-web-vitals-technology-report/2178):

> By combining the powers of real-user experiences in the Chrome UX Report 26 (CrUX) dataset with web technology detections in HTTP Archive 30, we can get a glimpse into how architectural decisions like choices of CMS platform or JavaScript framework play a role in sites’ CWV performance.

They use a tool called [`wappalyzer`](https://github.com/HTTPArchive/wappalyzer) to identify what technologies a given website is using by looking for certain scripts, global JS variables, or other identifying characteristics. For example, for Remix applications, they [look for the global `__remixContext`](https://github.com/HTTPArchive/wappalyzer/blob/c2a24ee7c2d07bf9c521f02584ae2dcf603ac0b7/src/technologies/r.json#L1328) variable to identify that a website is using Remix.

It was brought to our attention that React Router was unable to be reliably identified because there are no identifying global aspects. They are currently [looking for external scripts with `react-router`](https://github.com/HTTPArchive/wappalyzer/blob/c2a24ee7c2d07bf9c521f02584ae2dcf603ac0b7/src/technologies/r.json#L637) in the name. This will identify sites using React Router from a CDN such as `unpkg` - but it will miss the **vast** majority of sites that are installing React Router from the npm registry and bundling it into their JS files. This results in [drastically under-reporting](https://lookerstudio.google.com/s/pixHkNmGbN4) the usage of React Router on the web.

Starting with version `6.22.0`, sites using `react-router-dom` will begin adding a `window.__reactRouterVersion` variable that will be set to a string value of the SemVer major version number (i.e., `window.__reactRouterVersion = "6";`) so that they can be properly identified.

### Minor Changes

- Include a `window.__reactRouterVersion` for CWV Report detection ([#11222](https://github.com/remix-run/react-router/pull/11222))
- Add a `createStaticHandler` `future.v7_throwAbortReason` flag to throw `request.signal.reason` (defaults to a `DOMException`) when a request is aborted instead of an `Error` such as `new Error("query() call aborted: GET /path")` ([#11104](https://github.com/remix-run/react-router/pull/11104))
  - Please note that `DOMException` was added in Node v17 so you will not get a `DOMException` on Node 16 and below.

### Patch Changes

- Respect the `ErrorResponse` status code if passed to `getStaticContextFormError` ([#11213](https://github.com/remix-run/react-router/pull/11213))

**Full Changelog**: [`v6.21.3...v6.22.0`](https://github.com/remix-run/react-router/compare/react-router@6.21.3...react-router@6.22.0)

## v6.21.3

Date: 2024-01-18

### Patch Changes

- Fix `NavLink` `isPending` when a `basename` is used ([#11195](https://github.com/remix-run/react-router/pull/11195))
- Remove leftover `unstable_` prefix from `Blocker`/`BlockerFunction` types ([#11187](https://github.com/remix-run/react-router/pull/11187))

**Full Changelog**: [`v6.21.2...v6.21.3`](https://github.com/remix-run/react-router/compare/react-router@6.21.2...react-router@6.21.3)

## v6.21.2

Date: 2024-01-11

### Patch Changes

- Leverage `useId` for internal fetcher keys when available ([#11166](https://github.com/remix-run/react-router/pull/11166))
- Fix bug where dashes were not picked up in dynamic parameter names ([#11160](https://github.com/remix-run/react-router/pull/11160))
- Do not attempt to deserialize empty JSON responses ([#11164](https://github.com/remix-run/react-router/pull/11164))

**Full Changelog**: [`v6.21.1...v6.21.2`](https://github.com/remix-run/react-router/compare/react-router@6.21.1...react-router@6.21.2)

## v6.21.1

Date: 2023-12-21

### Patch Changes

- Fix bug with `route.lazy` not working correctly on initial SPA load when `v7_partialHydration` is specified ([#11121](https://github.com/remix-run/react-router/pull/11121))
- Fix bug preventing revalidation from occurring for persisted fetchers unmounted during the `submitting` phase ([#11102](https://github.com/remix-run/react-router/pull/11102))
- De-dup relative path logic in `resolveTo` ([#11097](https://github.com/remix-run/react-router/pull/11097))

**Full Changelog**: [`v6.21.0...v6.21.1`](https://github.com/remix-run/react-router/compare/react-router@6.21.0...react-router@6.21.1)

## v6.21.0

Date: 2023-12-13

### What's Changed

#### `future.v7_relativeSplatPath`

We fixed a splat route path-resolution bug in `6.19.0`, but later determined a large number of applications were relying on the buggy behavior, so we reverted the fix in `6.20.1` (see [#10983](https://github.com/remix-run/react-router/issues/10983), [#11052](https://github.com/remix-run/react-router/issues/11052), [#11078](https://github.com/remix-run/react-router/issues/11078)).

The buggy behavior is that the default behavior when resolving relative paths inside a splat route would _ignore_ any splat (`*`) portion of the current route path. When the future flag is enabled, splat portions are included in relative path logic within splat routes.

For more information, please refer to the [`useResolvedPath` docs](https://reactrouter.com/v6/hooks/use-resolved-path#splat-paths) and/or the [detailed changelog entry](https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/CHANGELOG.md#6210).

#### Partial Hydration

We added a new `future.v7_partialHydration` future flag for the `@remix-run/router` that enables partial hydration of a data router when Server-Side Rendering. This allows you to provide `hydrationData.loaderData` that has values for _some_ initially matched route loaders, but not all. When this flag is enabled, the router will call `loader` functions for routes that do not have hydration loader data during `router.initialize()`, and it will render down to the deepest provided `HydrateFallback` (up to the first route without hydration data) while it executes the unhydrated routes. ([#11033](https://github.com/remix-run/react-router/pull/11033))

### Minor Changes

- Add a new `future.v7_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. ([#11087](https://github.com/remix-run/react-router/pull/11087))
- Add a new `future.v7_partialHydration` future flag that enables partial hydration of a data router when Server-Side Rendering ([#11033](https://github.com/remix-run/react-router/pull/11033))

### Patch Changes

- Properly handle falsy error values in `ErrorBoundary`'s ([#11071](https://github.com/remix-run/react-router/pull/11071))
- Catch and bubble errors thrown when trying to unwrap responses from `loader`/`action` functions ([#11061](https://github.com/remix-run/react-router/pull/11061))
- Fix `relative="path"` issue when rendering `Link`/`NavLink` outside of matched routes ([#11062](https://github.com/remix-run/react-router/pull/11062))

**Full Changelog**: [`v6.20.1...v6.21.0`](https://github.com/remix-run/react-router/compare/react-router@6.20.1...react-router@6.21.0)

## v6.20.1

Date: 2023-12-01

### Patch Changes

- Revert the `useResolvedPath` fix for splat routes due to a large number of applications that were relying on the buggy behavior (see [#11052](https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329)) ([#11078](https://github.com/remix-run/react-router/pull/11078))
  - We plan to re-introduce this fix behind a future flag in the next minor version (see [this comment](https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329))
  - This fix was included in versions `6.19.0` and `6.20.0`. If you are upgrading from `6.18.0` or earlier, you would not have been impacted by this fix.

**Full Changelog**: [`v6.20.0...v6.20.1`](https://github.com/remix-run/react-router/compare/react-router@6.20.0...react-router@6.20.1)

## v6.20.0

Date: 2023-11-22

> [!WARNING]
> Please use version `6.20.1` or later instead of `6.20.0`. We discovered that a large number of apps were relying on buggy behavior that was fixed in this release ([#11045](https://github.com/remix-run/react-router/pull/11045)). We reverted the fix in `6.20.1` and will be re-introducing it behind a future flag in a subsequent release. See [#11052](https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329) for more details.

### Minor Changes

- Export the `PathParam` type from the public API ([#10719](https://github.com/remix-run/react-router/pull/10719))

### Patch Changes

- Do not revalidate unmounted fetchers when `v7_fetcherPersist` is enabled ([#11044](https://github.com/remix-run/react-router/pull/11044))
- Fix bug with `resolveTo` path resolution in splat routes ([#11045](https://github.com/remix-run/react-router/pull/11045))
  - This is a follow up to [#10983](https://github.com/remix-run/react-router/pull/10983) to handle the few other code paths using `getPathContributingMatches`
  - This removes the `UNSAFE_getPathContributingMatches` export from `@remix-run/router` since we no longer need this in the `react-router`/`react-router-dom` layers

**Full Changelog**: [`v6.19.0...v6.20.0`](https://github.com/remix-run/react-router/compare/react-router@6.19.0...react-router@6.20.0)

## v6.19.0

Date: 2023-11-16

> [!WARNING]
> Please use version `6.20.1` or later instead of `6.19.0`. We discovered that a large number of apps were relying on buggy behavior that was fixed in this release ([#10983](https://github.com/remix-run/react-router/pull/10983)). We reverted the fix in `6.20.1` and will be re-introducing it behind a future flag in a subsequent release. See [#11052](https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329) for more details.

### What's Changed

#### `unstable_flushSync` API

This release brings a new `unstable_flushSync` option to the imperative APIs (`useSubmit`, `useNavigate`, `fetcher.submit`, `fetcher.load`) to let users opt-into synchronous DOM updates for pending/optimistic UI.

```js
function handleClick() {
  submit(data, { flushSync: true });
  // Everything is flushed to the DOM so you can focus/scroll to your pending/optimistic UI
  setFocusAndOrScrollToNewlyAddedThing();
}
```

### Minor Changes

- Add `unstable_flushSync` option to `useNavigate`/`useSubmit`/`fetcher.load`/`fetcher.submit` to opt-out of `React.startTransition` and into `ReactDOM.flushSync` for state updates ([#11005](https://github.com/remix-run/react-router/pull/11005))
- Remove the `unstable_` prefix from the [`useBlocker`](https://reactrouter.com/v6/hooks/use-blocker) hook as it's been in use for enough time that we are confident in the API ([#10991](https://github.com/remix-run/react-router/pull/10991))
  - We do not plan to remove the prefix from `unstable_usePrompt` due to differences in how browsers handle `window.confirm` that prevent React Router from guaranteeing consistent/correct behavior

### Patch Changes

- Fix `useActionData` so it returns proper contextual action data and not _any_ action data in the tree ([#11023](https://github.com/remix-run/react-router/pull/11023))
- Fix bug in `useResolvedPath` that would cause `useResolvedPath(".")` in a splat route to lose the splat portion of the URL path. ([#10983](https://github.com/remix-run/react-router/pull/10983))
  - ⚠️ This fixes a quite long-standing bug specifically for `"."` paths inside a splat route which incorrectly dropped the splat portion of the URL. If you are relative routing via `"."` inside a splat route in your application you should double check that your logic is not relying on this buggy behavior and update accordingly.
- Fix issue where a changing fetcher `key` in a `useFetcher` that remains mounted wasn't getting picked up ([#11009](https://github.com/remix-run/react-router/pull/11009))
- Fix `useFormAction` which was incorrectly inheriting the `?index` query param from child route `action` submissions ([#11025](https://github.com/remix-run/react-router/pull/11025))
- Fix `NavLink` `active` logic when `to` location has a trailing slash ([#10734](https://github.com/remix-run/react-router/pull/10734))
- Fix types so `unstable_usePrompt` can accept a `BlockerFunction` in addition to a `boolean` ([#10991](https://github.com/remix-run/react-router/pull/10991))
- Fix `relative="path"` bug where relative path calculations started from the full location pathname, instead of from the current contextual route pathname. ([#11006](https://github.com/remix-run/react-router/pull/11006))

  ```jsx
  <Route path="/a">
    <Route path="/b" element={<Component />}>
      <Route path="/c" />
    </Route>
  </Route>;

  function Component() {
    return (
      <>
        {/* This is now correctly relative to /a/b, not /a/b/c */}
        <Link to=".." relative="path" />
        <Outlet />
      </>
    );
  }
  ```

**Full Changelog**: [`6.18.0...6.19.0`](https://github.com/remix-run/react-router/compare/react-router@6.18.0...react-router@6.19.0)

## v6.18.0

Date: 2023-10-31

### What's Changed

#### New Fetcher APIs

Per this [RFC](https://github.com/remix-run/remix/discussions/7698), we've introduced some new APIs that give you more granular control over your fetcher behaviors.

- You may now specify your own fetcher identifier via `useFetcher({ key: string })`, which allows you to access the same fetcher instance from different components in your application without prop-drilling
- Fetcher keys are now exposed on the fetchers returned from `useFetchers` so that they can be looked up by `key`
- `Form` and `useSubmit` now support optional `navigate`/`fetcherKey` props/params to allow kicking off a fetcher submission under the hood with an optionally user-specified `key`
  - `<Form method="post" navigate={false} fetcherKey="my-key">`
  - `submit(data, { method: "post", navigate: false, fetcherKey: "my-key" })`
  - Invoking a fetcher in this way is ephemeral and stateless
  - If you need to access the state of one of these fetchers, you will need to leverage `useFetchers()` or `useFetcher({ key })` to look it up elsewhere

#### Persistence Future Flag (`future.v7_fetcherPersist`)

Per the same [RFC](https://github.com/remix-run/remix/discussions/7698) as above, we've introduced a new `future.v7_fetcherPersist` flag that allows you to opt-into the new fetcher persistence/cleanup behavior. Instead of being immediately cleaned up on unmount, fetchers will persist until they return to an `idle` state. This makes pending/optimistic UI _much_ easier in scenarios where the originating fetcher needs to unmount.

- This is sort of a long-standing bug fix as the `useFetchers()` API was always supposed to only reflect **in-flight** fetcher information for pending/optimistic UI -- it was not intended to reflect fetcher data or hang onto fetchers after they returned to an `idle` state
- Keep an eye out for the following specific behavioral changes when opting into this flag and check your app for compatibility:
  - Fetchers that complete _while still mounted_ will no longer appear in `useFetchers()` after completion - they served no purpose in there since you can access the data via `useFetcher().data`
  - Fetchers that previously unmounted _while in-flight_ will not be immediately aborted and will instead be cleaned up once they return to an `idle` state
    - They will remain exposed via `useFetchers` while in-flight so you can still access pending/optimistic data after unmount
    - If a fetcher is no longer mounted when it completes, then it's result will not be post processed - e.g., redirects will not be followed and errors will not bubble up in the UI
    - However, if a fetcher was re-mounted elsewhere in the tree using the same `key`, then it's result will be processed, even if the originating fetcher was unmounted

### Minor Changes

- Add fetcher `key` APIs and `navigate=false` options ([#10960](https://github.com/remix-run/react-router/pull/10960))
- Add `future.v7_fetcherPersist` flag ([#10962](https://github.com/remix-run/react-router/pull/10962))
- Add support for optional path segments in `matchPath` ([#10768](https://github.com/remix-run/react-router/pull/10768))

### Patch Changes

- Fix the `future` prop on `BrowserRouter`, `HashRouter` and `MemoryRouter` so that it accepts a `Partial<FutureConfig>` instead of requiring all flags to be included ([#10962](https://github.com/remix-run/react-router/pull/10962))
- Fix `router.getFetcher`/`router.deleteFetcher` type definitions which incorrectly specified `key` as an optional parameter ([#10960](https://github.com/remix-run/react-router/pull/10960))

**Full Changelog**: [`6.17.0...6.18.0`](https://github.com/remix-run/react-router/compare/react-router@6.17.0...react-router@6.18.0)

## v6.17.0

Date: 2023-10-16

### What's Changed

#### View Transitions 🚀

We're excited to release experimental support for the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) in React Router! You can now trigger navigational DOM updates to be wrapped in `document.startViewTransition` to enable CSS animated transitions on SPA navigations in your application.

The simplest approach to enabling a View Transition in your React Router app is via the new [`<Link unstable_viewTransition>`](https://reactrouter.com/v6/components/link#unstable_viewtransition) prop. This will cause the navigation DOM update to be wrapped in `document.startViewTransition` which will enable transitions for the DOM update. Without any additional CSS styles, you'll get a basic cross-fade animation for your page.

If you need to apply more fine-grained styles for your animations, you can leverage the [`unstable_useViewTransitionState`](https://reactrouter.com/v6/hooks/use-view-transition-state) hook which will tell you when a transition is in progress and you can use that to apply classes or styles:

```jsx
function ImageLink(to, src, alt) {
  const isTransitioning = unstable_useViewTransitionState(to);
  return (
    <Link to={to} unstable_viewTransition>
      <img
        src={src}
        alt={alt}
        style={{
          viewTransitionName: isTransitioning ? "image-expand" : "",
        }}
      />
    </Link>
  );
}
```

You can also use the [`<NavLink unstable_viewTransition>`](https://reactrouter.com/v6/components/nav-link#unstable_viewtransition) shorthand which will manage the hook usage for you and automatically add a `transitioning` class to the `<a>` during the transition:

```css
a.transitioning img {
  view-transition-name: "image-expand";
}
```

```jsx
<NavLink to={to} unstable_viewTransition>
  <img src={src} alt={alt} />
</NavLink>
```

For an example usage of View Transitions, check out [our fork](https://github.com/brophdawg11/react-router-records) of the awesome [Astro Records](https://github.com/Charca/astro-records) demo.

For more information on using the View Transitions API, please refer to the [Smooth and simple transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) guide from the Google Chrome team.

### Minor Changes

- Add support for view transitions ([#10916](https://github.com/remix-run/react-router/pull/10916))

### Patch Changes

- Log a warning and fail gracefully in `ScrollRestoration` when `sessionStorage` is unavailable ([#10848](https://github.com/remix-run/react-router/pull/10848))
- Fix `RouterProvider` `future` prop type to be a `Partial<FutureConfig>` so that not all flags must be specified ([#10900](https://github.com/remix-run/react-router/pull/10900))
- Allow 404 detection to leverage root route error boundary if path contains a URL segment ([#10852](https://github.com/remix-run/react-router/pull/10852))
- Fix `ErrorResponse` type to avoid leaking internal field ([#10876](https://github.com/remix-run/react-router/pull/10876))

**Full Changelog**: [`6.16.0...6.17.0`](https://github.com/remix-run/react-router/compare/react-router@6.16.0...react-router@6.17.0)

## v6.16.0

Date: 2023-09-13

### Minor Changes

- In order to move towards stricter TypeScript support in the future, we're aiming to replace current usages of `any` with `unknown` on exposed typings for user-provided data. To do this in Remix v2 without introducing breaking changes in React Router v6, we have added generics to a number of shared types. These continue to default to `any` in React Router and are overridden with `unknown` in Remix. In React Router v7 we plan to move these to `unknown` as a breaking change. ([#10843](https://github.com/remix-run/react-router/pull/10843))
  - `Location` now accepts a generic for the `location.state` value
  - `ActionFunctionArgs`/`ActionFunction`/`LoaderFunctionArgs`/`LoaderFunction` now accept a generic for the `context` parameter (only used in SSR usages via `createStaticHandler`)
  - The return type of `useMatches` (now exported as `UIMatch`) accepts generics for `match.data` and `match.handle` - both of which were already set to `unknown`
- Move the `@private` class export `ErrorResponse` to an `UNSAFE_ErrorResponseImpl` export since it is an implementation detail and there should be no construction of `ErrorResponse` instances in userland. This frees us up to export a `type ErrorResponse` which correlates to an instance of the class via `InstanceType`. Userland code should only ever be using `ErrorResponse` as a type and should be type-narrowing via `isRouteErrorResponse`. ([#10811](https://github.com/remix-run/react-router/pull/10811))
- Export `ShouldRevalidateFunctionArgs` interface ([#10797](https://github.com/remix-run/react-router/pull/10797))
- Removed private/internal APIs only required for the Remix v1 backwards compatibility layer and no longer needed in Remix v2 (`_isFetchActionRedirect`, `_hasFetcherDoneAnything`) ([#10715](https://github.com/remix-run/react-router/pull/10715))

### Patch Changes

- Properly encode rendered URIs in server rendering to avoid hydration errors ([#10769](https://github.com/remix-run/react-router/pull/10769))
- Add method/url to error message on aborted `query`/`queryRoute` calls ([#10793](https://github.com/remix-run/react-router/pull/10793))
- Fix a race-condition with loader/action-thrown errors on `route.lazy` routes ([#10778](https://github.com/remix-run/react-router/pull/10778))
- Fix type for `actionResult` on the arguments object passed to `shouldRevalidate` ([#10779](https://github.com/remix-run/react-router/pull/10779))

**Full Changelog**: [`v6.15.0...v6.16.0`](https://github.com/remix-run/react-router/compare/react-router@6.15.0...react-router@6.16.0)

## v6.15.0

Date: 2023-08-10

### Minor Changes

- Add's a new `redirectDocument()` function which allows users to specify that a redirect from a `loader`/`action` should trigger a document reload (via `window.location`) instead of attempting to navigate to the redirected location via React Router ([#10705](https://github.com/remix-run/react-router/pull/10705))

### Patch Changes

- Ensure `useRevalidator` is referentially stable across re-renders if revalidations are not actively occurring ([#10707](https://github.com/remix-run/react-router/pull/10707))
- Ensure hash history always includes a leading slash on hash pathnames ([#10753](https://github.com/remix-run/react-router/pull/10753))
- Fixes an edge-case affecting web extensions in Firefox that use `URLSearchParams` and the `useSearchParams` hook ([#10620](https://github.com/remix-run/react-router/pull/10620))
- Reorder effects in `unstable_usePrompt` to avoid throwing an exception if the prompt is unblocked and a navigation is performed synchronously ([#10687](https://github.com/remix-run/react-router/pull/10687), [#10718](https://github.com/remix-run/react-router/pull/10718))
- SSR: Do not include hash in `useFormAction()` for unspecified actions since it cannot be determined on the server and causes hydration issues ([#10758](https://github.com/remix-run/react-router/pull/10758))
- SSR: Fix an issue in `queryRoute` that was not always identifying thrown `Response` instances ([#10717](https://github.com/remix-run/react-router/pull/10717))
- `react-router-native`: Update `@ungap/url-search-params` dependency from `^0.1.4` to `^0.2.2` ([#10590](https://github.com/remix-run/react-router/pull/10590))

**Full Changelog**: [`v6.14.2...v6.15.0`](https://github.com/remix-run/react-router/compare/react-router@6.14.2...react-router@6.15.0)

## v6.14.2

Date: 2023-07-17

### Patch Changes

- Add missing `<Form state>` prop to populate `history.state` on submission navigations ([#10630](https://github.com/remix-run/react-router/pull/10630))
- Trigger an error if a `defer` promise resolves/rejects with `undefined` in order to match the behavior of loaders and actions which must return a value or `null` ([#10690](https://github.com/remix-run/react-router/pull/10690))
- Properly handle fetcher redirects interrupted by normal navigations ([#10674](https://github.com/remix-run/react-router/pull/10674))
- Initial-load fetchers should not automatically revalidate on GET navigations ([#10688](https://github.com/remix-run/react-router/pull/10688))
- Properly decode element id when emulating hash scrolling via `<ScrollRestoration>` ([#10682](https://github.com/remix-run/react-router/pull/10682))
- Typescript: Enhance the return type of `Route.lazy` to prohibit returning an empty object ([#10634](https://github.com/remix-run/react-router/pull/10634))
- SSR: Support proper hydration of `Error` subclasses such as `ReferenceError`/`TypeError` ([#10633](https://github.com/remix-run/react-router/pull/10633))

**Full Changelog**: [`v6.14.1...v6.14.2`](https://github.com/remix-run/react-router/compare/react-router@6.14.1...react-router@6.14.2)

## v6.14.1

Date: 2023-06-30

### Patch Changes

- Fix loop in `unstable_useBlocker` when used with an unstable blocker function ([#10652](https://github.com/remix-run/react-router/pull/10652))
- Fix issues with reused blockers on subsequent navigations ([#10656](https://github.com/remix-run/react-router/pull/10656))
- Updated dependencies:
  - `@remix-run/router@1.7.1`

**Full Changelog**: [`v6.14.0...v6.14.1`](https://github.com/remix-run/react-router/compare/react-router@6.14.0...react-router@6.14.1)

## v6.14.0

Date: 2023-06-23

### What's Changed

#### JSON/Text Submissions

`6.14.0` adds support for JSON and Text submissions via `useSubmit`/`fetcher.submit` since it's not always convenient to have to serialize into `FormData` if you're working in a client-side SPA. To opt-into these encodings you just need to specify the proper `formEncType`:

**Opt-into `application/json` encoding:**

```js
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit({ key: "value" }, { method: "post", encType: "application/json" });
  // navigation.formEncType => "application/json"
  // navigation.json        => { key: "value" }
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "application/json"
  // await request.json()                => { key: "value" }
}
```

**Opt-into `text/plain` encoding:**

```js
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit("Text submission", { method: "post", encType: "text/plain" });
  // navigation.formEncType => "text/plain"
  // navigation.text        => "Text submission"
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "text/plain"
  // await request.text()                => "Text submission"
}
```

**⚠️ Default Behavior Will Change in v7**

Please note that to avoid a breaking change, the default behavior will still encode a simple key/value JSON object into a `FormData` instance:

```jsx
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit({ key: "value" }, { method: "post" });
  // navigation.formEncType => "application/x-www-form-urlencoded"
  // navigation.formData    => FormData instance
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "application/x-www-form-urlencoded"
  // await request.formData()            => FormData instance
}
```

This behavior will likely change in v7 so it's best to make any JSON object submissions explicit with `formEncType: "application/x-www-form-urlencoded"` or `formEncType: "application/json"` to ease your eventual v7 migration path.

### Minor Changes

- Add support for `application/json` and `text/plain` encodings for `useSubmit`/`fetcher.submit`. To reflect these additional types, `useNavigation`/`useFetcher` now also contain `navigation.json`/`navigation.text` and `fetcher.json`/`fetcher.text` which include the json/text submission if applicable. ([#10413](https://github.com/remix-run/react-router/pull/10413))

### Patch Changes

- When submitting a form from a `submitter` element, prefer the built-in `new FormData(form, submitter)` instead of the previous manual approach in modern browsers (those that support the new `submitter` parameter) ([#9865](https://github.com/remix-run/react-router/pull/9865))
  - For browsers that don't support it, we continue to just append the submit button's entry to the end, and we also add rudimentary support for `type="image"` buttons
  - If developers want full spec-compliant support for legacy browsers, they can use the `formdata-submitter-polyfill`
- Call `window.history.pushState/replaceState` _before_ updating React Router state (instead of after) so that `window.location` matches `useLocation` during synchronous React 17 rendering ([#10448](https://github.com/remix-run/react-router/pull/10448))
  - ⚠️ Note: generally apps should not be relying on `window.location` and should always reference `useLocation` when possible, as `window.location` will not be in sync 100% of the time (due to `popstate` events, concurrent mode, etc.)
- Avoid calling `shouldRevalidate` for fetchers that have not yet completed a data load ([#10623](https://github.com/remix-run/react-router/pull/10623))
- Strip `basename` from the `location` provided to `<ScrollRestoration getKey>` to match the `useLocation` behavior ([#10550](https://github.com/remix-run/react-router/pull/10550))
- Strip `basename` from locations provided to `unstable_useBlocker` functions to match the `useLocation` behavior ([#10573](https://github.com/remix-run/react-router/pull/10573))
- Fix `unstable_useBlocker` key issues in `StrictMode` ([#10573](https://github.com/remix-run/react-router/pull/10573))
- Fix `generatePath` when passed a numeric `0` value parameter ([#10612](https://github.com/remix-run/react-router/pull/10612))
- Fix `tsc --skipLibCheck:false` issues on React 17 ([#10622](https://github.com/remix-run/react-router/pull/10622))
- Upgrade `typescript` to 5.1 ([#10581](https://github.com/remix-run/react-router/pull/10581))

**Full Changelog**: [`v6.13.0...v6.14.0`](https://github.com/remix-run/react-router/compare/react-router@6.13.0...react-router@6.14.0)

## v6.13.0

Date: 2023-06-14

### What's Changed

`6.13.0` is really a patch release in spirit but comes with a SemVer minor bump since we added a new future flag.

#### `future.v7_startTransition`

The **tl;dr;** is that `6.13.0` is the same as [`6.12.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.12.0) bue we've moved the usage of `React.startTransition` behind an opt-in `future.v7_startTransition` [future flag](https://reactrouter.com/v6/guides/api-development-strategy) because we found that there are applications in the wild that are currently using `Suspense` in ways that are incompatible with `React.startTransition`.

Therefore, in `6.13.0` the default behavior will no longer leverage `React.startTransition`:

```jsx
<BrowserRouter>
  <Routes>{/*...*/}</Routes>
</BrowserRouter>

<RouterProvider router={router} />
```

If you wish to enable `React.startTransition`, pass the future flag to your router component:

```jsx
<BrowserRouter future={{ v7_startTransition: true }}>
  <Routes>{/*...*/}</Routes>
</BrowserRouter>

<RouterProvider router={router} future={{ v7_startTransition: true }}/>
```

We recommend folks adopt this flag sooner rather than later to be better compatible with React concurrent mode, but if you run into issues you can continue without the use of `React.startTransition` until v7. Issues usually boil down to creating net-new promises during the render cycle, so if you run into issues when opting into `React.startTransition`, you should either lift your promise creation out of the render cycle or put it behind a `useMemo`.

### Minor Changes

- Move `React.startTransition` usage behinds a future flag ([#10596](https://github.com/remix-run/react-router/pull/10596))

### Patch Changes

- Work around webpack/terser `React.startTransition` minification bug in production mode ([#10588](https://github.com/remix-run/react-router/pull/10588))

**Full Changelog**: [`v6.12.1...v6.13.0`](https://github.com/remix-run/react-router/compare/react-router@6.12.1...react-router@6.13.0)

## v6.12.1

Date: 2023-06-08

> [!WARNING]
> Please use version `6.13.0` or later instead of `6.12.0`/`6.12.1`. These versions suffered from some Webpack build/minification issues resulting failed builds or invalid minified code in your production bundles. See [#10569](https://github.com/remix-run/react-router/pull/10569) and [#10579](https://github.com/remix-run/react-router/issues/10579) for more details.

### Patch Changes

- Adjust feature detection of `React.startTransition` to fix webpack + react 17 compilation error ([#10569](https://github.com/remix-run/react-router/pull/10569))

**Full Changelog**: [`v6.12.0...v6.12.1`](https://github.com/remix-run/react-router/compare/react-router@6.12.0...react-router@6.12.1)

## v6.12.0

Date: 2023-06-06

> [!WARNING]
> Please use version `6.13.0` or later instead of `6.12.0`/`6.12.1`. These versions suffered from some Webpack build/minification issues resulting failed builds or invalid minified code in your production bundles. See [#10569](https://github.com/remix-run/react-router/pull/10569) and [#10579](https://github.com/remix-run/react-router/issues/10579) for more details.

### What's Changed

#### `React.startTransition` support

With `6.12.0` we've added better support for suspending components by wrapping the internal router state updates in [`React.startTransition`](https://react.dev/reference/react/startTransition). This means that, for example, if one of your components in a destination route suspends and you have not provided a [`Suspense`](https://react.dev/reference/react/Suspense) boundary to show a fallback, React will delay the rendering of the new UI and show the old UI until that asynchronous operation resolves. This could be useful for waiting for things such as waiting for images or CSS files to load (and technically, yes, you could use it for data loading but we'd still recommend using loaders for that 😀). For a quick overview of this usage, check out [Ryan's demo on Twitter](https://twitter.com/remix_run/status/1658976420767604736).

### Minor Changes

- Wrap internal router state updates with `React.startTransition` ([#10438](https://github.com/remix-run/react-router/pull/10438))

### Patch Changes

- Allow fetcher revalidations to complete if submitting fetcher is deleted ([#10535](https://github.com/remix-run/react-router/pull/10535))
- Re-throw `DOMException` (`DataCloneError`) when attempting to perform a `PUSH` navigation with non-serializable state. ([#10427](https://github.com/remix-run/react-router/pull/10427))
- Ensure revalidations happen when hash is present ([#10516](https://github.com/remix-run/react-router/pull/10516))
- Upgrade `jest` and `jsdom` ([#10453](https://github.com/remix-run/react-router/pull/10453))
- Updated dependencies:
  - `@remix-run/router@1.6.3` ([Changelog](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#163))

**Full Changelog**: [`v6.11.2...v6.12.0`](https://github.com/remix-run/react-router/compare/react-router@6.11.2...react-router@6.12.0)

## v6.11.2

Date: 2023-05-17

### Patch Changes

- Fix `basename` duplication in descendant `<Routes>` inside a `<RouterProvider>` ([#10492](https://github.com/remix-run/react-router/pull/10492))
- Fix bug where initial data load would not kick off when hash is present ([#10493](https://github.com/remix-run/react-router/pull/10493))
- Export `SetURLSearchParams` type ([#10444](https://github.com/remix-run/react-router/pull/10444))
- Fix Remix HMR-driven error boundaries by properly reconstructing new routes and `manifest` in `_internalSetRoutes` ([#10437](https://github.com/remix-run/react-router/pull/10437))

**Full Changelog**: [`v6.11.1...v6.11.2`](https://github.com/remix-run/react-router/compare/react-router@6.11.1...react-router@6.11.2)

## v6.11.1

Date: 2023-05-03

### Patch Changes

- Fix usage of `Component` API within descendant `<Routes>` ([#10434](https://github.com/remix-run/react-router/pull/10434))
- Fix bug when calling `useNavigate` from `<Routes>` inside a `<RouterProvider>` ([#10432](https://github.com/remix-run/react-router/pull/10432))
- Fix usage of `<Navigate>` in strict mode when using a data router ([#10435](https://github.com/remix-run/react-router/pull/10435))
- Fix `basename` handling when navigating without a path ([#10433](https://github.com/remix-run/react-router/pull/10433))
- "Same hash" navigations no longer re-run loaders to match browser behavior (i.e. `/path#hash -> /path#hash`) ([#10408](https://github.com/remix-run/react-router/pull/10408))

**Full Changelog**: [`v6.11.0...v6.11.1`](https://github.com/remix-run/react-router/compare/react-router@6.11.0...react-router@6.11.1)

## v6.11.0

Date: 2023-04-28

### Minor Changes

- Enable `basename` support in `useFetcher` ([#10336](https://github.com/remix-run/react-router/pull/10336))
  - If you were previously working around this issue by manually prepending the `basename` then you will need to remove the manually prepended `basename` from your `fetcher` calls (`fetcher.load('/basename/route') -> fetcher.load('/route')`)
- Updated dependencies:
  - `@remix-run/router@1.6.0` ([Changelog](https://github.com/remix-run/react-router/blob/main/packages/router/CHANGELOG.md#160))

### Patch Changes

- When using a `RouterProvider`, `useNavigate`/`useSubmit`/`fetcher.submit` are now stable across location changes, since we can handle relative routing via the `@remix-run/router` instance and get rid of our dependence on `useLocation()` ([#10336](https://github.com/remix-run/react-router/pull/10336))
  - When using `BrowserRouter`, these hooks remain unstable across location changes because they still rely on `useLocation()`
- Fetchers should no longer revalidate on search params changes or routing to the same URL, and will only revalidate on `action` submissions or `router.revalidate` calls ([#10344](https://github.com/remix-run/react-router/pull/10344))
- Fix inadvertent re-renders when using `Component` instead of `element` on a route definition ([#10287](https://github.com/remix-run/react-router/pull/10287))
- Fail gracefully on `<Link to="//">` and other invalid URL values ([#10367](https://github.com/remix-run/react-router/pull/10367))
- Switched from `useSyncExternalStore` to `useState` for internal `@remix-run/router` router state syncing in `<RouterProvider>`. We found some [subtle bugs](https://codesandbox.io/s/use-sync-external-store-loop-9g7b81) where router state updates got propagated _before_ other normal `useState` updates, which could lead to foot guns in `useEffect` calls. ([#10377](https://github.com/remix-run/react-router/pull/10377), [#10409](https://github.com/remix-run/react-router/pull/10409))
- Log loader/action errors caught by the default error boundary to the console in dev for easier stack trace evaluation ([#10286](https://github.com/remix-run/react-router/pull/10286))
- Fix bug preventing rendering of descendant `<Routes>` when `RouterProvider` errors existed ([#10374](https://github.com/remix-run/react-router/pull/10374))
- Fix detection of `useNavigate` in the render cycle by setting the `activeRef` in a layout effect, allowing the `navigate` function to be passed to child components and called in a `useEffect` there ([#10394](https://github.com/remix-run/react-router/pull/10394))
- Allow `useRevalidator()` to resolve a loader-driven error boundary scenario ([#10369](https://github.com/remix-run/react-router/pull/10369))
- Enhance `LoaderFunction`/`ActionFunction` return type to prevent `undefined` from being a valid return value ([#10267](https://github.com/remix-run/react-router/pull/10267))
- Ensure proper 404 error on `fetcher.load` call to a route without a `loader` ([#10345](https://github.com/remix-run/react-router/pull/10345))
- Decouple `AbortController` usage between revalidating fetchers and the thing that triggered them such that the unmount/deletion of a revalidating fetcher doesn't impact the ongoing triggering navigation/revalidation ([#10271](https://github.com/remix-run/react-router/pull/10271))

**Full Changelog**: [`v6.10.0...v6.11.0`](https://github.com/remix-run/react-router/compare/react-router@6.10.0...react-router@6.11.0)

## v6.10.0

Date: 2023-03-29

### What's Changed

We recently published a post over on the Remix Blog titled ["Future Proofing Your Remix App"](https://remix.run/blog/future-flags) that goes through our strategy to ensure smooth upgrades for your Remix and React Router apps going forward. React Router `6.10.0` adds support for these flags (for data routers) which you can specify when you create your router:

```js
const router = createBrowserRouter(routes, {
  future: {
    // specify future flags here
  },
});
```

You can also check out the docs [here](https://reactrouter.com/en/dev/guides/api-development-strategy) and [here](https://reactrouter.com/en/dev/routers/create-browser-router#future).

### Minor Changes

#### `future.v7_normalizeFormMethod`

The first future flag being introduced is `future.v7_normalizeFormMethod` which will normalize the exposed `useNavigation()/useFetcher()` `formMethod` fields as uppercase HTTP methods to align with the `fetch()` (and some Remix) behavior. ([#10207](https://github.com/remix-run/react-router/pull/10207))

- When `future.v7_normalizeFormMethod` is unspecified or set to `false` (default v6 behavior),
  - `useNavigation().formMethod` is lowercase
  - `useFetcher().formMethod` is lowercase
- When `future.v7_normalizeFormMethod === true`:
  - `useNavigation().formMethod` is UPPERCASE
  - `useFetcher().formMethod` is UPPERCASE

### Patch Changes

- Fix `createStaticHandler` to also check for `ErrorBoundary` on routes in addition to `errorElement` ([#10190](https://github.com/remix-run/react-router/pull/10190))
- Fix route ID generation when using Fragments in `createRoutesFromElements` ([#10193](https://github.com/remix-run/react-router/pull/10193))
- Provide fetcher submission to `shouldRevalidate` if the fetcher action redirects ([#10208](https://github.com/remix-run/react-router/pull/10208))
- Properly handle `lazy()` errors during router initialization ([#10201](https://github.com/remix-run/react-router/pull/10201))
- Remove `instanceof` check for `DeferredData` to be resilient to ESM/CJS boundaries in SSR bundling scenarios ([#10247](https://github.com/remix-run/react-router/pull/10247))
- Update to latest `@remix-run/web-fetch@4.3.3` ([#10216](https://github.com/remix-run/react-router/pull/10216))

**Full Changelog**: [`v6.9.0...v6.10.0`](https://github.com/remix-run/react-router/compare/react-router@6.9.0...react-router@6.10.0)

## v6.9.0

Date: 2023-03-10

### What's Changed

#### `Component`/`ErrorBoundary` route properties

React Router now supports an alternative way to define your route `element` and `errorElement` fields as React Components instead of React Elements. You can instead pass a React Component to the new `Component` and `ErrorBoundary` fields if you choose. There is no functional difference between the two, so use whichever approach you prefer 😀. You shouldn't be defining both, but if you do `Component`/`ErrorBoundary` will "win"

**Example JSON Syntax**

```jsx
// Both of these work the same:
const elementRoutes = [{
  path: '/',
  element: <Home />,
  errorElement: <HomeError />,
}]

const componentRoutes = [{
  path: '/',
  Component: Home,
  ErrorBoundary: HomeError,
}]

function Home() { ... }
function HomeError() { ... }
```

**Example JSX Syntax**

```jsx
// Both of these work the same:
const elementRoutes = createRoutesFromElements(
  <Route path='/' element={<Home />} errorElement={<HomeError /> } />
);

const componentRoutes = createRoutesFromElements(
  <Route path='/' Component={Home} ErrorBoundary={HomeError} />
);

function Home() { ... }
function HomeError() { ... }
```

#### Introducing Lazy Route Modules

In order to keep your application bundles small and support code-splitting of your routes, we've introduced a new `lazy()` route property. This is an async function that resolves the non-route-matching portions of your route definition (`loader`, `action`, `element`/`Component`, `errorElement`/`ErrorBoundary`, `shouldRevalidate`, `handle`).

Lazy routes are resolved on initial load and during the `loading` or `submitting` phase of a navigation or fetcher call. You cannot lazily define route-matching properties (`path`, `index`, `children`) since we only execute your lazy route functions after we've matched known routes.

Your `lazy` functions will typically return the result of a dynamic import.

```jsx
// In this example, we assume most folks land on the homepage so we include that
// in our critical-path bundle, but then we lazily load modules for /a and /b so
// they don't load until the user navigates to those routes
let routes = createRoutesFromElements(
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="a" lazy={() => import("./a")} />
    <Route path="b" lazy={() => import("./b")} />
  </Route>
);
```

Then in your lazy route modules, export the properties you want defined for the route:

```jsx
export async function loader({ request }) {
  let data = await fetchData(request);
  return json(data);
}

// Export a `Component` directly instead of needing to create a React Element from it
export function Component() {
  let data = useLoaderData();

  return (
    <>
      <h1>You made it!</h1>
      <p>{data}</p>
    </>
  );
}

// Export an `ErrorBoundary` directly instead of needing to create a React Element from it
export function ErrorBoundary() {
  let error = useRouteError();
  return isRouteErrorResponse(error) ? (
    <h1>
      {error.status} {error.statusText}
    </h1>
  ) : (
    <h1>{error.message || error}</h1>
  );
}
```

An example of this in action can be found in the [`examples/lazy-loading-router-provider`](https://github.com/remix-run/react-router/tree/main/examples/lazy-loading-router-provider) directory of the repository. For more info, check out the [`lazy` docs](https://reactrouter.com/v6/route/lazy).

🙌 Huge thanks to @rossipedia for the [Initial Proposal](https://github.com/remix-run/react-router/discussions/9826) and [POC Implementation](https://github.com/remix-run/react-router/pull/9830).

### Minor Changes

- Add support for `route.Component`/`route.ErrorBoundary` properties ([#10045](https://github.com/remix-run/react-router/pull/10045))
- Add support for `route.lazy` ([#10045](https://github.com/remix-run/react-router/pull/10045))

### Patch Changes

- Improve memoization for context providers to avoid unnecessary re-renders ([#9983](https://github.com/remix-run/react-router/pull/9983))
- Fix `generatePath` incorrectly applying parameters in some cases ([#10078](https://github.com/remix-run/react-router/pull/10078))
- `[react-router-dom-v5-compat]` Add missed data router API re-exports ([#10171](https://github.com/remix-run/react-router/pull/10171))

**Full Changelog**: [`v6.8.2...v6.9.0`](https://github.com/remix-run/react-router/compare/react-router@6.8.2...react-router@6.9.0)

## v6.8.2

Date: 2023-02-27

### Patch Changes

- Treat same-origin absolute URLs in `<Link to>` as external if they are outside of the router `basename` ([#10135](https://github.com/remix-run/react-router/pull/10135))
- Correctly perform a hard redirect for same-origin absolute URLs outside of the router `basename` ([#10076](https://github.com/remix-run/react-router/pull/10076))
- Fix SSR of absolute `<Link to>` urls ([#10112](https://github.com/remix-run/react-router/pull/10112))
- Properly escape HTML characters in `StaticRouterProvider` serialized hydration data ([#10068](https://github.com/remix-run/react-router/pull/10068))
- Fix `useBlocker` to return `IDLE_BLOCKER` during SSR ([#10046](https://github.com/remix-run/react-router/pull/10046))
- Ensure status code and headers are maintained for `defer` loader responses in `createStaticHandler`'s `query()` method ([#10077](https://github.com/remix-run/react-router/pull/10077))
- Change `invariant` to an `UNSAFE_invariant` export since it's only intended for internal use ([#10066](https://github.com/remix-run/react-router/pull/10066))

**Full Changelog**: [`v6.8.1...v6.8.2`](https://github.com/remix-run/react-router/compare/react-router@6.8.1...react-router@6.8.2)

## v6.8.1

Date: 2023-02-06

### Patch Changes

- Remove inaccurate console warning for POP navigations and update active blocker logic ([#10030](https://github.com/remix-run/react-router/pull/10030))
- Only check for differing origin on absolute URL redirects ([#10033](https://github.com/remix-run/react-router/pull/10033))
- Improved absolute url detection in `Link` component (now also supports `mailto:` urls) ([#9994](https://github.com/remix-run/react-router/pull/9994))
- Fix partial object (search or hash only) pathnames losing current path value ([#10029](https://github.com/remix-run/react-router/pull/10029))

**Full Changelog**: [`v6.8.0...v6.8.1`](https://github.com/remix-run/react-router/compare/react-router@6.8.0...react-router@6.8.1)

## v6.8.0

Date: 2023-01-26

### Minor Changes

Support absolute URLs in `<Link to>`. If the URL is for the current origin, it will still do a client-side navigation. If the URL is for a different origin then it will do a fresh document request for the new origin. ([#9900](https://github.com/remix-run/react-router/pull/9900))

```tsx
<Link to="https://neworigin.com/some/path">    {/* Document request */}
<Link to="//neworigin.com/some/path">          {/* Document request */}
<Link to="https://www.currentorigin.com/path"> {/* Client-side navigation */}
```

### Patch Changes

- Fixes 2 separate issues for revalidating fetcher `shouldRevalidate` calls ([#9948](https://github.com/remix-run/react-router/pull/9948))
  - The `shouldRevalidate` function was only being called for _explicit_ revalidation scenarios (after a mutation, manual `useRevalidator` call, or an `X-Remix-Revalidate` header used for cookie setting in Remix). It was not properly being called on _implicit_ revalidation scenarios that also apply to navigation `loader` revalidation, such as a change in search params or clicking a link for the page we're already on. It's now correctly called in those additional scenarios.
  - The parameters being passed were incorrect and inconsistent with one another since the `current*`/`next*` parameters reflected the static `fetcher.load` URL (and thus were identical). Instead, they should have reflected the navigation that triggered the revalidation (as the `form*` parameters did). These parameters now correctly reflect the triggering navigation.
- Fix bug with search params removal via `useSearchParams` ([#9969](https://github.com/remix-run/react-router/pull/9969))
- Respect `preventScrollReset` on `<fetcher.Form>` ([#9963](https://github.com/remix-run/react-router/pull/9963))
- Fix navigation for hash routers on manual URL changes ([#9980](https://github.com/remix-run/react-router/pull/9980))
- Use `pagehide` instead of `beforeunload` for `<ScrollRestoration>`. This has better cross-browser support, specifically on Mobile Safari. ([#9945](https://github.com/remix-run/react-router/pull/9945))
- Do not short circuit on hash change only mutation submissions ([#9944](https://github.com/remix-run/react-router/pull/9944))
- Remove `instanceof` check from `isRouteErrorResponse` to avoid bundling issues on the server ([#9930](https://github.com/remix-run/react-router/pull/9930))
- Detect when a `defer` call only contains critical data and remove the `AbortController` ([#9965](https://github.com/remix-run/react-router/pull/9965))
- Send the name as the value when url-encoding `File` `FormData` entries ([#9867](https://github.com/remix-run/react-router/pull/9867))
- `react-router-dom-v5-compat` - Fix SSR `useLayoutEffect` `console.error` when using `CompatRouter` ([#9820](https://github.com/remix-run/react-router/pull/9820))

**Full Changelog**: [`v6.7.0...v6.8.0`](https://github.com/remix-run/react-router/compare/react-router@6.7.0...react-router@6.8.0)

## v6.7.0

Date: 2023-01-18

### Minor Changes

- Add `unstable_useBlocker`/`unstable_usePrompt` hooks for blocking navigations within the app's location origin ([#9709](https://github.com/remix-run/react-router/pull/9709), [#9932](https://github.com/remix-run/react-router/pull/9932))
- Add `preventScrollReset` prop to `<Form>` ([#9886](https://github.com/remix-run/react-router/pull/9886))

### Patch Changes

- Added pass-through event listener options argument to `useBeforeUnload` ([#9709](https://github.com/remix-run/react-router/pull/9709))
- Fix `generatePath` when optional params are present ([#9764](https://github.com/remix-run/react-router/pull/9764))
- Update `<Await>` to accept `ReactNode` as children function return result ([#9896](https://github.com/remix-run/react-router/pull/9896))
- Improved absolute redirect url detection in actions/loaders ([#9829](https://github.com/remix-run/react-router/pull/9829))
- Fix URL creation with memory histories ([#9814](https://github.com/remix-run/react-router/pull/9814))
- Fix scroll reset if a submission redirects ([#9886](https://github.com/remix-run/react-router/pull/9886))
- Fix 404 bug with same-origin absolute redirects ([#9913](https://github.com/remix-run/react-router/pull/9913))
- Streamline `jsdom` bug workaround in tests ([#9824](https://github.com/remix-run/react-router/pull/9824))

**Full Changelog**: [`v6.6.2...v6.7.0`](https://github.com/remix-run/react-router/compare/react-router@6.6.2...react-router@6.7.0)

## v6.6.2

Date: 2023-01-09

### Patch Changes

- Ensure `useId` consistency during SSR ([#9805](https://github.com/remix-run/react-router/pull/9805))

**Full Changelog**: [`v6.6.1...v6.6.2`](https://github.com/remix-run/react-router/compare/react-router@6.6.1...react-router@6.6.2)

## v6.6.1

Date: 2022-12-23

### Patch Changes

- Include submission info in `shouldRevalidate` on action redirects ([#9777](https://github.com/remix-run/react-router/pull/9777), [#9782](https://github.com/remix-run/react-router/pull/9782))
- Reset `actionData` on action redirect to current location ([#9772](https://github.com/remix-run/react-router/pull/9772))

**Full Changelog**: [`v6.6.0...v6.6.1`](https://github.com/remix-run/react-router/compare/react-router@6.6.0...react-router@6.6.1)

## v6.6.0

Date: 2022-12-21

### What's Changed

This minor release is primarily to stabilize our SSR APIs for Data Routers now that we've wired up the new `RouterProvider` in Remix as part of the [React Router-ing Remix](https://remix.run/blog/react-routering-remix) work.

### Minor Changes

- Remove `unstable_` prefix from `createStaticHandler`/`createStaticRouter`/`StaticRouterProvider` ([#9738](https://github.com/remix-run/react-router/pull/9738))
- Add `useBeforeUnload()` hook ([#9664](https://github.com/remix-run/react-router/pull/9664))

### Patch Changes

- Support uppercase `<Form method>` and `useSubmit` method values ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Fix `<button formmethod>` form submission overriddes ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Fix explicit `replace` on submissions and `PUSH` on submission to new paths ([#9734](https://github.com/remix-run/react-router/pull/9734))
- Prevent `useLoaderData` usage in `errorElement` ([#9735](https://github.com/remix-run/react-router/pull/9735))
- Proper hydration of `Error` objects from `StaticRouterProvider` ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Skip initial scroll restoration for SSR apps with `hydrationData` ([#9664](https://github.com/remix-run/react-router/pull/9664))
- Fix a few bugs where loader/action data wasn't properly cleared on errors ([#9735](https://github.com/remix-run/react-router/pull/9735))

**Full Changelog**: [`v6.5.0...v6.6.0`](https://github.com/remix-run/react-router/compare/react-router@6.5.0...react-router@6.6.0)

## v6.5.0

Date: 2022-12-16

### What's Changed

This release introduces support for [Optional Route Segments](https://github.com/remix-run/react-router/issues/9546). Now, adding a `?` to the end of any path segment will make that entire segment optional. This works for both static segments and dynamic parameters.

**Optional Params Examples**

- `<Route path=":lang?/about>` will match:
  - `/:lang/about`
  - `/about`
- `<Route path="/multistep/:widget1?/widget2?/widget3?">` will match:
  - `/multistep`
  - `/multistep/:widget1`
  - `/multistep/:widget1/:widget2`
  - `/multistep/:widget1/:widget2/:widget3`

**Optional Static Segment Example**

- `<Route path="/home?">` will match:
  - `/`
  - `/home`
- `<Route path="/fr?/about">` will match:
  - `/about`
  - `/fr/about`

### Minor Changes

- Allows optional routes and optional static segments ([#9650](https://github.com/remix-run/react-router/pull/9650))

### Patch Changes

- Stop incorrectly matching on partial named parameters, i.e. `<Route path="prefix-:param">`, to align with how splat parameters work. If you were previously relying on this behavior then it's recommended to extract the static portion of the path at the `useParams` call site: ([#9506](https://github.com/remix-run/react-router/pull/9506))

```jsx
// Old behavior at URL /prefix-123
<Route path="prefix-:id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: '123' }
  let id = params.id; // "123"
  ...
}

// New behavior at URL /prefix-123
<Route path=":id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: 'prefix-123' }
  let id = params.id.replace(/^prefix-/, ''); // "123"
  ...
}
```

- Persist `headers` on `loader` `request`'s after SSR document `action` request ([#9721](https://github.com/remix-run/react-router/pull/9721))
- Fix requests sent to revalidating loaders so they reflect a GET request ([#9660](https://github.com/remix-run/react-router/pull/9660))
- Fix issue with deeply nested optional segments ([#9727](https://github.com/remix-run/react-router/pull/9727))
- GET forms now expose a submission on the loading navigation ([#9695](https://github.com/remix-run/react-router/pull/9695))
- Fix error boundary tracking for multiple errors bubbling to the same boundary ([#9702](https://github.com/remix-run/react-router/pull/9702))

**Full Changelog**: [`v6.4.5...v6.5.0`](https://github.com/remix-run/react-router/compare/react-router@6.4.5...react-router@6.5.0)

## v6.4.5

Date: 2022-12-07

### Patch Changes

- Fix requests sent to revalidating loaders so they reflect a `GET` request ([#9680](https://github.com/remix-run/react-router/pull/9680))
- Remove `instanceof Response` checks in favor of `isResponse` ([#9690](https://github.com/remix-run/react-router/pull/9690))
- Fix `URL` creation in Cloudflare Pages or other non-browser-environments ([#9682](https://github.com/remix-run/react-router/pull/9682), [#9689](https://github.com/remix-run/react-router/pull/9689))
- Add `requestContext` support to static handler `query`/`queryRoute` ([#9696](https://github.com/remix-run/react-router/pull/9696))
  - Note that the unstable API of `queryRoute(path, routeId)` has been changed to `queryRoute(path, { routeId, requestContext })`

**Full Changelog**: [`v6.4.4...v6.4.5`](https://github.com/remix-run/react-router/compare/react-router@6.4.4...react-router@6.4.5)

## v6.4.4

Date: 2022-11-30

### Patch Changes

- Throw an error if an `action`/`loader` function returns `undefined` as revalidations need to know whether the loader has previously been executed. `undefined` also causes issues during SSR stringification for hydration. You should always ensure your `loader`/`action` returns a value, and you may return `null` if you don't wish to return anything. ([#9511](https://github.com/remix-run/react-router/pull/9511))
- Properly handle redirects to external domains ([#9590](https://github.com/remix-run/react-router/pull/9590), [#9654](https://github.com/remix-run/react-router/pull/9654))
- Preserve the HTTP method on 307/308 redirects ([#9597](https://github.com/remix-run/react-router/pull/9597))
- Support `basename` in static data routers ([#9591](https://github.com/remix-run/react-router/pull/9591))
- Enhanced `ErrorResponse` bodies to contain more descriptive text in internal 403/404/405 scenarios
- Fix issues with encoded characters in `NavLink` and descendant `<Routes>` ([#9589](https://github.com/remix-run/react-router/pull/9589), [#9647](https://github.com/remix-run/react-router/pull/9647))
- Properly serialize/deserialize `ErrorResponse` instances when using built-in hydration ([#9593](https://github.com/remix-run/react-router/pull/9593))
- Support `basename` in static data routers ([#9591](https://github.com/remix-run/react-router/pull/9591))
- Updated dependencies:
  - `@remix-run/router@1.0.4`
  - `react-router@6.4.4`

**Full Changelog**: [`v6.4.3...v6.4.4`](https://github.com/remix-run/react-router/compare/react-router-dom@6.4.3...react-router-dom@6.4.4)

## v6.4.3

Date: 2022-11-01

### Patch Changes

- Generate correct `<a href>` values when using `createHashRouter` ([#9409](https://github.com/remix-run/react-router/pull/9409))
- Better handle encoding/matching with special characters in URLs and route paths ([#9477](https://github.com/remix-run/react-router/pull/9477), [#9496](https://github.com/remix-run/react-router/pull/9496))
- Generate correct `formAction` pathnames when an `index` route also has a `path` ([#9486](https://github.com/remix-run/react-router/pull/9486))
- Respect `relative=path` prop on `NavLink` ([#9453](https://github.com/remix-run/react-router/pull/9453))
- Fix `NavLink` behavior for root urls ([#9497](https://github.com/remix-run/react-router/pull/9497))
- `useRoutes` should be able to return `null` when passing `locationArg` ([#9485](https://github.com/remix-run/react-router/pull/9485))
- Fix `initialEntries` type in `createMemoryRouter` ([#9498](https://github.com/remix-run/react-router/pull/9498))
- Support `basename` and relative routing in `loader`/`action` redirects ([#9447](https://github.com/remix-run/react-router/pull/9447))
- Ignore pathless layout routes when looking for proper submission `action` function ([#9455](https://github.com/remix-run/react-router/pull/9455))
- Add UMD build for `@remix-run/router` ([#9446](https://github.com/remix-run/react-router/pull/9446))
- Fix `createURL` in local file execution in Firefox ([#9464](https://github.com/remix-run/react-router/pull/9464))

**Full Changelog**: [`v6.4.2...v6.4.3`](https://github.com/remix-run/react-router/compare/react-router@6.4.2...react-router@6.4.3)

## v6.4.2

Date: 2022-10-06

### Patch Changes

- Respect `basename` in `useFormAction` ([#9352](https://github.com/remix-run/react-router/pull/9352))
- Fix `IndexRouteObject` and `NonIndexRouteObject` types to make `hasErrorElement` optional ([#9394](https://github.com/remix-run/react-router/pull/9394))
- Enhance console error messages for invalid usage of data router hooks ([#9311](https://github.com/remix-run/react-router/pull/9311))
- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))

**Full Changelog**: [`v6.4.1...v6.4.2`](https://github.com/remix-run/react-router/compare/react-router@6.4.1...react-router@6.4.2)

## v6.4.1

Date: 2022-09-22

### Patch Changes

- Preserve state from `initialEntries` ([#9288](https://github.com/remix-run/react-router/pull/9288))
- Preserve `?index` for fetcher get submissions to index routes ([#9312](https://github.com/remix-run/react-router/pull/9312))

**Full Changelog**: [`v6.4.0...v6.4.1`](https://github.com/remix-run/react-router/compare/react-router@6.4.0...react-router@6.4.1)

## v6.4.0

Date: 2022-09-13

### What's Changed

#### Remix Data APIs

Whoa this is a big one! `6.4.0` brings all the data loading and mutation APIs over from Remix. Here's a quick high level overview, but it's recommended you go check out the [docs](https://reactrouter.com/), especially the [feature overview](https://reactrouter.com/en/6.4.0/start/overview) and the [tutorial](https://reactrouter.com/en/6.4.0/start/tutorial).

**New `react-router` APIs**

- Create your router with `createMemoryRouter`
- Render your router with `<RouterProvider>`
- Load data with a Route `loader` and mutate with a Route `action`
- Handle errors with Route `errorElement`
- Defer non-critical data with `defer` and `Await`

**New `react-router-dom` APIs**

- Create your router with `createBrowserRouter`/`createHashRouter`
- Submit data with the new `<Form>` component
- Perform in-page data loads and mutations with `useFetcher()`
- Defer non-critical data with `defer` and `Await`
- Manage scroll position with `<ScrollRestoration>`
- Perform path-relative navigations with `<Link relative="path">` ([#9160](https://github.com/remix-run/react-router/pull/9160))

### Patch Changes

- Path resolution is now trailing slash agnostic ([#8861](https://github.com/remix-run/react-router/pull/8861))
- `useLocation` returns the scoped location inside a `<Routes location>` component ([#9094](https://github.com/remix-run/react-router/pull/9094))
- Respect the `<Link replace>` prop if it is defined ([#8779](https://github.com/remix-run/react-router/pull/8779))

**Full Changelog**: [`v6.3.0...v6.4.0`](https://github.com/remix-run/react-router/compare/v6.3.0...react-router%406.4.0)

## v6.3.0

Date: 2022-03-31

### Minor Changes

- Added the v5 to v6 backwards compatibility package 💜 ([#8752](https://github.com/remix-run/react-router/pull/8752)). The official guide can be found [in this discussion](https://github.com/remix-run/react-router/discussions/8753)

**Full Changelog**: [`v6.2.2...v6.3.0`](https://github.com/remix-run/react-router/compare/v6.2.2...v6.3.0)

## v6.2.2

Date: 2022-02-28

### Patch Changes

- Fixed nested splat routes that begin with special URL-safe characters ([#8563](https://github.com/remix-run/react-router/pull/8563))
- Fixed a bug where index routes were missing route context in some cases ([#8497](https://github.com/remix-run/react-router/pull/8497))

**Full Changelog**: [`v6.2.1...v6.2.2`](https://github.com/remix-run/react-router/compare/v6.2.1...v6.2.2)

## v6.2.1

Date: 2021-12-17

### Patch Changes

- This release updates the internal `history` dependency to `5.2.0`.

**Full Changelog**: [`v6.2.0...v6.2.1`](https://github.com/remix-run/react-router/compare/v6.2.0...v6.2.1)

## v6.2.0

Date: 2021-12-17

### Minor Changes

- We now use statically analyzable CJS exports. This enables named imports in Node ESM scripts ([See the commit](https://github.com/remix-run/react-router/commit/29c7fc8b5f853b0b06ecd0f5682a9bbe6eca0715)).

### Patch Changes

- Fixed the `RouteProps` `element` type, which should be a `ReactNode` ([#8473](https://github.com/remix-run/react-router/pull/8473))
- Fixed a bug with `useOutlet` for top-level routes ([#8483](https://github.com/remix-run/react-router/pull/8483))

**Full Changelog**: [`v6.1.1...v6.2.0`](https://github.com/remix-run/react-router/compare/v6.1.1...v6.2.0)

## v6.1.1

Date: 2021-12-11

### Patch Changes

- In v6.1.0 we inadvertently shipped a new, undocumented API that will likely introduce bugs ([#7586](https://github.com/remix-run/react-router/pull/7586)). We have flagged `HistoryRouter` as `unstable_HistoryRouter`, as this API will likely need to change before a new major release.

**Full Changelog**: [`v6.1.0...v6.1.1`](https://github.com/remix-run/react-router/compare/v6.1.0...v6.1.1)

## v6.1.0

Date: 2021-12-10

### Minor Changes

- `<Outlet>` can now receive a `context` prop. This value is passed to child routes and is accessible via the new `useOutletContext` hook. See [the API docs](https://reactrouter.com/docs/en/v6/api#useoutletcontext) for details. ([#8461](https://github.com/remix-run/react-router/pull/8461))
- `<NavLink>` can now receive a child function for access to its props. ([#8164](https://github.com/remix-run/react-router/pull/8164))
- Improved TypeScript signature for `useMatch` and `matchPath`. For example, when you call `useMatch("foo/:bar/:baz")`, the path is parsed and the return type will be `PathMatch<"bar" | "baz">`. ([#8030](https://github.com/remix-run/react-router/pull/8030))

### Patch Changes

- Fixed a bug that broke support for base64 encoded IDs on nested routes ([#8291](https://github.com/remix-run/react-router/pull/8291))
- A few error message improvements ([#8202](https://github.com/remix-run/react-router/pull/8202))

**Full Changelog**: [`v6.0.2...v6.1.0`](https://github.com/remix-run/react-router/compare/v6.0.2...v6.1.0)

## v6.0.2

Date: 2021-11-09

### Patch Changes

- Added the `reloadDocument` prop to `<Link>`. This allows `<Link>` to function like a normal anchor tag by reloading the document after navigation while maintaining the relative `to` resolution ([#8283](https://github.com/remix-run/react-router/pull/8283))

**Full Changelog**: [`v6.0.1...v6.0.2`](https://github.com/remix-run/react-router/compare/v6.0.1...v6.0.2)

## v6.0.1

Date: 2021-11-05

### Patch Changes

- Add a default `<StaticRouter location>` value ([#8243](https://github.com/remix-run/react-router/pull/8243))
- Add invariant for using `<Route>` inside `<Routes>` to help people make the change ([#8238](https://github.com/remix-run/react-router/pull/8238))

**Full Changelog**: [`v6.0.0...v6.0.1`](https://github.com/remix-run/react-router/compare/v6.0.0...v6.0.1)

## v6.0.0

Date: 2021-11-03

React Router v6 is here!

Please go read [our blog post for more information on all the great stuff in v6](https://remix.run/blog/react-router-v6) including [notes about how to upgrade from React Router v5](https://remix.run/blog/react-router-v6#upgrading-to-react-router-v6) and Reach Router.
