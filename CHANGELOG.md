<!-- markdownlint-disable no-duplicate-header no-emphasis-as-heading no-inline-html -->

# React Router Releases

This page lists all releases/release notes for React Router back to `v7.0.0`.

- For v6.x releases, please refer to the [v6](https://github.com/remix-run/react-router/blob/v6/CHANGELOG.md) branch
- For releases prior to v6, please refer to the [Github Releases Page](https://github.com/remix-run/react-router/releases)

We manage release notes in this file instead of the paginated Github Releases Page for 2 reasons:

- Pagination in the Github UI means that you cannot easily search release notes for a large span of releases at once
- The paginated Github interface also cuts off longer releases notes without indication in list view, and you need to click into the detail view to see the full set of release notes

<details>
  <summary>Table of Contents</summary>

- [React Router Releases](#react-router-releases)
  - [v8.1.0](#v810)
    - [Agent Skills Installation via `create-react-router`](#agent-skills-installation-via-create-react-router)
    - [Observability Metadata](#observability-metadata)
  - [v8.0.1](#v801)
  - [v8.0.0](#v800)
    - [Baseline Support](#baseline-support)
    - [Adopted Future Flag Behavior](#adopted-future-flag-behavior)
    - [Removed `react-router-dom`](#removed-react-router-dom)
    - [Removed deprecated `meta` `data` fields](#removed-deprecated-meta-data-fields)
    - [Cloudflare Vite Plugin](#cloudflare-vite-plugin)
    - [`@react-router/architect` `useRequestContextDomainName`](#react-routerarchitect-userequestcontextdomainname)
    - [Pre-rendering Flow](#pre-rendering-flow)
- [React Router v7 Releases](#react-router-v7-releases)
  - [v7.18.0](#v7180)
    - [CSRF Check Logic Fix](#csrf-check-logic-fix)
  - [v7.17.0](#v7170)
  - [v7.16.0](#v7160)
  - [v7.15.1](#v7151)
  - [v7.15.0](#v7150)
    - [Stabilizations](#stabilizations)
    - [Route matching optimizations](#route-matching-optimizations)
  - [v7.14.2](#v7142)
  - [v7.14.1](#v7141)
  - [v7.14.0](#v7140)
  - [v7.13.2](#v7132)
    - [Pass-through Requests (unstable)](#pass-through-requests-unstable)
    - [Route handlers/middleware `unstable_url` parameter](#route-handlersmiddleware-unstable_url-parameter)
  - [v7.13.1](#v7131)
    - [URL Masking (unstable)](#url-masking-unstable)
  - [v7.13.0](#v7130)
  - [v7.12.0](#v7120)
  - [v7.11.0](#v7110)
    - [`vite preview` Support](#vite-preview-support)
    - [Stabilized Client-side `onError`](#stabilized-client-side-onerror)
    - [Call-site Revalidation Opt-out (unstable)](#call-site-revalidation-opt-out-unstable)
  - [v7.10.1](#v7101)
  - [v7.10.0](#v7100)
    - [Stabilized `future.v8_splitRouteModules`](#stabilized-futurev8_splitroutemodules)
    - [Stabilized `future.v8_viteEnvironmentApi`](#stabilized-futurev8_viteenvironmentapi)
    - [Stabilized `fetcher.reset()`](#stabilized-fetcherreset)
    - [Stabilized `DataStrategyMatch.shouldCallHandler()`](#stabilized-datastrategymatchshouldcallhandler)
  - [v7.9.6](#v796)
  - [v7.9.5](#v795)
    - [Instrumentation (unstable)](#instrumentation-unstable)
  - [v7.9.4](#v794)
    - [`useRoute()` (unstable)](#useroute-unstable)
  - [v7.9.3](#v793)
  - [v7.9.2](#v792)
    - [RSC Framework Mode (unstable)](#rsc-framework-mode-unstable)
    - [Fetcher Reset (unstable)](#fetcher-reset-unstable)
  - [v7.9.1](#v791)
  - [v7.9.0](#v790)
    - [Stable Middleware and Context APIs](#stable-middleware-and-context-apis)
  - [v7.8.2](#v782)
  - [v7.8.1](#v781)
  - [v7.8.0](#v780)
    - [Consistently named `loaderData` values](#consistently-named-loaderdata-values)
    - [Improvements/fixes to the middleware APIs (unstable)](#improvementsfixes-to-the-middleware-apis-unstable)
  - [v7.7.1](#v771)
  - [v7.7.0](#v770)
    - [Unstable RSC APIs](#unstable-rsc-apis)
  - [v7.6.3](#v763)
  - [v7.6.2](#v762)
  - [v7.6.1](#v761)
  - [v7.6.0](#v760)
    - [`routeDiscovery` Config Option](#routediscovery-config-option)
    - [Automatic Types for Future Flags](#automatic-types-for-future-flags)
  - [v7.5.3](#v753)
  - [v7.5.2](#v752)
  - [v7.5.1](#v751)
  - [v7.5.0](#v750)
    - [`route.lazy` Object API](#routelazy-object-api)
  - [v7.4.1](#v741)
  - [v7.4.0](#v740)
  - [v7.3.0](#v730)
  - [v7.2.0](#v720)
    - [Type-safe `href` utility](#type-safe-href-utility)
    - [Prerendering with a SPA Fallback](#prerendering-with-a-spa-fallback)
    - [Allow a root `loader` in SPA Mode](#allow-a-root-loader-in-spa-mode)
  - [v7.1.5](#v715)
  - [v7.1.4](#v714)
  - [v7.1.3](#v713)
  - [v7.1.2](#v712)
  - [v7.1.1](#v711)
  - [v7.1.0](#v710)
  - [v7.0.2](#v702)
  - [v7.0.1](#v701)
  - [v7.0.0](#v700)

</details>

## v8.1.0

Date: 2026-06-29

### What's Changed

#### Agent Skills Installation via `create-react-router`

`create-react-router` can now setup the React Router [Agent Skill](https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router) in your new project. Interactive shells will issue a prompt on whether to include the skills, and they will be included by default with when running with `--yes` or in non-interactive shells. You can skip the skill addition with the `--no-agent-skills` CLI flag.

#### Observability Metadata

The Instrumentation APIs `info` parameter usually corresponds roughly to the inputs to the thing being instrumented (`handler`, `loader`, etc.). For route level instrumentations such as loaders, this contains useful information like the `pattern` (i.e., `/blog/:slug`) that allows you to report information that is easily aggregated by pattern, instead of having to manually deduce one from the request url.

However, for outer layers such as the `handler` or a router `navigate` call - we can't provide a `pattern` because we haven't yet done any route matching, so it wasn't easy to report at those levels based on a generic route pattern.

The internal instrumentation results now contain relevant metadata in `result.meta` for these outer instrumentation layers. For server `handler` instrumentations, we also expose the `statusCode` of the outgoing HTTP response:

```ts
export const instrumentations = [
  {
    handler(handler) {
      handler.instrument({
        async request(handleRequest) {
          let result = await handleRequest();

          // Available to server `handler`, and router `navigate`/`fetch` instrumentations
          let normalizedUrl = result.meta?.url;
          let routePattern = result.meta?.pattern;
          let routeParams = result.meta?.params;

          // Available to server `handler` only
          let statusCode = result.statusCode;
        },
      });
    },
  },
];
```

Please see the [docs](https://reactrouter.com/how-to/instrumentation#result-metadata) for more information.

### Minor Changes

- `react-router` - Return route metadata from server request, client navigation, and client fetcher instrumentations ([#15235](https://github.com/remix-run/react-router/pull/15235))
  - Adds result metadata after instrumented calls complete, including the URL, matched route pattern, and params
  - Adds known HTTP status codes to server request handler instrumentation results
- `create-react-router` - Add a default-on CLI option to include the official React Router agent skill in generated projects ([#15213](https://github.com/remix-run/react-router/pull/15213))
  - New projects include `.agents/skills/react-router` by default when running with `--yes` or in non-interactive shells
  - Interactive runs prompt to include the skill, defaulting to yes
  - Use `--no-agent-skills` to skip copying the skill

### Patch Changes

- `@react-router/dev` - Fix a regression with the new prerendering plugin where the `react-router.config.ts` `buildEnd` hook would run before prerendering was completed ([#15211](https://github.com/remix-run/react-router/pull/15211))
- `@react-router/dev` - Fixed `react-router typegen` crashes under the Bun runtime when Babel default imports are already unwrapped ([#15214](https://github.com/remix-run/react-router/pull/15214))
- `@react-router/dev` - Replace the deprecated `envFile:false` Vite config with `envDir:false` to eliminate a deprecation warning when using vite@8.1.0+ ([#15230](https://github.com/remix-run/react-router/pull/15230))
- `@react-router/dev` - Only add the `"node"` Vite server condition for Framework mode apps that declare a Node server adapter dependency ([#15242](https://github.com/remix-run/react-router/pull/15242))
  - This prevents non-Node SSR runtimes from resolving Node-specific package exports by default
- `@react-router/serve` - Use Node's built-in networking APIs to find an available port and remove the `get-port` dependency ([#15239](https://github.com/remix-run/react-router/pull/15239))
- `create-react-router` - Use Node's built-in utilities for CLI argument parsing, ANSI-stripping, and child process execution to remove the `arg`, `strip-ansi`, and `execa` dependencies ([#15231](https://github.com/remix-run/react-router/pull/15231))

**Full Changelog**: [`v8.0.1...v8.1.0`](https://github.com/remix-run/react-router/compare/react-router@8.0.1...react-router@8.1.0)

## v8.0.1

Date: 2026-06-18

### Patch Changes

- `react-router` - Remove the obsolete `AppLoadContext` type export accidentally left over from v7 now that middleware is always enabled and server request context is provided through `RouterContextProvider`. ([#15207](https://github.com/remix-run/react-router/pull/15207))

**Full Changelog**: [`v8.0.0...v8.0.1`](https://github.com/remix-run/react-router/compare/react-router@8.0.0...react-router@8.0.1)

## v8.0.0

Date: 2026-06-17

### What's Changed

React Router v8 is here!

We introduced a new [Open Governance](https://remix.run/blog/rr-governance) model last year and this marks the first major release on our new planned yearly major release cadence. We chose the June timeframe this year to align with the EOL timeframe for Node 20. Node 22 is [scheduled](https://nodejs.org/en/about/previous-releases) to reach EOL in the May 2027 timeframe so we'll be aiming for a v9 release around the same time next year.

Our [API Development Strategy](https://reactrouter.com/community/api-development-strategy) aims to make major releases relatively boring by introducing breaking changes ahead of time behind [Future Flags](https://reactrouter.com/upgrading/v7). If you've adopted all active future flags in v7, then from a React Router API surface you're in good shape for v8. All `future.v8_*` flags have been removed (or lifted to a top-level config) and their behaviors are now the default.

#### Baseline Support

React Router v8 updates the following minimum supported versions:

- Node 22.22.0+
  - Starting with v8, React Router will officially support all Active LTS node versions and only the **latest** minor branch of Maintenance LTS versions
  - This better allows us to bump minimum Maintenance LTS versions to account for newly released security patches
  - It also allows us to more quickly and easily adopt new Active LTS features backported to Maintenance LTS lines
  - Upgraded minimum Maintenance LTS versions will be done in React Router minor releases
- React 19.2.7+
- Vite 7+

To modernize the library, React Router is now published as an ESM-only module and tsconfig `target`/`lib` fields have been updated to ES2022 across the board

#### Adopted Future Flag Behavior

The following v8 future flags have been removed and their behaviors are now the default:

- `future.v8_trailingSlashAwareDataRequests`
- `future.v8_passThroughRequests`
- `future.v8_middleware`
- `future.v8_viteEnvironmentApi`
- `future.v8_splitRouteModules` has been moved to a to a top-level `splitRouteModules` config option and is enabled by default

#### Removed `react-router-dom`

In v7, we collapsed the DOM APIs into `react-router/dom`, but to ease the v6->v7 upgrade we continued re-exporting everything through `react-router-dom`. We have now dropped `react-router-dom`, so if you didn't get around to swapping your imports in v7, you will need to swap them to `react-router` and `react-router/dom` for v8.

#### Removed deprecated `meta` `data` fields

The `data` fields passed to route module `meta` functions were deprecated in v7 and are remove din v8. Use `loaderData` instead of `data` on `MetaArgs` and each item in `MetaArgs.matches`.

#### Cloudflare Vite Plugin

The React Router Cloudflare dev proxy (`@react-router/dev/vite/cloudflare`) has been removed in v8. Cloudflare projects should use [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/) instead.

#### `@react-router/architect` `useRequestContextDomainName`

The `@react-router/architect` `createRequestHandler` `useRequestContextDomainName` option has been removed as that is now the default behavior in v8.

#### Pre-rendering Flow

In v7 we had a `future.unstable_previewServerPrerendering` flag that would opt you into a new pre-rendering flow using the Vite preview server (leveraging the Vite environment API). Now that the Vite environment API is always available on our new Vite 7+ baseline, we dropped this flag and the preview server flow has replaced our old pre-rendering implementation. It _should_ be a non-breaking change but if you see issues, please let us know!

### Major Changes

- `react-router` - Update minimum Node version to 22.22.0 ([#14928](https://github.com/remix-run/react-router/pull/14928))
- `react-router` - Update minimum React version to 19.2.7 ([#15062](https://github.com/remix-run/react-router/pull/15062))
- `react-router` - Remove the `future.v8_trailingSlashAwareDataRequests` flag ([#15100](https://github.com/remix-run/react-router/pull/15100))
  - Trailing slash-aware data request URLs are now the default behavior.
- `react-router` - Remove `future.v8_passThroughRequests` flag - the raw incoming `request` is now always passed through to `loader`/`action`. Use `url` for the normalized URL without React Router-specific implementation details (`.data` suffixes, `index`/`_routes` search params). ([#15079](https://github.com/remix-run/react-router/pull/15079))
- `react-router` - Remove `future.v8_middleware` flag — middleware is always enabled in v8 ([#15078](https://github.com/remix-run/react-router/pull/15078))
  - The `future.v8_middleware` flag has been removed; middleware is now always enabled
  - The `context` parameter passed to `loader`, `action`, and `middleware` functions is always a `RouterContextProvider` instance
  - `getLoadContext` functions in custom servers must return a `RouterContextProvider` — returning a plain object is no longer supported
  - The `MiddlewareEnabled` type (previously exported as `UNSAFE_MiddlewareEnabled`) has been removed since the conditional it gated is now unconditional
  - The `Future` module augmentation pattern (`interface Future { v8_middleware: true }`) is no longer needed to type `context` in Data Mode
- `react-router` - Remove `future.v8_passThroughRequests` flag - the raw incoming `request` is now always passed through to `loader`/`action`. ([#15079](https://github.com/remix-run/react-router/pull/15079))
- `react-router` - Move `future.v8_splitRouteModules` to a top-level `splitRouteModules` config option and change the default behavior to `true` ([#15086](https://github.com/remix-run/react-router/pull/15086))
  - Set `splitRouteModules: false` to keep route modules in a single chunk
  - Set `splitRouteModules: "enforce"` to require all routes to be splittable
- `@react-router/dev` - Removed the `future.v8_viteEnvironmentApi` flag because the Vite Environment API is always enabled ([#15077](https://github.com/remix-run/react-router/pull/15077))
- `@react-router/dev` - Removed the `future.unstable_previewServerPrerendering` flag and make prerendering with the Vite Environment API the default. ([#15077](https://github.com/remix-run/react-router/pull/15077))
- `react-router` - Update `tsconfig.json` `target`/`lib` from `ES2020 -> ES2022` ([591853e](https://github.com/remix-run/react-router/commit/591853e))
- `react-router` - Switch the published packages in `packages/` to ESM-only. ([#14895](https://github.com/remix-run/react-router/pull/14895)) ([59ebcf1](https://github.com/remix-run/react-router/commit/59ebcf1))
- `react-router` - Remove deprecated `data` parameter in favor of `loaderData` for `meta` APIs (to align with `Route.ComponentProps`) ([#14931](https://github.com/remix-run/react-router/pull/14931))
  - `Route.MetaArgs`, `Route.MetaMatch`, `MetaArgs`, `MetaMatch`, `Route.ComponentProps.matches`, `UIMatch`
- `react-router` - Remove internal `hasErrorBoundary` field added to `router.routes` when using a data router ([#15074](https://github.com/remix-run/react-router/pull/15074))
  - This should not impact user-facing code since this was an internal prop and was computed based on the presence of `ErrorBoundary` or `errorElement` on your route
  - `hasErrorBoundary` is no longer accepted on `RouteObject` (`IndexRouteObject`/`NonIndexRouteObject`), `DataRouteObject`, `<Route>` JSX props, or as a key in `lazy` route definitions.
  - The `MapRoutePropertiesFunction` signature no longer requires returning `hasErrorBoundary`; the router infers it directly.
- `react-router` - Remove `react-router-dom` package ([#15076](https://github.com/remix-run/react-router/pull/15076))
  - In v7 everything DOM-specific was collapsed into `react-router/dom`
    - `react-router-dom` was kept around as a convenience so existing v6 app imports would still work
  - For v8, you will need to swap `react-router-dom` imports:
    - `RouterProvider`/`HydratedRouter` should be imported from `react-router/dom`
    - Everything else should be imported from `react-router`
- `@react-router/architect` - Bump `@architect/functions` to v8 ([#15106](https://github.com/remix-run/react-router/pull/15106))
- `@react-router/architect` - Remove the `useRequestContextDomainName` option from `createRequestHandler` - this is now the default behavior ([#15188](https://github.com/remix-run/react-router/pull/15188))
- `@react-router/dev` - Remove `@react-router/dev/vite/cloudflare` dev proxy export; use `@cloudflare/vite-plugin` instead ([#15077](https://github.com/remix-run/react-router/pull/15077))
  - Drops support for `wrangler@3` as a peer dependency of `@react-router/dev`
- `@react-router/dev` - Require Vite 7+ and make the Vite Environment API build path mandatory ([#15077](https://github.com/remix-run/react-router/pull/15077))
- `@react-router/express` - Bump dependencies ([#15106](https://github.com/remix-run/react-router/pull/15106))
  - Bumped `express` from `^4.19.2` to `^4.22.2`
  - Bumped the `express` peer dependency from `^4.17.1 || ^5` to `^4.22.2 || ^5`
  - Bumped `@types/express` from `^4.17.9` to `^4.17.25`
- `@react-router/node` - Switch from `@mjackson/node-fetch-server` to `@remix-run/node-fetch-server` now that we can directly use ESM-only packages ([#14930](https://github.com/remix-run/react-router/pull/14930))
- `@react-router/serve` - Switch from `@mjackson/node-fetch-server` to `@remix-run/node-fetch-server` now that we can directly use ESM-only packages ([#14930](https://github.com/remix-run/react-router/pull/14930))
- `create-react-router` - Switch from `@remix-run/web-fetch` to native `fetch` internally. ([#14929](https://github.com/remix-run/react-router/pull/14929))
  - This removes the underlying `HTTPS_PROXY` support that `node-fetch` and subsequently `@remix-run/web-fetch` supported

### Minor Changes

- `react-router` - Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `cookie` from `^1.0.1` to `^1.1.1`
  - Bumped `set-cookie-parser` from `^2.6.0` to `^3.1.0`
- `@react-router/cloudflare` - Bump `@cloudflare/workers-types` fromn `^4.20260520.1` to `^4.20260527.1` ([#15106](https://github.com/remix-run/react-router/pull/15106))
- `@react-router/dev` - Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `@babel/core` from `^7.27.7` to `^7.29.7`
  - Bumped `@babel/generator` from `^7.27.5` to `^7.29.7`
  - Bumped `@babel/parser` from `^7.27.7` to `^7.29.7`
  - Bumped `@babel/plugin-syntax-jsx` from `^7.27.1` to `^7.29.7`
  - Bumped `@babel/preset-typescript` from `^7.27.1` to `^7.29.7`
  - Bumped `@babel/traverse` from `^7.27.7` to `^7.29.7`
  - Bumped `@babel/types` from `^7.27.7` to `^7.29.7`
  - Bumped `dedent` from `^1.5.3` to `^1.7.2`
  - Bumped `jsesc` from `3.0.2` to `3.1.0`
  - Bumped `lodash` from `^4.17.21` to `^4.18.1`
  - Bumped `prettier` from `^3.6.2` to `^3.8.3`
  - Bumped `@remix-run/node-fetch-server` from `^0.13.0` to `^0.13.3`
  - Bumped `react-refresh` from `^0.14.0` to `^0.18.0`
  - Bumped `semver` from `^7.3.7` to `^7.8.1`
  - Bumped `tinyglobby` from `^0.2.14` to `^0.2.16`
  - Bumped `valibot` from `^1.2.0` to `^1.4.1`
- `@react-router/dev` - Replace `cookie` and `set-cookie-parser` with `cookie-es` ([#15109](https://github.com/remix-run/react-router/pull/15109))
- `@react-router/dev` - Removed the `vite-node` dependency in favor of Vite's native module runner APIs ([#15104](https://github.com/remix-run/react-router/pull/15104))
- `@react-router/serve` - Bump `express` from `4.21.2` to `5.2.1` ([#15101](https://github.com/remix-run/react-router/issues/15101))
- `create-react-router` - Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `execa` from `5.1.1` to `9.6.1`
  - Bumped `log-update` from `^5.0.1` to `^8.0.0`
  - Bumped `semver` from `^7.3.7` to `^7.8.1`
  - Bumped `sort-package-json` from `^1.55.0` to `^3.6.1`
  - Bumped `strip-ansi` from `^6.0.1` to `^7.2.0`
  - Bumped `tar-fs` from `^2.1.3` to `^3.1.2`

### Patch Changes

- `react-router` - Ensure client middleware errors load lazy route error boundaries before bubbling ([#15086](https://github.com/remix-run/react-router/pull/15086))
- `react-router` - Remove explicit `onSubmit` type override from `SharedFormProps` to fix deprecation warning with `@types/react@19.x` ([#14932](https://github.com/remix-run/react-router/pull/14932)) ([59ebcf1](https://github.com/remix-run/react-router/commit/59ebcf1))
- `react-router` - Update package builds to preserve individual module files in published artifacts. Public APIs and documented import paths are unchanged. ([#15092](https://github.com/remix-run/react-router/pull/15092))
  - Updated package TypeScript configs to support modern module syntax used by the build configuration.
- `react-router` - Migrate package builds from `tsup` to `tsdown`. Published package entry points and public APIs are unchanged. ([#15092](https://github.com/remix-run/react-router/pull/15092))
- `react-router` - Upgrade React Router's TypeScript tooling to TypeScript 6. Runtime behavior and public APIs are unchanged. ([#15092](https://github.com/remix-run/react-router/pull/15092))
- `@react-router/architect` - Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `@types/aws-lambda` from `^8.10.82` to `^8.10.161`
- `@react-router/dev` - Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `@babel/core` from `^7.29.0` to `^7.29.7`
  - Bumped `@babel/generator` from `^7.29.1` to `^7.29.7`
  - Bumped `@babel/parser` from `^7.29.3` to `^7.29.7`
  - Bumped `@babel/plugin-syntax-jsx` from `^7.28.6` to `^7.29.7`
  - Bumped `@babel/preset-typescript` from `^7.28.5` to `^7.29.7`
  - Bumped `@babel/traverse` from `^7.29.0` to `^7.29.7`
  - Bumped `@babel/types` from `^7.29.0` to `^7.29.7`
  - Bumped `babel-dead-code-elimination` from `^1.0.6` to `^1.0.12`
  - Bumped `chokidar` from `^4.0.0` to `^5.0.0`
  - Bumped `es-module-lexer` from `^1.3.1` to `^2.1.0`
  - Bumped `exit-hook` from `2.2.1` to `5.1.0`
  - Bumped `isbot` from `^5.1.11` to `^5.1.40`
  - Bumped `p-map` from `^7.0.3` to `^7.0.4`
  - Bumped `pathe` from `^1.1.2` to `^2.0.3`
  - Bumped `pkg-types` from `^2.3.0` to `^2.3.1`
  - Bumped `react-refresh` from `^0.14.0` to `^0.18.0`
  - Bumped `semver` from `^7.8.0` to `^7.8.1`
  - Bumped `tinyglobby` from `^0.2.14` to `^0.2.16`
  - Bumped `valibot` from `^1.4.0` to `^1.4.1`
- `@react-router/dev` - Fix Windows libuv assertion (`!(handle->flags & UV_HANDLE_CLOSING)` in `src/win/async.c`) during prerendering by using `node:http` instead of `fetch` for internal prerender requests against the Vite preview server ([#15077](https://github.com/remix-run/react-router/pull/15077))
- `@react-router/fs-routes` - Bump dependencies ([#15091](https://github.com/remix-run/react-router/pull/15091))
  - Bumped `minimatch` from `^9.0.0` to `^10.2.5`
- `@react-router/node` - Bump dependencies ([#15106](https://github.com/remix-run/react-router/pull/15106))
  - Bumped `@remix-run/node-fetch-server` from `^0.13.0` to `^0.13.3`
- `@react-router/serve` - Bump dependencies ([#15091](https://github.com/remix-run/react-router/pull/15091))
  - Bumped `@remix-run/node-fetch-server` from `^0.13.0` to `^0.13.3`
  - Bumped `get-port` from `5.1.1` to `7.2.0`

**Full Changelog**: [`v7.18.0...v8.0.0`](https://github.com/remix-run/react-router/compare/react-router@7.18.0...react-router@8.0.0)

# React Router v7 Releases

## v7.18.0

Date: 2026-06-16

### What's Changed

#### CSRF Check Logic Fix

We made a bug fix in our underlying CSRF checks in this release that may be a "breaking bug fix" for some users deployed behind a reverse proxy. The CSRF check now checks directly against the `host` in the `request` url provided, instead of looking directly at HTTP headers which is an adapter concern. If your adapter is not setting the expected host in the request URL, you may need to add the new internal host to your `allowedActionOrigins` config. This is most likely to occur in `@react-router/serve` apps or `@react-router/express` apps without the `trust proxy` setting enabled. We recommend testing this against application mutation requests as part of your upgrade.

### Minor Changes

- `@react-router/architect` - Add a `useRequestContextDomainName` option to `createRequestHandler` to derive request URL hosts from the API Gateway request context ([#15185](https://github.com/remix-run/react-router/pull/15185))
  - This flag will become the default behavior in v8, so it is recommended to adopt to prepare for and to v8 better align with your deployment architecture and rely less on manual header parsing in the adapter
  - See the [docs](https://reactrouter.com/api/other-api/adapter#react-routerarchitect) for more information

### Patch Changes

- `react-router` - Fix server handler prerender responses when using `ssr: false` and `future.v8_trailingSlashAwareDataRequests: true` ([#15173](https://github.com/remix-run/react-router/pull/15173))
  - Avoids false positive "SPA Mode" detection when serving prerendered paths
- `react-router` - Use the `ServerRouter` `nonce` for nonce-aware SSR components when they don't provide their own value so strict CSP pages can load them ([#15170](https://github.com/remix-run/react-router/pull/15170))
- `react-router` - Use `turbo-stream` to serialize and deserialize Framework Mode hydration errors ([#15175](https://github.com/remix-run/react-router/pull/15175))
- `react-router` - Optimize route matching by extending precomputed route branches to include matchers ([#15186](https://github.com/remix-run/react-router/pull/15186))
- `react-router` - Use the constructed `request` URL `host` instead of header checks when validating action request origins in the CSRF check ([#15185](https://github.com/remix-run/react-router/pull/15185))
- `react-router` - Remove the un-documented custom error serialization logic from Data Mode SSR built-in hydration flows ([#15175](https://github.com/remix-run/react-router/pull/15175))
- `react-router` - Validate protocols in RSC render redirects ([#15177](https://github.com/remix-run/react-router/pull/15177))
- `react-router` - Consolidate url normalization logic and better handle mixed slashes ([#15176](https://github.com/remix-run/react-router/pull/15176))
- `@react-router/dev` - Pass Vite `server.watch` config to child compiler in development mode. ([#15178](https://github.com/remix-run/react-router/pull/15178))
- `@react-router/dev` - Ignore external Vite server environments in Framework Mode build hooks ([#14883](https://github.com/remix-run/react-router/pull/14883))
  - When `future.v8_viteEnvironmentApi` is enabled, React Router previously treated any non-client Vite environment as its own server build
  - This caused issues with integrations like Nitro, where plugins can register additional environments
  - Framework Mode build hooks now ignore external server environments and only process the app's own server build
- `@react-router/express` - Adjust express adapter host computation ([#15185](https://github.com/remix-run/react-router/pull/15185))
  - read port from `x-forwarded-host` based on `trust proxy` setting
  - handle invalid hostname characters

**Full Changelog**: [`v7.17.0...v7.18.0`](https://github.com/remix-run/react-router/compare/react-router@7.17.0...react-router@7.18.0)

## v7.17.0

Date: 2026-06-04

### Minor Changes

- `react-router` - Ship a subset of the official documentation inside the `react-router` package ([#15121](https://github.com/remix-run/react-router/pull/15121))
  - Markdown docs are now available in `node_modules/react-router/docs`, letting AI coding agents and the React Router agent skills read official docs locally
  - Excludes auto-generated API docs (`api/`), `community/` content, and tutorials (`tutorials/`)

### Patch Changes

- `@react-router/dev` - Fix future flag warning URLs and only log each future flag warning one time ([#15138](https://github.com/remix-run/react-router/pull/15138))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `@react-router/dev` - Prevent RSC route module server exports from being scanned by the client dependency optimizer when `future.unstable_optimizeDeps` is enabled. ([#15005](https://github.com/remix-run/react-router/pull/15005))

**Full Changelog**: [`v7.16.0...v7.17.0`](https://github.com/remix-run/react-router/compare/react-router@7.16.0...react-router@7.17.0)

## v7.16.0

Date: 2026-05-28

### Minor Changes

- `react-router` - Stabilize `future.unstable_trailingSlashAwareDataRequests` as `future.v8_trailingSlashAwareDataRequests` ([#15098](https://github.com/remix-run/react-router/pull/15098))

- `@react-router/dev` - Stabilize `future.unstable_trailingSlashAwareDataRequests` as `future.v8_trailingSlashAwareDataRequests` ([#15098](https://github.com/remix-run/react-router/pull/15098))
  - The unstable flag is no longer supported and will error during config resolution

- `@react-router/dev` - Log future flag warnings for upcoming React Router v8 flags ([#15029](https://github.com/remix-run/react-router/pull/15029))
  - `v8_middleware`, `v8_splitRouteModules`, `v8_viteEnvironmentApi`, `v8_passThroughRequests`, `v8_trailingSlashAwareDataRequests`

### Patch Changes

- `react-router` - Disable manifest path when lazy route dicovery is disabled ([#15068](https://github.com/remix-run/react-router/pull/15068))

- `react-router` - Fix browser URL creation to use the configured history window instead of the global window. ([#15066](https://github.com/remix-run/react-router/pull/15066))
  - Pass the history/router window through to `createBrowserURLImpl` so custom window contexts keep the correct URL origin.

- `react-router` - Fix `useNavigation()` return type to preserve discriminated union across navigation states ([#15095](https://github.com/remix-run/react-router/pull/15095))

- `react-router` - Widen `MetaDescriptor` `script:ld+json` type from `LdJsonObject` to `LdJsonObject | LdJsonObject[]` to permit multiple JSON-LD schemas in a single `<script type="application/ld+json">` tag emitted by `<Meta />` ([#15082](https://github.com/remix-run/react-router/pull/15082))

- `react-router-dom` - Remove stale/invalid `unpkg` field from `package.json`. This was removed from other packages with the release of v7 but missed in the `react-router-dom` re-export package ([#15075](https://github.com/remix-run/react-router/pull/15075))

- `@react-router/express` - Ignore writes after Express responses close ([#15107](https://github.com/remix-run/react-router/pull/15107))
  - Avoid surfacing client disconnects as adapter errors when the response stream has already been destroyed or ended.

- `@react-router/node` - Honor Node writable backpressure in `writeReadableStreamToWritable` and `writeAsyncIterableToWritable` ([#15071](https://github.com/remix-run/react-router/pull/15071))
  - Await `'drain'` when `writable.write()` returns `false` instead of letting chunks accumulate in the writable's internal buffer.
  - Reject (rather than hang) if the writable errors or closes mid-stream.

- `@react-router/serve` - Normalize `assetsBuildDirectory` path separators in `react-router-serve` so Windows-built server artifacts can serve `/assets/*` correctly when run on Linux. ([#14982](https://github.com/remix-run/react-router/pull/14982))

**Full Changelog**: [`v7.15.1...v7.16.0`](https://github.com/remix-run/react-router/compare/react-router@7.15.1...react-router@7.16.0)

## v7.15.1

Date: 2026-05-14

### What's New

#### `useRouterState` (unstable)

Following our [Less is More](https://github.com/remix-run/react-router/blob/main/GOVERNANCE.md#design-goals) design goal, this release includes a new `unstable_useRouterState()` hook (Framework + Data Mode) that consolidates access to active and pending router states ([RFC](https://github.com/remix-run/react-router/discussions/12358), [Roadmap Issue](https://github.com/remix-run/react-router/issues/13073)).

This should allow you to consolidate usages of a bunch of different hooks which will likely be marked deprecated later on in v8 and potentially removed in an eventual v9:

```ts
let { active, pending } = unstable_useRouterState();

// Active is always populated with the current location
active.location; // replaces `useLocation()`
active.searchParams; // replaces `useSearchParams()[0]`
active.params; // replaces `useParams()`
active.matches; // replaces `useMatches()`
active.type; // replaces `useNavigationType()`

// Pending is only populated during a navigation
pending.location; // replaces `useNavigation().location`
pending.searchParams; // equivalent to `new URLSearchParams(useNavigation().search)`
pending.params; // Not directly accessible today
pending.matches; // Not directly accessible today
pending.type; // Not directly accessible today
pending.state; // replaces `useNavigation().state`
pending.formMethod; // replaces useNavigation().formMethod
pending.formAction; // replaces useNavigation().formAction
pending.formEncType; // replaces useNavigation().formEncType
pending.formData; // replaces useNavigation().formData
pending.json; // replaces useNavigation().json
pending.text; // replaces useNavigation().text
```

### Patch Changes

- `react-router` - Memoize `useFetchers` to return a stable identity and only change if fetchers changed ([#15028](https://github.com/remix-run/react-router/pull/15028))
- `react-router` - Update router to operate on fetcher Maps in an immutable manner to avoid delayed React renders from potentially reading an updated but not yet committed Map. This could result in brief flickers in some fetcher-driven optimistic UI scenarios ([#15028](https://github.com/remix-run/react-router/pull/15028))
- `react-router` - Fix `serverLoader()` returning stale SSR data when a client navigation aborts pending hydration before the hydration `clientLoader` resolves ([#15022](https://github.com/remix-run/react-router/pull/15022))
- `react-router` - Fix `RouterProvider` `onError` callback not being called for synchronous initial loader errors in SPA mode ([#15039](https://github.com/remix-run/react-router/pull/15039)) ([#14942](https://github.com/remix-run/react-router/pull/14942))
- `react-router` - Internal refactor to consolidate mutation request detection through shared utility ([#15033](https://github.com/remix-run/react-router/pull/15033))
- `@react-router/dev` - Fix `basename` conflicting with `app` directory name when Vite `base` is set ([#15027](https://github.com/remix-run/react-router/pull/15027))
  - When the Vite `base` config and React Router `basename` both match the app directory name (e.g. `base: "/app/"`, `basename: "/app/"`), Vite would strip the base prefix from server-build virtual module import paths, causing "Failed to load url /root.tsx" errors
  - The fix uses `/@fs/` absolute paths for those imports to bypass Vite's base-stripping logic

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add a new `unstable_useRouterState()` hook that consolidates access to active and pending router states (RFC: #12358) ([#15017](https://github.com/remix-run/react-router/pull/15017))
  - Data/Framework/RSC only — throws when used without a data router

**Full Changelog**: [`v7.15.0...v7.15.1`](https://github.com/remix-run/react-router/compare/react-router@7.15.0...react-router@7.15.1)

## v7.15.0

Date: 2026-05-05

### What's Changed

#### Stabilizations

We've stabilized a bunch of APIs in this release in preparation for a React Router v8 release hopefully in the next month or two. These flag/prop renames are breaking changes if you've already opted into the unstable APIs so please make sure you make the appropriate changes if so.

- `future.unstable_passThroughRequests` → `future.v8_passThroughRequests`
- `future.unstable_subResourceIntegrity` → top-level `config.subResourceIntegrity`
- `prerender.unstable_concurrency` → `prerender.concurrency`
- `unstable_url` → `url` (loader, action, middleware, instrumentation args)
- `unstable_instrumentations` → `instrumentations`
  - Plus associated types (`ServerInstrumentation`, `ClientInstrumentation`, etc.)
- `unstable_pattern` → `pattern` (loader, action, middleware, instrumentation args)
- `unstable_defaultShouldRevalidate` → `defaultShouldRevalidate`
- `unstable_useTransitions` → `useTransitions`
- `unstable_mask` → `mask` (on `<Link>`, `useLinkClickHandler`, `useNavigate`, and `Location`)

#### Route matching optimizations

We've added a handful of route matching optimizations in this release for Framework and Data mode. The changes are mostly related to caching the internal flattened/ranked route branches and reducing additional calls to `matchRoutes` along the critical path. This should result in improved performance during both server-side request handling and client-side navigations.

### Minor Changes

- `react-router` - Stabilize `unstable_defaultShouldRevalidate` as `defaultShouldRevalidate` on `<Link>`, `<Form>`, `useLinkClickHandler`, `useSubmit`, `fetcher.submit`, and `setSearchParams` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize the instrumentation APIs ([14999](https://github.com/remix-run/react-router/pull/14999))
  - `unstable_instrumentations` is now `instrumentations`
  - `unstable_pattern` is now `pattern`
  - The `unstable_ServerInstrumentation`, `unstable_ClientInstrumentation`, `unstable_InstrumentRequestHandlerFunction`, `unstable_InstrumentRouterFunction`, `unstable_InstrumentRouteFunction`, and `unstable_InstrumentationHandlerResult` types have had their `unstable_` prefixes removed
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize `unstable_mask` as `mask` on `<Link>`, `useLinkClickHandler`, and `useNavigate`, and rename the corresponding `Location.unstable_mask` field to `Location.mask` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize the `unstable_normalizePath` option on `staticHandler.query` and `staticHandler.queryRoute` as `normalizePath` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize `future.unstable_passThroughRequests` as `future.v8_passThroughRequests` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Remove `unstable_subResourceIntegrity` from the runtime `FutureConfig` type; the flag is now controlled by the top-level `subResourceIntegrity` option in `react-router.config.ts` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize `unstable_url` as `url` on `loader`, `action`, and `middleware` function args ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `react-router` - Stabilize `unstable_useTransitions` as `useTransitions` on `<BrowserRouter>`, `<HashRouter>`, `<HistoryRouter>`, `<MemoryRouter>`, `<Router>`, `<RouterProvider>`, `<HydratedRouter>`, and `useLinkClickHandler` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `@react-router/dev` - Stabilize `future.unstable_passThroughRequests` as `future.v8_passThroughRequests` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `@react-router/dev` - Stabilize `prerender.unstable_concurrency` as `prerender.concurrency` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly
- `@react-router/dev` - Stabilize `future.unstable_subResourceIntegrity` as a top-level `subResourceIntegrity` config option in `react-router.config.ts` ([14999](https://github.com/remix-run/react-router/pull/14999))
  - ⚠️ This is a breaking change if you have already opted into the unstable version - you will need to update your code accordingly

### Patch Changes

- `react-router` - Add `nonce` to `<Scripts>` `<link rel="modulepreload">` elements (if provided) ([af5d49b](https://github.com/remix-run/react-router/commit/af5d49b))
- `react-router` - Fix a bug with `unstable_defaultShouldRevalidate={false}` where parent routes that did not export a `shouldRevalidate` function could be incorrectly included in the single fetch call for new child route data ([#15012](https://github.com/remix-run/react-router/pull/15012))
- `react-router` - Mark `mask` as an optional field in `Location` for easier mocking in unit tests ([#14999](https://github.com/remix-run/react-router/pull/14999))
- `react-router` - Improve server-side route matching performance by pre-computing flattened/cached route branches ([#14967](https://github.com/remix-run/react-router/pull/14967))
  - Performance benchmarks showed roughly a 10-15% improvement in server-side request handling performance
- `react-router` - Cache flattened/ranked route branches to optimize server-side route matching ([#14967](https://github.com/remix-run/react-router/pull/14967))
- `react-router` - Improve route matching performance in Framework/Data Mode ([#14971](https://github.com/remix-run/react-router/pull/14971))
  - Avoiding unnecessary calls to `matchRoutes` in data router scenarios
    - This includes adding back the optimization that was removed in `7.6.0` ([#13562](https://github.com/remix-run/react-router/pull/13562))
    - The issues that prompted the revert have been addressed by using the available router `matches` but always updating `match.route` to the latest route in the `manifest`
  - Leverage pre-computed pre-computing flattened/cached route branches during client side route matching
  - Performance benchmarks showed roughly a 15-30% improvement in server-side request handling performance

**Full Changelog**: [`v7.14.2...v7.15.0`](https://github.com/remix-run/react-router/compare/react-router@7.14.2...react-router@7.15.0)

## v7.14.2

Date: 2026-04-21

### Patch Changes

- `react-router` - Remove the un-documented custom error serialization logic from the internal turbo-stream implementation. React Router only automatically handles serialization of `Error` and it's standard subtypes (`SyntaxError`, `TypeError`, etc.). ([#14992](https://github.com/remix-run/react-router/pull/14992))
- `react-router` - Properly handle parent middleware redirects during `fetcher.load` ([#14974](https://github.com/remix-run/react-router/pull/14974))
- `react-router` - Remove redundant `Omit<RouterProviderProps, "flushSync">` from `react-router/dom` `RouterProvider` ([#14874](https://github.com/remix-run/react-router/pull/14874))
- `react-router` - Improved types for `generatePath`'s `param` arg ([#14984](https://github.com/remix-run/react-router/pull/14984))
  - Type errors when required params are omitted:

    ```ts
    // Before
    // Passes type checks, but throws at runtime 💥
    generatePath(":required", { required: null });

    // After
    generatePath(":required", { required: null });
    //                          ^^^^^^^^ Type 'null' is not assignable to type 'string'.ts(2322)
    ```

  - Allow omission of optional params:

    ```ts
    // Before
    generatePath(":optional?", {});
    //                         ^^ Property 'optional' is missing in type '{}' but required in type '{ optional: string | null | undefined; }'.ts(2741)

    // After
    generatePath(":optional?", {});
    ```

  - Allows extra keys:

    ```ts
    // Before
    generatePath(":a", { a: "1", b: "2" });
    //                           ^ Object literal may only specify known properties, and 'b' does not exist in type '{ a: string; }'.ts(2353)

    // After
    generatePath(":a", { a: "1", b: "2" });
    ```

- `@react-router/dev` - Fix typegen for layouts without pages ([#14875](https://github.com/remix-run/react-router/pull/14875))
  - Previously, typegen could produce `pages: ;` in `.react-router/types/+routes.ts` when a route corresponded to 0 pages
  - Now, `pages: never;` is correctly generated for those cases

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `@react-router/dev` - For `unstable_reactRouterRSC` Vite plugin consumers, require `@vitejs/plugin-react` in user Vite config, and more reliably split route modules ([#14965](https://github.com/remix-run/react-router/pull/14965))
  - ⚠️ This is a breaking change if you have begun using the `unstable_reactRouterRSC` Vite plugin - please install `@vitejs/plugin-react` and add the `react` plugin to your Vite plugins array.

**Full Changelog**: [`v7.14.1...v7.14.2`](https://github.com/remix-run/react-router/compare/react-router@7.14.1...react-router@7.14.2)

## v7.14.1

Date: 2026-04-13

### Patch Changes

- `react-router` - Fix a potential race condition that can occur when rendering a `HydrateFallback` and initial loaders land before the `router.subscribe` call happens in the `RouterProvider` layout effect ([#14497](https://github.com/remix-run/react-router/pull/14497))
- `react-router` - Normalize double-slashes in redirect paths ([#14962](https://github.com/remix-run/react-router/pull/14962))
- `@react-router/dev` - Add TypeScript 6 support to peer dependency ranges ([#14935](https://github.com/remix-run/react-router/pull/14935))

**Full Changelog**: [`v7.14.0...v7.14.1`](https://github.com/remix-run/react-router/compare/react-router@7.14.0...react-router@7.14.1)

## v7.14.0

Date: 2026-04-02

### Minor Changes

- Add support for Vite 8 ([#14876](https://github.com/remix-run/react-router/pull/14876))

### Patch Changes

- `react-router` - Remove recursion from vendored `turbo-stream` v2 implementation allowing for encoding/decoding of large payloads ([#14838](https://github.com/remix-run/react-router/pull/14838))
- `react-router` - Fix `encodeViaTurboStream` memory leak via unremoved `AbortSignal` listener ([#14900](https://github.com/remix-run/react-router/pull/14900))
- `@react-router/dev` - Support for prerendering multiple server bundles with `v8_viteEnvironmentApi` ([#14921](https://github.com/remix-run/react-router/pull/14921))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `@react-router/dev` - Pre-rendering and SPA Mode support for RSC Framework Mode ([#14907](https://github.com/remix-run/react-router/pull/14907))
- `@react-router/dev` - Update `react-router reveal` to support RSC Framework Mode for `entry.client`, `entry.rsc`, `entry.ssr` ([#14904](https://github.com/remix-run/react-router/pull/14904))
- `react-router` - Support `<Link prefetch>` in RSC Framework Mode ([#14902](https://github.com/remix-run/react-router/pull/14902))
- `react-router` - Add support for new route module exports in unstable RSC Framework Mode ([#14901](https://github.com/remix-run/react-router/pull/14901))
  - ⚠️ This is a breaking change if you have already adopted RSC Framework Mode in it's unstable state - you will need to update your route modules to export the new annotations
  - The following route module components have their own mutually exclusive server component counterparts:

    | Client Component export | Server Component export |
    | ----------------------- | ----------------------- |
    | `default`               | `ServerComponent`       |
    | `ErrorBoundary`         | `ServerErrorBoundary`   |
    | `Layout`                | `ServerLayout`          |
    | `HydrateFallback`       | `ServerHydrateFallback` |

  - If you were previously exporting a `ServerComponent`, your `ErrorBoundary`, `Layout`, and `HydrateFallback` were also implicitly server components
  - If you want to keep those as server components - rename them and prefix them with `Server`
  - If you were previously importing the implementations of those components from a client module, you can inline them

    ```tsx
    // Before
    import { ErrorBoundary as ClientErrorBoundary } from "./client";

    export function ServerComponent() {
      // ...
    }

    export function ErrorBoundary() {
      return <ClientErrorBoundary />;
    }

    export function Layout() {
      // ...
    }

    export function HydrateFallback() {
      // ...
    }
    ```

    ```tsx
    // After

    export function ServerComponent() {
      // ...
    }

    export function ErrorBoundary() {
      // previous implementation of ClientErrorBoundary, this is now a client component
    }

    export function ServerLayout() {
      // rename previous Layout export to ServerLayout to make it a server component
    }

    export function ServerHydrateFallback() {
      // rename previous HydrateFallback export to ServerHydrateFallback to make it a server component
    }
    ```

**Full Changelog**: [`v7.13.2...v7.14.0`](https://github.com/remix-run/react-router/compare/react-router@7.13.2...react-router@7.14.0)

## v7.13.2

Date: 2026-03-23

### What's Changed

#### Pass-through Requests (unstable)

By default, React Router normalizes the `request.url` passed to your `loader`, `action`, and `middleware` functions by removing React Router's internal implementation details (`.data` suffixes, `index` + `_routes` query params). This release introduces a new `future.unstable_passThroughRequests` flag to disable this normalization and pass the raw HTTP `request` instance to your handlers.

In addition to reducing server-side overhead by eliminating multiple `new Request()` calls on the critical path, this also provides additional visibility to your route handlers/instrumentations allowing you to differentiate document from data requests.

If you were previously relying on the normalization of `request.url`, you can switch to use the new sibling `unstable_url` parameter which contains a `URL` instance representing the normalized location:

```tsx
// ❌ Before: you could assume there was no `.data` suffix in `request.url`
export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  if (url.pathname === "/path") {
    // This check will fail with the flag enabled because the `.data` suffix will
    // exist on data requests
  }
}

// ✅ After: use `unstable_url` for normalized routing logic and `request.url`
// for raw routing logic
export async function loader({ request, unstable_url }: Route.LoaderArgs) {
  if (unstable_url.pathname === "/path") {
    // This will always have the `.data` suffix stripped
  }

  // And now you can distinguish between document versus data requests
  let isDataRequest = new URL(request.url).pathname.endsWith(".data");
}
```

#### Route handlers/middleware `unstable_url` parameter

We have added a new `unstable_url: URL` parameter to route handler methods (`loader`, `action`, `middleware`, etc.) that contains the normalized URL the application is navigating to or fetching with React Router implementation details removed (`.data`suffix, `index`/`_routes` query params).

This parameter is primarily needed when adopting the new `future.unstable_passthroughRequests` future flag as a way to continue accessing the normalized URL. If you don't have the flag enabled, then `unstable_url` will match `request.url`.

### Patch Changes

- `react-router` - Fix `clientLoader.hydrate` when an ancestor route is also hydrating a `clientLoader` ([#14835](https://github.com/remix-run/react-router/pull/14835))
- `react-router` - Fix type error when passing Framework Mode route components using `Route.ComponentProps` to `createRoutesStub` ([#14892](https://github.com/remix-run/react-router/pull/14892))
- `react-router` - Fix percent encoding in relative path navigation ([#14786](https://github.com/remix-run/react-router/pull/14786))
- `react-router` - Internal refactor to consolidate framework-agnostic/React-specific route type layers - no public API changes ([#14765](https://github.com/remix-run/react-router/pull/14765))
- `@react-router/dev` - Fix `react-router dev` crash when Unix socket files exist in the project root ([#14854](https://github.com/remix-run/react-router/pull/14854))
- `@react-router/dev` - Escape redirect locations in pre-rendered redirect HTML ([#14880](https://github.com/remix-run/react-router/pull/14880))
- `create-react-router` - replace `chalk` with `picocolors` ([#14837](https://github.com/remix-run/react-router/pull/14837))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Sync protocol validation to RSC flows ([#14882](https://github.com/remix-run/react-router/pull/14882))
- `react-router` - Add `future.unstable_passThroughRequests` flag ([#14775](https://github.com/remix-run/react-router/pull/14775))
- `react-router` - Add a new `unstable_url: URL` parameter to route handler methods (`loader`, `action`, `middleware`, etc.) representing the normalized URL the application is navigating to or fetching, with React Router implementation details removed (`.data`suffix, `index`/`_routes` query params) ([#14775](https://github.com/remix-run/react-router/pull/14775))

**Full Changelog**: [`v7.13.1...v7.13.2`](https://github.com/remix-run/react-router/compare/react-router@7.13.1...react-router@7.13.2)

## v7.13.1

Date: 2026-02-23

### What's Changed

#### URL Masking (unstable)

This release includes a new `<Link unstable_mask>` API which brings first-class support for URL masking to Framework/Data Mode ([RFC](https://github.com/remix-run/react-router/discussions/9864)). This allows the same type of UI you could achieve in Declarative Mode via [manual `backgroundLocation` management](https://github.com/remix-run/react-router/tree/main/examples/modal). That example has been converted to Data Mode using the new API [here](https://github.com/remix-run/react-router/tree/main/examples/modal-data-router).

### Patch Changes

- `react-router` - Clear timeout when `turbo-stream` encoding completes ([#14810](https://github.com/remix-run/react-router/pull/14810))
- `react-router` - Improve error message when `Origin` header is invalid ([#14743](https://github.com/remix-run/react-router/pull/14743))
- `react-router` - Fix `matchPath` optional params matching without a `"/"` separator. ([#14689](https://github.com/remix-run/react-router/pull/14689))
  - `matchPath("/users/:id?", "/usersblah")` now returns null
  - `matchPath("/test_route/:part?", "/test_route_more")` now returns null.
- `react-router` - Fix `HydrateFallback` rendering during initial lazy route discovery with matching splat route ([#14740](https://github.com/remix-run/react-router/pull/14740))
- `react-router` - Preserve query parameters and hash on manifest version mismatch reload ([#14813](https://github.com/remix-run/react-router/pull/14813))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - RSC: fix null reference exception in bad codepath leading to invalid route tree comparisons ([#14780](https://github.com/remix-run/react-router/pull/14780))
- `react-router` - RSC: add `unstable_getRequest` API ([#14758](https://github.com/remix-run/react-router/pull/14758))
- `react-router` - RSC: Update failed origin checks to return a 400 status and appropriate UI instead of a generic 500 ([#14755](https://github.com/remix-run/react-router/pull/14755))
- `react-router` - Add support for `<Link unstable_mask>` in Framework/Data Mode which allows users to navigate to a URL in the router but "mask" the URL displayed in the browser ([#14716](https://github.com/remix-run/react-router/pull/14716))
  - This is useful for contextual routing usages such as displaying an image in a modal on top of a gallery, but displaying a browser URL directly to the image that can be shared and loaded without the contextual gallery in the background
  - The masked location, if present, will be available on `useLocation().unstable_mask` so you can detect whether you are currently masked or not
  - Masked URLs only work for SPA use cases, and will be removed from `history.state` during SSR
  - This provides a first-class API to mask URLs in Framework/Data Mode to achieve the same behavior you could do in Declarative Mode via [manual `backgroundLocation` management](https://github.com/remix-run/react-router/tree/main/examples/modal).

    ```tsx
    // routes/gallery.tsx
    export function clientLoader({ request }: Route.LoaderArgs) {
      let sp = new URL(request.url).searchParams;
      return {
        images: getImages(),
        // When the router location has the image param, load the modal data
        modalImage: sp.has("image") ? getImage(sp.get("image")!) : null,
      };
    }

    export default function Gallery({ loaderData }: Route.ComponentProps) {
      return (
        <>
          <GalleryGrid>
            {loaderData.images.map((image) => (
              <Link
                key={image.id}
                {/* Navigate the router to /galley?image=N */}}
                to={`/gallery?image=${image.id}`}
                {/* But display /images/N in the URL bar */}}
                unstable_mask={`/images/${image.id}`}
              >
                <img src={image.url} alt={image.alt} />
              </Link>
            ))}
          </GalleryGrid>

          {/* When the modal data exists, display the modal */}
          {data.modalImage ? (
            <dialog open>
              <img src={data.modalImage.url} alt={data.modalImage.alt} />
            </dialog>
          ) : null}
        </>
      );
    }
    ```

**Full Changelog**: [`v7.13.0...v7.13.1`](https://github.com/remix-run/react-router/compare/react-router@7.13.0...react-router@7.13.1)

## v7.13.0

Date: 2026-01-23

### Minor Changes

- `react-router` - Add `crossOrigin` prop to `Links` component ([#14687](https://github.com/remix-run/react-router/pull/14687))

### Patch Changes

- `react-router` - Fix double slash normalization for `useNavigate` paths with a colon ([#14718](https://github.com/remix-run/react-router/pull/14718))
- `react-router` - Fix missing `nonce` on inline `criticalCss` ([#14691](https://github.com/remix-run/react-router/pull/14691))
- `react-router` - Update failed origin checks to return a 400 status instead of a 500 ([#14737](https://github.com/remix-run/react-router/pull/14737))
- `react-router` - Loosen `allowedActionOrigins` glob check so `**` matches all domains ([#14722](https://github.com/remix-run/react-router/pull/14722))
- `@react-router/dev` - Bump `@remix-run/node-fetch-server` dep ([#14704](https://github.com/remix-run/react-router/pull/14704))
- `@react-router/fs-routes` - Fix route file paths when routes directory is outside of the app directory ([#13937](https://github.com/remix-run/react-router/pull/13937))

**Full Changelog**: [`v7.12.0...v7.13.0`](https://github.com/remix-run/react-router/compare/react-router@7.12.0...react-router@7.13.0)

## v7.12.0

Date: 2026-01-07

### Security Notice

This release addresses 3 security vulnerabilities:

- [CSRF in React Router Action/Server Action Request Processing](https://github.com/remix-run/react-router/security/advisories/GHSA-h5cw-625j-3rxh)
- [XSS via Open Redirects](https://github.com/remix-run/react-router/security/advisories/GHSA-2w69-qvjg-hvjx)
- [React Router SSR XSS in ScrollRestoration](https://github.com/remix-run/react-router/security/advisories/GHSA-8v8x-cx79-35w7)

### Minor Changes

- `react-router` - Add additional layer of CSRF protection by rejecting submissions to UI routes from external origins ([#14708](https://github.com/remix-run/react-router/pull/14708))
  - If you need to permit access to specific external origins, there is a new `allowedActionOrigins` config field in `react-router.config.ts` where you can specify external origins

### Patch Changes

- `react-router` - Fix `generatePath` when used with suffixed params (i.e., `/books/:id.json`) ([#14269](https://github.com/remix-run/react-router/pull/14269))
- `react-router` - Escape HTML in scroll restoration keys ([#14705](https://github.com/remix-run/react-router/pull/14705))
- `react-router` - Validate redirect locations ([#14706](https://github.com/remix-run/react-router/pull/14706))
- `@react-router/dev` - Fix `Maximum call stack size exceeded` errors when HMR is triggered against code with cyclic imports ([#14522](https://github.com/remix-run/react-router/pull/14522))
- `@react-router/dev` - Skip SSR middleware in `vite preview` server for SPA mode ([#14673](https://github.com/remix-run/react-router/pull/14673))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Preserve `clientLoader.hydrate=true` when using `<HydratedRouter unstable_instrumentations>` ([#14674](https://github.com/remix-run/react-router/pull/14674))
- `react-router` - Pass `<Scripts nonce>` value through to the underlying `importmap` `script` tag when using `future.unstable_subResourceIntegrity` ([#14675](https://github.com/remix-run/react-router/pull/14675))
- `react-router` - Export `UNSAFE_createMemoryHistory` and `UNSAFE_createHashHistory` alongside `UNSAFE_createBrowserHistory` for consistency ([#14663](https://github.com/remix-run/react-router/pull/14663))
  - These are not intended to be used for new apps but intended to help apps using `unstable_HistoryRouter` migrate from v6->v7 so they can adopt the newer APIs
- `@react-router/dev` - Add a new `future.unstable_trailingSlashAwareDataRequests` flag to provide consistent behavior of `request.pathname` inside `middleware`, `loader`, and `action` functions on document and data requests when a trailing slash is present in the browser URL. ([#14644](https://github.com/remix-run/react-router/pull/14644))
  - Currently, your HTTP and `request` pathnames would be as follows for `/a/b/c` and `/a/b/c/`

    | URL `/a/b/c` | **HTTP pathname** | **`request` pathname`** |
    | ------------ | ----------------- | ----------------------- |
    | **Document** | `/a/b/c`          | `/a/b/c` ✅             |
    | **Data**     | `/a/b/c.data`     | `/a/b/c` ✅             |

    | URL `/a/b/c/` | **HTTP pathname** | **`request` pathname`** |
    | ------------- | ----------------- | ----------------------- |
    | **Document**  | `/a/b/c/`         | `/a/b/c/` ✅            |
    | **Data**      | `/a/b/c.data`     | `/a/b/c` ⚠️             |

  - With this flag enabled, these pathnames will be made consistent though a new `_.data` format for client-side `.data` requests:

    | URL `/a/b/c` | **HTTP pathname** | **`request` pathname`** |
    | ------------ | ----------------- | ----------------------- |
    | **Document** | `/a/b/c`          | `/a/b/c` ✅             |
    | **Data**     | `/a/b/c.data`     | `/a/b/c` ✅             |

    | URL `/a/b/c/` | **HTTP pathname**  | **`request` pathname`** |
    | ------------- | ------------------ | ----------------------- |
    | **Document**  | `/a/b/c/`          | `/a/b/c/` ✅            |
    | **Data**      | `/a/b/c/_.data` ⬅️ | `/a/b/c/` ✅            |

  - This a bug fix but we are putting it behind an opt-in flag because it has the potential to be a "breaking bug fix" if you are relying on the URL format for any other application or caching logic
  - Enabling this flag also changes the format of client side `.data` requests from `/_root.data` to `/_.data` when navigating to `/` to align with the new format - This does not impact the `request` pathname which is still `/` in all cases

**Full Changelog**: [`v7.11.0...v7.12.0`](https://github.com/remix-run/react-router/compare/react-router@7.11.0...react-router@7.12.0)

## v7.11.0

Date: 2025-12-17

### What's Changed

We've added `vite preview` support and stabilized the client-side `onError` API - please make the appropriate changes if you've adopted the `unstable_onError` API already in a prior release.

#### `vite preview` Support

We've added support for [`vite preview`](https://vite.dev/guide/cli#vite-preview) when using Framework mode to make it easy to preview your production build.

#### Stabilized Client-side `onError`

The existing `<RouterProvider unstable_onError>`/`<HydratedRouter unstable_onError>` APIs have been stabilized as `<RouterProvider onError>`/`<HydratedRouter onError>`. Please see the [Error Reporting](https://reactrouter.com/7.11.0/how-to/error-reporting#client-errors) docs for more information.

#### Call-site Revalidation Opt-out (unstable)

We've added initial unstable support for call-site revalidation opt-out via a new `unstable_defaultShouldRevalidate` flag ([RFC](https://github.com/remix-run/react-router/discussions/10006)). This flag is available on all navigation/fetcher submission APIs to alter standard revalidation behavior. If any routes include a `shouldRevalidate` function, then the flag value will be passed to that function so the route has the final say on revalidation behavior.

```tsx
<Form method="post" unstable_defaultShouldRevalidate={false} />
submit(data, { method: "post", unstable_defaultShouldRevalidate: false })
<fetcher.Form method="post" unstable_defaultShouldRevalidate={false} />
fetcher.submit(data, { method: "post", unstable_defaultShouldRevalidate: false })
```

This flag is also available on non-submission navigational use cases - for example, you may want to opt-out of revalidation when adding a search param that doesn't impact the UI:

```tsx
<Link to="?analytics-param=1" unstable_defaultShouldRevalidate={false} />;
navigate("?analytics-param=1", { unstable_defaultShouldRevalidate: false });
setSearchParams(params, { unstable_defaultShouldRevalidate: false });
```

### Minor Changes

- `react-router` - Stabilize `<HydratedRouter onError>`/`<RouterProvider onError>` ([#14546](https://github.com/remix-run/react-router/pull/14546))
- `@react-router/dev` - Add `vite preview` support ([#14507](https://github.com/remix-run/react-router/pull/14507))

### Patch Changes

- `react-router` - Fix `unstable_useTransitions` prop on `<Router>` component to permit omission for backwards compatibility ([#14646](https://github.com/remix-run/react-router/pull/14646))
- `react-router` - Allow redirects to be returned from client side middleware ([#14598](https://github.com/remix-run/react-router/pull/14598))
- `react-router` - Handle `dataStrategy` implementations that return insufficient result sets by adding errors for routes without any available result ([#14627](https://github.com/remix-run/react-router/pull/14627))
- `@react-router/serve` - Update `compression` and `morgan` dependencies to address `on-headers` CVE: [GHSA-76c9-3jph-rj3q](https://github.com/advisories/GHSA-76c9-3jph-rj3q) ([#14652](https://github.com/remix-run/react-router/pull/14652))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - RSC: Support for throwing `data()` and Response from server component render phase ([#14632](https://github.com/remix-run/react-router/pull/14632))
  - Response body is not serialized as async work is not allowed as error encoding phase.
  - If you wish to transmit data to the boundary, throw `data()` instead
- `react-router` - RSC: Support for throwing `redirect` Response's at render time ([#14596](https://github.com/remix-run/react-router/pull/14596))
- `react-router` - RSC: `routeRSCServerRequest` replace `fetchServer` with `serverResponse` ([#14597](https://github.com/remix-run/react-router/pull/14597))
- `@react-router/dev` - RSC (Framework mode): Manual chunking for `react` and `react-router` deps ([#14655](https://github.com/remix-run/react-router/pull/14655))
- `@react-router/dev` - RSC (Framework mode): Optimize `react-server-dom-webpack` if in project `package.json` ([#14656](https://github.com/remix-run/react-router/pull/14656))
- `@react-router/{dev,serve}` - RSC (Framework mode): Support custom entrypoints ([#14643](https://github.com/remix-run/react-router/pull/14643))
- `react-router` - Add a new `unstable_defaultShouldRevalidate` flag to various APIs to allow opt-ing out of standard revalidation behaviors ([#14542](https://github.com/remix-run/react-router/pull/14542))

**Full Changelog**: [`v7.10.1...v7.11.0`](https://github.com/remix-run/react-router/compare/react-router@7.10.1...react-router@7.11.0)

## v7.10.1

Date: 2025-12-04

### Patch Changes

- `react-router` - Update the `useOptimistic` stub we provide for React 18 users to use a stable setter function to avoid potential `useEffect` loops - specifically when using `<Link viewTransition>` ([#14628](https://github.com/remix-run/react-router/pull/14628))
- `@react-router/dev` - Import ESM package `pkg-types` with a dynamic `import()` to fix issues on Node 20.18 ([#14624](https://github.com/remix-run/react-router/pull/14624))
- `@react-router/dev` - Update `valibot` dependency to `^1.2.0` to address [GHSA-vqpr-j7v3-hqw9](https://github.com/advisories/GHSA-vqpr-j7v3-hqw9) ([#14608](https://github.com/remix-run/react-router/pull/14608))

**Full Changelog**: [`v7.10.0...v7.10.1`](https://github.com/remix-run/react-router/compare/react-router@7.10.0...react-router@7.10.1)

## v7.10.0

Date: 2025-12-02

### What's Changed

We've stabilized a handful of existing APIs and future flags in this release, please make the appropriate changes if you'd adopted any of these APIs in their unstable state!

#### Stabilized `future.v8_splitRouteModules`

The existing `future.unstable_splitRouteModules` flag has been stabilized as `future.v8_splitRouteModules` in `react-router.config.ts`. Please see the [docs](https://reactrouter.com/7.10.0/upgrading/future#futurev8_splitroutemodules) for more information on adopting this flag.

#### Stabilized `future.v8_viteEnvironmentApi`

The existing `future.unstable_viteEnvironmentApi` flag has been stabilized as `future.v8_viteEnvironmentApi` in `react-router.config.ts`. Please see the [docs](https://reactrouter.com/7.10.0/upgrading/future#futurev8_viteenvironmentapi) for more information on adopting this flag.

#### Stabilized `fetcher.reset()`

The existing `fetcher.unstable_reset()` API has been stabilized as `fetcher.reset()`.

#### Stabilized `DataStrategyMatch.shouldCallHandler()`

The existing low-level `DataStrategyMatch.unstable_shouldCallHandler()`/`DataStrategyMatch.unstable_shouldRevalidateArgs` APIs have been stabilized as `DataStrategyMatch.shouldCallHandler()`/`DataStrategyMatch.shouldRevalidateArgs`. Please see the [docs](https://reactrouter.com/7.10.0/how-to/data-strategy) for information about using a custom `dataStrategy` and how to migrate away from the deprecated `DataStrategyMatch.shouldLoad` API if you are using that today.

### Minor Changes

- `react-router` - Stabilize `fetcher.reset()` ([#14545](https://github.com/remix-run/react-router/pull/14545))
  - ⚠️ This is a breaking change if you have begun using `fetcher.unstable_reset()` - please update your code to use `fetcher.reset()`
- `react-router` - Stabilize the `dataStrategy` `match.shouldCallHandler()`/`match.shouldRevalidateArgs` APIs ([#14592](https://github.com/remix-run/react-router/pull/14592))
  - The `match.shouldLoad` API is now marked deprecated in favor of these more powerful alternatives
  - ⚠️ This is a breaking change if you have begun using `match.unstable_shouldCallHandler()`/`match.unstable_shouldRevalidateArgs` - please update your code to use `match.shouldCallHandler()`/`match.shouldRevalidateArgs`
- `@react-router/dev` - Stabilize `future.v8_splitRouteModules`, replacing `future.unstable_splitRouteModules` ([#14595](https://github.com/remix-run/react-router/pull/14595))
  - ⚠️ This is a breaking change if you have begun using `future.unstable_splitRouteModules` - please update your `react-router.config.ts`
- `@react-router/dev` - Stabilize `future.v8_viteEnvironmentApi`, replacing `future.unstable_viteEnvironmentApi` ([#14595](https://github.com/remix-run/react-router/pull/14595))
  - ⚠️ This is a breaking change if you have begun using `future.unstable_viteEnvironmentApi` - please update your `react-router.config.ts`

### Patch Changes

- `react-router` - Fix a Framework Mode bug where the `defaultShouldRevalidate` parameter to `shouldRevalidate` would not be correct after `action` returned a 4xx/5xx response (`true` when it should have been `false`) ([#14592](https://github.com/remix-run/react-router/pull/14592))
  - If your `shouldRevalidate` function relied on that parameter, you may have seen unintended revalidations
- `react-router` - Fix `fetcher.submit` failing with plain objects containing a `tagName` property ([#14534](https://github.com/remix-run/react-router/pull/14534))
- `react-router` - Fix the promise returned from `useNavigate` in Framework/Data Mode so that it properly tracks the duration of `popstate` navigations (i.e., `navigate(-1)`) ([#14524](https://github.com/remix-run/react-router/pull/14524))
- `react-router` - Preserve `statusText` on the `ErrorResponse` instance when throwing `data()` from a route handler ([#14555](https://github.com/remix-run/react-router/pull/14555))
- `react-router` - Optimize `href()` to avoid backtracking regex on splat ([#14329](https://github.com/remix-run/react-router/pull/14329))
- `@react-router/dev` - Fix internal type error in `useRoute` types that surfaces when `skipLibCheck` is disabled ([#14577](https://github.com/remix-run/react-router/pull/14577))
- `@react-router/dev` - Load environment variables before evaluating `routes.ts` ([#14446](https://github.com/remix-run/react-router/pull/14446))
  - For example, you can now compute your routes based on [`VITE_`-prefixed environment variables](https://vite.dev/guide/env-and-mode#env-variables)

    ```ts
    // app/routes.ts
    import { type RouteConfig, route } from "@react-router/dev/routes";

    const routes: RouteConfig = [];

    // Only add the route when VITE_ENV_ROUTE is set
    if (import.meta.env.VITE_ENV_ROUTE === "my-route") {
      routes.push(route("my-route", "routes/my-route.tsx"));
    }

    export default routes;
    ```

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add `unstable_pattern` to the parameters for client side `unstable_onError` ([#14573](https://github.com/remix-run/react-router/pull/14573))
- `react-router` - Refactor how `unstable_onError` is called internally by `RouterProvider` to avoid potential strict mode issues ([#14573](https://github.com/remix-run/react-router/pull/14573))
- `react-router` - Add new `unstable_useTransitions` flag to routers to give users control over the usage of [`React.startTransition`](https://react.dev/reference/react/startTransition) and [`React.useOptimistic`](https://react.dev/reference/react/useOptimistic) ([#14524](https://github.com/remix-run/react-router/pull/14524))
  - Please see the [docs](https://reactrouter.com/7.10.0/explanation/react-transitions) for more information
  - Framework Mode + Data Mode:
    - `<HydratedRouter unstable_transition>`/`<RouterProvider unstable_transition>`
    - When left unset (current default behavior)
      - Router state updates are wrapped in `React.startTransition`
      - ⚠️ This can lead to buggy behaviors if you are wrapping your own navigations/fetchers in `React.startTransition`
      - You should set the flag to `true` if you run into this scenario to get the enhanced `useOptimistic` behavior (requires React 19)
    - When set to `true`
      - Router state updates remain wrapped in `React.startTransition` (as they are without the flag)
      - `Link`/`Form` navigations will be wrapped in `React.startTransition`
        - You can drop down to `useNavigate`/`useSubmit` if you wish to opt out of this outer `React.startTransition` call for the navigation
      - A subset of router state info will be surfaced to the UI _during_ navigations via `React.useOptimistic` (i.e., `useNavigation()`, `useFetchers()`, etc.)
        - ⚠️ This is a React 19 API so you must also be React 19 to opt into this flag for Framework/Data Mode
    - When set to `false`
      - The router will not leverage `React.startTransition` or `React.useOptimistic` on any navigations or state changes
  - Declarative Mode
    - `<BrowserRouter unstable_useTransitions>`
    - When left unset
      - Router state updates are wrapped in `React.startTransition`
    - When set to `true`
      - Router state updates remain wrapped in `React.startTransition` (as they are without the flag)
      - `Link`/`Form` navigations will be wrapped in `React.startTransition`
    - When set to `false`
      - The router will not leverage `React.startTransition` on any navigations or state changes

**Full Changelog**: [`v7.9.6...v7.10.0`](https://github.com/remix-run/react-router/compare/react-router@7.9.6...react-router@7.10.0)

## v7.9.6

Date: 2025-11-13

### Security Notice

This release addresses 1 security vulnerability:

- [Unexpected external redirect via untrusted paths](https://github.com/remix-run/react-router/security/advisories/GHSA-9jcx-v3wj-wh4m)

### Patch Changes

- `react-router` - Properly handle ancestor thrown middleware errors before `next()` on fetcher submissions ([#14517](https://github.com/remix-run/react-router/pull/14517))
- `react-router` - Fix issue with splat routes interfering with multiple calls to `patchRoutesOnNavigation` ([#14487](https://github.com/remix-run/react-router/pull/14487))
- `react-router` - Normalize double-slashes in `resolvePath` ([#14529](https://github.com/remix-run/react-router/pull/14529))
- `@react-router/dev` - Use a dynamic `import()` to load ESM-only `p-map` dependency to avoid issues on Node 20.18 and below ([#14492](https://github.com/remix-run/react-router/pull/14492))
- `@react-router/dev` - Short circuit `HEAD` document requests before calling `renderToPipeableStream` in the default `entry.server.tsx` to more closely align with the [spec](https://httpwg.org/specs/rfc9110.html#HEAD) ([#14488](https://github.com/remix-run/react-router/pull/14488))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add `location`/`params` as arguments to client-side `unstable_onError` to permit enhanced error reporting ([#14509](https://github.com/remix-run/react-router/pull/14509))
  - ⚠️ This is a breaking change if you've already adopted `unstable_onError`
  - The second parameter has changed to an object including `errorInfo`, `location`, and `params`:

    ```tsx
    // <RouterProvider unstable_onError={errorHandler} />
    // <HydratedRouter unstable_onError={errorHandler} />

    // Before
    function errorHandler(error: unknown, errorInfo?: React.errorInfo) {
      /*...*/
    }

    // After
    function errorHandler(
      error: unknown,
      info: {
        location: Location;
        params: Params;
        errorInfo?: React.ErrorInfo;
      },
    ) {
      /*...*/
    }
    ```

**Full Changelog**: [`v7.9.5...v7.9.6`](https://github.com/remix-run/react-router/compare/react-router@7.9.5...react-router@7.9.6)

## v7.9.5

Date: 2025-10-29

### What's Changed

#### Instrumentation (unstable)

This release adds new `unstable_instrumentation` APIs that will allow you to add runtime instrumentation logic to various aspects of your application (server handler, client navigations/fetches, loaders, actions, middleware, `route.lazy`). For more information, please see the [docs](https://reactrouter.com/7.9.5/how-to/instrumentation).

### Patch Changes

- `react-router` - Ensure action handlers run for routes with middleware even if no loader is present ([#14443](https://github.com/remix-run/react-router/pull/14443))
- `@react-router/dev` - Ensure route navigation doesn't remove CSS `link` elements used by dynamic imports ([#14463](https://github.com/remix-run/react-router/pull/14463))
- `@react-router/dev` - Typegen: only register route module types for routes within the app directory ([#14439](https://github.com/remix-run/react-router/pull/14439))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Move `unstable_RSCHydratedRouter` and utils to `react-router/dom` export ([#14457](https://github.com/remix-run/react-router/pull/14457))
- `react-router` - Add a type-safe `handle` field to `unstable_useRoute()` ([#14462](https://github.com/remix-run/react-router/pull/14462))

  For example:

  ```ts
  // app/routes/admin.tsx
  const handle = { hello: "world" };
  ```

  ```ts
  // app/routes/some-other-route.tsx
  export default function Component() {
    const admin = useRoute("routes/admin");
    if (!admin) throw new Error("Not nested within 'routes/admin'");
    console.log(admin.handle);
    //                ^? { hello: string }
  }
  ```

- `react-router` - Add `unstable_instrumentations` API to allow users to add observability to their apps by instrumenting route loaders, actions, middlewares, lazy, as well as server-side request handlers and client side navigations/fetches ([#14412](https://github.com/remix-run/react-router/pull/14412))
  - Framework Mode:
    - `entry.server.tsx`: `export const unstable_instrumentations = [...]`
    - `entry.client.tsx`: `<HydratedRouter unstable_instrumentations={[...]} />`
  - Data Mode
    - `createBrowserRouter(routes, { unstable_instrumentations: [...] })`
- `react-router` - Add a new `unstable_pattern` parameter to loaders/actions/middleware which contains the un-interpolated route pattern (i.e., `/blog/:slug`) which is useful for aggregating logs/metrics by route in instrumentation code ([#14412](https://github.com/remix-run/react-router/pull/14412))
- `@react-router/dev` - Introduce a `prerender.unstable_concurrency` option, to support running the pre-rendering concurrently, potentially speeding up the build ([#14380](https://github.com/remix-run/react-router/pull/14380))

**Full Changelog**: [`v7.9.4...v7.9.5`](https://github.com/remix-run/react-router/compare/react-router@7.9.4...react-router@7.9.5)

## v7.9.4

Date: 2025-10-08

### Security Notice

This release addresses 1 security vulnerability:

- [Unauthorized file access when using `createFileSessionStorage()` with unsigned cookies](https://github.com/remix-run/react-router/security/advisories/GHSA-9583-h5hc-x8cw)

### What's Changed

#### `useRoute()` (unstable)

This release includes a new `unstable_useRoute()` hook that provides a type-safe way to access route `loaderData`/`actionData` from a specific route in Framework Mode. Think if it like a better version of `useRouteLoaderData` that works with the typegen system and also supports `actionData`. Check out the changelog entry below for more information.

### Patch Changes

- `@react-router/dev` - Update `valibot` dependency to `^1.1.0` ([#14379](https://github.com/remix-run/react-router/pull/14379))
- `@react-router/node` - Validate format of incoming session ids in `createFileSessionStorage` ([#14426](https://github.com/remix-run/react-router/pull/14426))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - handle external redirects in from server actions ([#14400](https://github.com/remix-run/react-router/pull/14400))
- `react-router` - New (unstable) `useRoute` hook for accessing data from specific routes ([#14407](https://github.com/remix-run/react-router/pull/14407))

  For example, let's say you have an `admin` route somewhere in your app and you want any child routes of `admin` to all have access to the `loaderData` and `actionData` from `admin.`

  ```tsx
  // app/routes/admin.tsx
  import { Outlet } from "react-router";

  export const loader = () => ({ message: "Hello, loader!" });

  export const action = () => ({ count: 1 });

  export default function Component() {
    return (
      <div>
        {/* ... */}
        <Outlet />
        {/* ... */}
      </div>
    );
  }
  ```

  You might even want to create a reusable widget that all of the routes nested under `admin` could use:

  ```tsx
  import { unstable_useRoute as useRoute } from "react-router";

  export function AdminWidget() {
    // How to get `message` and `count` from `admin` route?
  }
  ```

  In framework mode, `useRoute` knows all your app's routes and gives you TS errors when invalid route IDs are passed in:

  ```tsx
  export function AdminWidget() {
    const admin = useRoute("routes/dmin");
    //                      ^^^^^^^^^^^
  }
  ```

  `useRoute` returns `undefined` if the route is not part of the current page:

  ```tsx
  export function AdminWidget() {
    const admin = useRoute("routes/admin");
    if (!admin) {
      throw new Error(`AdminWidget used outside of "routes/admin"`);
    }
  }
  ```

  Note: the `root` route is the exception since it is guaranteed to be part of the current page.
  As a result, `useRoute` never returns `undefined` for `root`.

  `loaderData` and `actionData` are marked as optional since they could be accessed before the `action` is triggered or after the `loader` threw an error:

  ```tsx
  export function AdminWidget() {
    const admin = useRoute("routes/admin");
    if (!admin) {
      throw new Error(`AdminWidget used outside of "routes/admin"`);
    }
    const { loaderData, actionData } = admin;
    console.log(loaderData);
    //          ^? { message: string } | undefined
    console.log(actionData);
    //          ^? { count: number } | undefined
  }
  ```

  If instead of a specific route, you wanted access to the _current_ route's `loaderData` and `actionData`, you can call `useRoute` without arguments:

  ```tsx
  export function AdminWidget() {
    const currentRoute = useRoute();
    currentRoute.loaderData;
    currentRoute.actionData;
  }
  ```

  This usage is equivalent to calling `useLoaderData` and `useActionData`, but consolidates all route data access into one hook: `useRoute`.

  Note: when calling `useRoute()` (without a route ID), TS has no way to know which route is the current route.
  As a result, `loaderData` and `actionData` are typed as `unknown`.
  If you want more type-safety, you can either narrow the type yourself with something like `zod` or you can refactor your app to pass down typed props to your `AdminWidget`:

  ```tsx
  export function AdminWidget({
    message,
    count,
  }: {
    message: string;
    count: number;
  }) {
    /* ... */
  }
  ```

**Full Changelog**: [`v7.9.3...v7.9.4`](https://github.com/remix-run/react-router/compare/react-router@7.9.3...react-router@7.9.4)

## v7.9.3

Date: 2025-09-26

### Patch Changes

- `react-router` - Fix Data Mode regression causing a 404 during initial load in when `middleware` exists without any `loader` functions ([#14393](https://github.com/remix-run/react-router/pull/14393))
- `react-router` - Do not try to use `turbo-stream` to decode CDN errors that never reached the server ([#14385](https://github.com/remix-run/react-router/pull/14385))
  - This was logic we used to have in Remix v2 that got lost in the adoption of Single Fetch
  - This permits the actual CDN error to bubble to the `ErrorBoundary` instead of a generic _"Unable to decode turbo-stream response"_ error

**Full Changelog**: [`v7.9.2...v7.9.3`](https://github.com/remix-run/react-router/compare/react-router@7.9.2...react-router@7.9.3)

## v7.9.2

Date: 2025-09-24

### What's Changed

This release contains a handful of bug fixes, but we think you'll be most excited about the new unstable stuff 😉.

#### RSC Framework Mode (unstable)

This release includes our first release of unstable support for RSC in Framework Mode! You can read more about it in our [blog post](https://remix.run/blog/rsc-framework-mode-preview) and the [docs](https://reactrouter.com/how-to/react-server-components#rsc-framework-mode).

#### Fetcher Reset (unstable)

This release also includes a new (long-requested) `fetcher.unstable_reset()` API to reset fetchers back to their initial `idle` state.

### Patch Changes

- `react-router` - Ensure client-side router runs client `middleware` during initialization data load (if required) even if no loaders exist ([#14348](https://github.com/remix-run/react-router/pull/14348))
- `react-router` - Fix `middleware` prop not being supported on `<Route>` when used with a data router via `createRoutesFromElements` ([#14357](https://github.com/remix-run/react-router/pull/14357))
- `react-router` - Update `createRoutesStub` to work with `middleware` ([#14348](https://github.com/remix-run/react-router/pull/14348))
  - You will need to set the `<RoutesStub future={{ v8_middleware: true }} />` flag to enable the proper `context` type
- `react-router` - Update Lazy Route Discovery manifest requests to use a singular comma-separated `paths` query param instead of repeated `p` query params ([#14321](https://github.com/remix-run/react-router/pull/14321))
  - This is because Cloudflare has a hard limit of 100 URL search param key/value pairs when used as a key for caching purposes
  - If more that 100 paths were included, the cache key would be incomplete and could produce false-positive cache hits
- `react-router` - Fail gracefully on manifest version mismatch logic if `sessionStorage` access is blocked ([#14335](https://github.com/remix-run/react-router/pull/14335))
- `react-router` - Update `useOutlet` returned element to have a stable identity in-between route changes ([#13382](https://github.com/remix-run/react-router/pull/13382))
- `react-router` - Handle encoded question mark and hash characters in ancestor splat routes ([#14249](https://github.com/remix-run/react-router/pull/14249))
- `@react-router/dev` - Switch internal vite plugin Response logic to use `@remix-run/node-fetch-server` ([#13927](https://github.com/remix-run/react-router/pull/13927))
- `@react-router/dev` - Fix `presets` `future` flags being ignored during config resolution ([#14369](https://github.com/remix-run/react-router/pull/14369))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add `fetcher.unstable_reset()` API ([#14206](https://github.com/remix-run/react-router/pull/14206))
- `react-router` - In RSC Data Mode, handle SSR'd client errors and re-try in the browser ([#14342](https://github.com/remix-run/react-router/pull/14342))
- `react-router` - Enable full transition support for the RSC router ([#14362](https://github.com/remix-run/react-router/pull/14362))
- `@react-router/dev` - Add unstable support for RSC Framework Mode ([#14336](https://github.com/remix-run/react-router/pull/14336))
- `@react-router/serve` - Disable `compression()` middleware in RSC framework mode ([#14381](https://github.com/remix-run/react-router/pull/14381))

**Full Changelog**: [`v7.9.1...v7.9.2`](https://github.com/remix-run/react-router/compare/react-router@7.9.1...react-router@7.9.2)

## v7.9.1

Date: 2025-09-12

### Patch Changes

- Fix internal `Future` interface naming from `middleware` -> `v8_middleware` ([#14327](https://github.com/remix-run/react-router/pull/14327))

**Full Changelog**: [`v7.9.0...v7.9.1`](https://github.com/remix-run/react-router/compare/react-router@7.9.0...react-router@7.9.1)

## v7.9.0

Date: 2025-09-12

### Security Notice

This release addresses 1 security vulnerability:

- [XSS via Meta component when generating script:ld+json tags](https://github.com/remix-run/react-router/security/advisories/GHSA-3cgp-3xvw-98x8)

### What's Changed

#### Stable Middleware and Context APIs

We have removed the `unstable_` prefix from the following APIs and they are now considered stable and ready for production use:

- [`RouterContextProvider`](https://reactrouter.com/api/utils/RouterContextProvider)
- [`createContext`](https://reactrouter.com/api/utils/createContext)
- `createBrowserRouter` [`getContext`](https://reactrouter.com/api/data-routers/createBrowserRouter#optsgetcontext) option
- `<HydratedRouter>` [`getContext`](https://reactrouter.com/api/framework-routers/HydratedRouter#getcontext) prop

Please see the [Middleware Docs](https://reactrouter.com/how-to/middleware), the [Middleware RFC](https://github.com/remix-run/remix/discussions/7642), and the [Client-side Context RFC](https://github.com/remix-run/react-router/discussions/9856) for more information.

### Minor Changes

- Stabilize middleware and context APIs ([#14215](https://github.com/remix-run/react-router/pull/14215))

### Patch Changes

- `react-router` - Update `href()` to correctly process routes that have an extension after the parameter or are a single optional parameter ([#13797](https://github.com/remix-run/react-router/pull/13797))
- `react-router` - Escape HTML in `meta()` JSON-LD content ([#14316](https://github.com/remix-run/react-router/pull/14316))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - RSC: Add react-server `Await` component implementation ([#14261](https://github.com/remix-run/react-router/pull/14261))
- `react-router` - RSC: Fix hydration errors for routes that only have client loaders when using RSC in Data Mode along with a custom basename ([#14264](https://github.com/remix-run/react-router/pull/14264))
- `react-router` - RSC: Make `href` function available in a `react-server` context ([#14262](https://github.com/remix-run/react-router/pull/14262))
- `react-router` - RSC: Decode each time `getPayload()` is called to allow for "in-context" decoding and hoisting of contextual assets ([#14248](https://github.com/remix-run/react-router/pull/14248))

**Full Changelog**: [`v7.8.2...v7.9.0`](https://github.com/remix-run/react-router/compare/react-router@7.8.2...react-router@7.9.0)

## v7.8.2

Date: 2025-08-22

### Patch Changes

- `react-router` - Maintain `ReadonlyMap` and `ReadonlySet` types in server response data. ([#13092](https://github.com/remix-run/react-router/pull/13092))
- `react-router` - Fix `basename` usage without a leading slash in data routers ([#11671](https://github.com/remix-run/react-router/pull/11671))
- `react-router` - Fix `TypeError` if you throw from `patchRoutesOnNavigation` when no partial matches exist ([#14198](https://github.com/remix-run/react-router/pull/14198))
- `react-router` - Properly escape interpolated param values in `generatePath()` ([#13530](https://github.com/remix-run/react-router/pull/13530))
- `@react-router/dev` - Fix potential memory leak in default `entry.server` ([#14200](https://github.com/remix-run/react-router/pull/14200))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

**Client-side `onError`**

- `react-router` - Add `<RouterProvider unstable_onError>`/`<HydratedRouter unstable_onError>` prop for client side error reporting ([#14162](https://github.com/remix-run/react-router/pull/14162))

**Middleware**

- `react-router` - Delay serialization of `.data` redirects to 202 responses until after middleware chain ([#14205](https://github.com/remix-run/react-router/pull/14205))
- `react-router` - Update client middleware so it returns the `dataStrategy` results up the chain allowing for more advanced post-processing middleware ([#14151](https://github.com/remix-run/react-router/pull/14151), [#14212](https://github.com/remix-run/react-router/pull/14212))
- `react-router` - Remove Data Mode `future.unstable_middleware` flag from `createBrowserRouter` ([#14213](https://github.com/remix-run/react-router/pull/14213))
  - This is only needed as a Framework Mode flag because of the route modules and the `getLoadContext` type behavior change
  - In Data Mode, it's an opt-in feature because it's just a new property on a route object, so there's no behavior changes that necessitate a flag

**RSC**

- `react-router` - Allow opting out of revalidation on server actions with hidden `$SKIP_REVALIDATION` input ([#14154](https://github.com/remix-run/react-router/pull/14154))

**Full Changelog**: [`v7.8.1...v7.8.2`](https://github.com/remix-run/react-router/compare/react-router@7.8.1...react-router@7.8.2)

## v7.8.1

Date: 2025-08-15

### Patch Changes

- `react-router` - Fix usage of optional path segments in nested routes defined using absolute paths ([#14135](https://github.com/remix-run/react-router/pull/14135))
- `react-router` - Fix optional static segment matching in `matchPath` ([#11813](https://github.com/remix-run/react-router/pull/11813))
- `react-router` - Fix pre-rendering when a `basename` is set with `ssr:false` ([#13791](https://github.com/remix-run/react-router/pull/13791))
- `react-router` - Properly convert returned/thrown `data()` values to `Response` instances via `Response.json()` in resource routes and middleware ([#14159](https://github.com/remix-run/react-router/pull/14159), [#14181](https://github.com/remix-run/react-router/pull/14181))
- `@react-router/dev` - Update generated `Route.MetaArgs` type so `loaderData` is only potentially undefined when an `ErrorBoundary` export is present ([#14173](https://github.com/remix-run/react-router/pull/14173))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

**Middleware**

- `react-router` - Bubble client pre-`next` middleware errors to the shallowest ancestor that needs to load, not strictly the shallowest ancestor with a loader ([#14150](https://github.com/remix-run/react-router/pull/14150))
- `react-router` - Propagate non-redirect `Response` values thrown from middleware to the error boundary on document/data requests ([#14182](https://github.com/remix-run/react-router/pull/14182))

**RSC**

- `react-router` - Provide `isRouteErrorResponse` utility in `react-server` environments ([#14166](https://github.com/remix-run/react-router/pull/14166))
- `react-router` - Handle `meta` and `links` Route Exports in RSC Data Mode ([#14136](https://github.com/remix-run/react-router/pull/14136))

**Full Changelog**: [`v7.8.0...v7.8.1`](https://github.com/remix-run/react-router/compare/react-router@7.8.0...react-router@7.8.1)

## v7.8.0

Date: 2025-08-07

### What's Changed

#### Consistently named `loaderData` values

Ever noticed the discrepancies in loader data values handed to you by the framework? Like, we call it `loaderData` in your component props, but then `match.data` in your matches? Yeah, us too - as well as some keen-eyed React Router users who raised this in a proposal. We've added new `loaderData` fields alongside existing `data` fields in a few lingering spots to align with the `loaderData` naming used in the new `Route.*` APIs.

#### Improvements/fixes to the middleware APIs (unstable)

The biggest set of changes in `7.8.0` are to the `unstable_middleware` API's as we move closer to stabilizing them. If you've adopted the middleware APIs for early testing, please read the middleware changes below carefully. We hope to stabilize these soon so please let us know of any feedback you have on the API's in their current state!

### Minor Changes

- `react-router` - Add `nonce` prop to `Links` & `PrefetchPageLinks` ([#14048](https://github.com/remix-run/react-router/pull/14048))
- `react-router` - Add `loaderData` arguments/properties alongside existing `data` arguments/properties to provide consistency and clarity between `loaderData` and `actionData` across the board ([#14047](https://github.com/remix-run/react-router/pull/14047))
  - Updated types: `Route.MetaArgs`, `Route.MetaMatch`, `MetaArgs`, `MetaMatch`, `Route.ComponentProps.matches`, `UIMatch`
  - `@deprecated` warnings have been added to the existing `data` properties to point users to new `loaderData` properties, in preparation for removing the `data` properties in a future major release

### Patch Changes

- `react-router` - Prevent _"Did not find corresponding fetcher result"_ console error when navigating during a `fetcher.submit` revalidation ([#14114](https://github.com/remix-run/react-router/pull/14114))
- `react-router` - Switch Lazy Route Discovery manifest URL generation to use a standalone `URLSearchParams` instance instead of `URL.searchParams` to avoid a major performance bottleneck in Chrome ([#14084](https://github.com/remix-run/react-router/pull/14084))
- `react-router` - Adjust internal RSC usage of `React.use` to avoid Webpack compilation errors when using React 18 ([#14113](https://github.com/remix-run/react-router/pull/14113))
- `react-router` - Remove dependency on `@types/node` in TypeScript declaration files ([#14059](https://github.com/remix-run/react-router/pull/14059))
- `react-router` - Fix types for `UIMatch` to reflect that the `loaderData`/`data` properties may be `undefined` ([#12206](https://github.com/remix-run/react-router/pull/12206))
  - When an `ErrorBoundary` is being rendered, not all active matches will have loader data available, since it may have been their `loader` that threw to trigger the boundary
  - The `UIMatch.data` type was not correctly handing this and would always reflect the presence of data, leading to the unexpected runtime errors when an `ErrorBoundary` was rendered
  - ⚠️ This may cause some type errors to show up in your code for unguarded `match.data` accesses - you should properly guard for `undefined` values in those scenarios.

    ```tsx
    // app/root.tsx
    export function loader() {
      someFunctionThatThrows(); // ❌ Throws an Error
      return { title: "My Title" };
    }

    export function Layout({ children }: { children: React.ReactNode }) {
      let matches = useMatches();
      let rootMatch = matches[0] as UIMatch<Awaited<ReturnType<typeof loader>>>;
      //  ^ rootMatch.data is currently incorrectly typed here, so TypeScript does
      //    not complain if you do the following which throws an error at runtime:
      let { title } = rootMatch.data; // 💥

      return <html>...</html>;
    }
    ```

- `@react-router/dev` - Fix rename without mkdir in Vite plugin ([#14105](https://github.com/remix-run/react-router/pull/14105))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

**RSC**

- `react-router` - Fix Data Mode issue where routes that return `false` from `shouldRevalidate` would be replaced by an `<Outlet />` ([#14071](https://github.com/remix-run/react-router/pull/14071))
- `react-router` - Proxy server action side-effect redirects from actions for document and `callServer` requests ([#14131](https://github.com/remix-run/react-router/pull/14131))

**Middleware**

- `react-router` - Change the `unstable_getContext` signature on `RouterProvider`, `HydratedRouter`, and `unstable_RSCHydratedRouter` so that it returns an `unstable_RouterContextProvider` instance instead of a `Map` used to construct the instance internally ([#14097](https://github.com/remix-run/react-router/pull/14097))
  - See the [docs](https://reactrouter.com/api/data-routers/createBrowserRouter#optsunstable_getcontext) for more information
  - ⚠️ This is a breaking change if you have adopted the `unstable_getContext` prop
- `react-router` - Run client middleware on client navigations even if no loaders exist ([#14106](https://github.com/remix-run/react-router/pull/14106))
- `react-router` - Convert internal middleware implementations to use the new `unstable_generateMiddlewareResponse` API ([#14103](https://github.com/remix-run/react-router/pull/14103))
- `react-router` - Ensure resource route errors go through `handleError` w/middleware enabled ([#14078](https://github.com/remix-run/react-router/pull/14078))
- `react-router` - Propagate returned `Response` from server middleware if `next` wasn't called ([#14093](https://github.com/remix-run/react-router/pull/14093))
- `react-router` - Allow server middlewares to return `data()` values which will be converted into a `Response` ([#14093](https://github.com/remix-run/react-router/pull/14093), [#14128](https://github.com/remix-run/react-router/pull/14128))
- `react-router` - Update middleware error handling so that the `next` function never throws and instead handles any middleware errors at the proper `ErrorBoundary` and returns the `Response` up through the ancestor `next` function ([#14118](https://github.com/remix-run/react-router/pull/14118))
  - See the [error handling docs](https://reactrouter.com/how-to/middleware#next-and-error-handling) for more information
  - ⚠️ This changes existing functionality so if you are currently wrapping `next` calls in `try`/`catch` you should be able to remove those
- `react-router` - Bubble client-side middleware errors prior to `next` to the appropriate ancestor error boundary ([#14138](https://github.com/remix-run/react-router/pull/14138))
- `react-router` - When middleware is enabled, make the `context` parameter read-only (`Readonly<unstable_RouterContextProvider>`) so that TypeScript will not allow you to write arbitrary fields to it in loaders, actions, or middleware. ([#14097](https://github.com/remix-run/react-router/pull/14097))
- `react-router` - Rename and alter the signature/functionality of the `unstable_respond` API in `staticHandler.query`/`staticHandler.queryRoute` ([#14103](https://github.com/remix-run/react-router/pull/14103))
  - This only impacts users using `createStaticHandler()` for manual data loading during non-Framework Mode SSR
  - The API has been renamed to `unstable_generateMiddlewareResponse` for clarity
  - The main functional change is that instead of running the loaders/actions before calling `unstable_respond` and handing you the result, we now pass a `query`/`queryRoute` function as a parameter and you execute the loaders/actions inside your callback, giving you full access to pre-processing and error handling
  - The `query` version of the API now has a signature of `(query: (r: Request) => Promise<StaticHandlerContext | Response>) => Promise<Response>`
  - The `queryRoute` version of the API now has a signature of `(queryRoute: (r: Request) => Promise<Response>) => Promise<Response>`
  - This allows for more advanced usages such as running logic before/after calling `query` and direct error handling of errors thrown from query
  - ⚠️ This is a breaking change if you've adopted the `staticHandler` `unstable_respond` API

    ```tsx
    let response = await staticHandler.query(request, {
      requestContext: new unstable_RouterContextProvider(),
      async unstable_generateMiddlewareResponse(query) {
        try {
          // At this point we've run middleware top-down so we need to call the
          // handlers and generate the Response to bubble back up the middleware
          let result = await query(request);
          if (isResponse(result)) {
            return result; // Redirects, etc.
          }
          return await generateHtmlResponse(result);
        } catch (error: unknown) {
          return generateErrorResponse(error);
        }
      },
    });
    ```

- `@react-router/{architect,cloudflare,express,node}` - Change the `getLoadContext` signature (`type GetLoadContextFunction`) when `future.unstable_middleware` is enabled so that it returns an `unstable_RouterContextProvider` instance instead of a `Map` used to construct the instance internally ([#14097](https://github.com/remix-run/react-router/pull/14097))
  - This also removes the `type unstable_InitialContext` export
  - See the [middleware `getLoadContext` docs](https://reactrouter.com/how-to/middleware#changes-to-getloadcontextapploadcontext) for more information
  - ⚠️ This is a breaking change if you have adopted middleware and are using a custom server with a `getLoadContext` function

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/create-react-router/CHANGELOG.md#780)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router/CHANGELOG.md#780)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-architect/CHANGELOG.md#780)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-cloudflare/CHANGELOG.md#780)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-dev/CHANGELOG.md#780)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-express/CHANGELOG.md#780)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-fs-routes/CHANGELOG.md#780)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-node/CHANGELOG.md#780)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#780)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.8.0/packages/react-router-serve/CHANGELOG.md#780)

**Full Changelog**: [`v7.7.1...v7.8.0`](https://github.com/remix-run/react-router/compare/react-router@7.7.1...react-router@7.8.0)

## v7.7.1

Date: 2025-07-24

### Patch Changes

- `@react-router/dev` - Update to Prettier v3 for formatting when running `react-router reveal --no-typescript` ([#14049](https://github.com/remix-run/react-router/pull/14049))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - RSC Data Mode: fix bug where routes with errors weren't forced to revalidate when `shouldRevalidate` returned `false` ([#14026](https://github.com/remix-run/react-router/pull/14026))
- `react-router` - RSC Data Mode: fix `Matched leaf route at location "/..." does not have an element or Component` warnings when error boundaries are rendered ([#14021](https://github.com/remix-run/react-router/pull/14021))

**Full Changelog**: [`v7.7.0...v7.7.1`](https://github.com/remix-run/react-router/compare/react-router@7.7.0...react-router@7.7.1)

## v7.7.0

Date: 2025-07-16

### What's Changed

#### Unstable RSC APIs

We're excited to introduce experimental support for RSC in Data Mode via the following new APIs:

- [`unstable_RSCHydratedRouter`](https://reactrouter.com/api/rsc/RSCHydratedRouter)
- [`unstable_RSCStaticRouter`](https://reactrouter.com/api/rsc/RSCStaticRouter)
- [`unstable_createCallServer`](https://reactrouter.com/api/rsc/createCallServer)
- [`unstable_getRSCStream`](https://reactrouter.com/api/rsc/getRSCStream)
- [`unstable_matchRSCServerRequest`](https://reactrouter.com/api/rsc/matchRSCServerRequest)
- [`unstable_routeRSCServerRequest`](https://reactrouter.com/api/rsc/routeRSCServerRequest)

For more information, check out the [blog post](https://remix.run/blog/react-router-and-react-server-components) and the [RSC Docs](https://reactrouter.com/how-to/react-server-components).

### Minor Changes

- `create-react-router` - Add Deno as a supported and detectable package manager. Note that this detection will only work with Deno versions 2.0.5 and above. If you are using an older version version of Deno then you must specify the --package-manager CLI flag set to `deno`. ([#12327](https://github.com/remix-run/react-router/pull/12327))
- `@react-router/remix-config-routes-adapter` - Export `DefineRouteFunction` type alongside `DefineRoutesFunction` ([#13945](https://github.com/remix-run/react-router/pull/13945))

### Patch Changes

- `react-router` - Handle `InvalidCharacterError` when validating cookie signature ([#13847](https://github.com/remix-run/react-router/pull/13847))
- `react-router` - Pass a copy of `searchParams` to the `setSearchParams` callback function to avoid mutations of the internal `searchParams` instance ([#12784](https://github.com/remix-run/react-router/pull/12784))
  - This causes bugs if you mutate the current stateful `searchParams` when a navigation is blocked because the internal instance gets out of sync with `useLocation().search`
- `react-router` - Support invalid `Date` in `turbo-stream` v2 fork ([#13684](https://github.com/remix-run/react-router/pull/13684))
- `react-router` - In Framework Mode, clear critical CSS in development after initial render ([#13872](https://github.com/remix-run/react-router/pull/13872), [#13995](https://github.com/remix-run/react-router/pull/13995))
- `react-router` - Strip search parameters from `patchRoutesOnNavigation` `path` param for fetcher calls ([#13911](https://github.com/remix-run/react-router/pull/13911))
- `react-router` - Skip scroll restoration on `useRevalidator()` calls because they're not new locations ([#13671](https://github.com/remix-run/react-router/pull/13671))
- `react-router` - Support unencoded UTF-8 routes in prerender config with `ssr` set to `false` ([#13699](https://github.com/remix-run/react-router/pull/13699))
- `react-router` - Do not throw if the url hash is not a valid URI component ([#13247](https://github.com/remix-run/react-router/pull/13247))
- `react-router` - Remove `Content-Length` header from Single Fetch responses ([#13902](https://github.com/remix-run/react-router/pull/13902))
- `react-router` - Fix a regression in `createRoutesStub` introduced with the middleware feature ([#13946](https://github.com/remix-run/react-router/pull/13946))
  - As part of that work we altered the signature to align with the new middleware APIs without making it backwards compatible with the prior `AppLoadContext` API
  - This permitted `createRoutesStub` to work if you were opting into middleware and the updated `context` typings, but broke `createRoutesStub` for users not yet opting into middleware
  - We've reverted this change and re-implemented it in such a way that both sets of users can leverage it
  - ⚠️ This may be a breaking bug for if you have adopted the unstable Middleware feature and are using `createRoutesStub` with the updated API.

    ```tsx
    // If you have not opted into middleware, the old API should work again
    let context: AppLoadContext = {
      /*...*/
    };
    let Stub = createRoutesStub(routes, context);

    // If you have opted into middleware, you should now pass an instantiated
    // `unstable_routerContextProvider` instead of a `getContext` factory function.
    let context = new unstable_RouterContextProvider();
    context.set(SomeContext, someValue);
    let Stub = createRoutesStub(routes, context);
    ```

- `@react-router/dev` - Update `vite-node` to `^3.2.2` to support Vite 7 ([#13781](https://github.com/remix-run/react-router/pull/13781))
- `@react-router/dev` - Properly handle `https` protocol in dev mode ([#13746](https://github.com/remix-run/react-router/pull/13746))
- `@react-router/dev` - Fix missing styles when Vite's `build.cssCodeSplit` option is disabled ([#13943](https://github.com/remix-run/react-router/pull/13943))
- `@react-router/dev` - Allow `.mts` and `.mjs` extensions for route config file ([#13931](https://github.com/remix-run/react-router/pull/13931))
- `@react-router/dev` - Fix prerender file locations when `cwd` differs from project root ([#13824](https://github.com/remix-run/react-router/pull/13824))
- `@react-router/dev` - Improve chunk error logging when a chunk cannot be found during the build ([#13799](https://github.com/remix-run/react-router/pull/13799))
- `@react-router/dev` - Fix incorrectly configured `externalConditions` which had enabled `module` condition for externals and broke builds with certain packages (like Emotion) ([#13871](https://github.com/remix-run/react-router/pull/13871))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- Add unstable RSC support for Data Mode ([#13700](https://github.com/remix-run/react-router/pull/13700))
  - For more information, see the [RSC documentation](https://reactrouter.com/how-to/react-server-components)

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/create-react-router/CHANGELOG.md#770)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router/CHANGELOG.md#770)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-architect/CHANGELOG.md#770)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-cloudflare/CHANGELOG.md#770)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-dev/CHANGELOG.md#770)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-express/CHANGELOG.md#770)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-fs-routes/CHANGELOG.md#770)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-node/CHANGELOG.md#770)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#770)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.7.0/packages/react-router-serve/CHANGELOG.md#770)

**Full Changelog**: [`v7.6.3...v7.7.0`](https://github.com/remix-run/react-router/compare/react-router@7.6.3...react-router@7.7.0)

## v7.6.3

Date: 2025-06-27

### Patch Changes

- `react-router` - Do not serialize types for `useRouteLoaderData<typeof clientLoader>` ([#13752](https://github.com/remix-run/react-router/pull/13752))
  - For types to distinguish a `clientLoader` from a `serverLoader`, you MUST annotate `clientLoader` args:

    ```ts
    //                                   👇 annotation required to skip serializing types
    export function clientLoader({}: Route.ClientLoaderArgs) {
      return { fn: () => "earth" };
    }

    function SomeComponent() {
      const data = useRouteLoaderData<typeof clientLoader>("routes/this-route");
      const planet = data?.fn() ?? "world";
      return <h1>Hello, {planet}!</h1>;
    }
    ```

- `@react-router/cloudflare` - Remove `tsup` from `peerDependencies` ([#13757](https://github.com/remix-run/react-router/pull/13757))
- `@react-router/dev` - Add Vite 7 support ([#13748](https://github.com/remix-run/react-router/pull/13748))
- `@react-router/dev` - Skip `package.json` resolution checks when a custom `entry.server.(j|t)sx` file is provided ([#13744](https://github.com/remix-run/react-router/pull/13744))
- `@react-router/dev` - Add validation for a route's id not being 'root' ([#13792](https://github.com/remix-run/react-router/pull/13792))
- `@react-router/fs-routes` `@react-router/remix-config-routes-adapter` - Use `replaceAll` for normalizing windows file system slashes ([#13738](https://github.com/remix-run/react-router/pull/13738))
- `@react-router/node` - Remove old "install" package exports ([#13762](https://github.com/remix-run/react-router/pull/13762))

**Full Changelog**: [`v7.6.2...v7.6.3`](https://github.com/remix-run/react-router/compare/react-router@7.6.2...react-router@7.6.3)

## v7.6.2

Date: 2025-06-03

### Patch Changes

- `create-react-router` - Update `tar-fs` ([#13675](https://github.com/remix-run/react-router/pull/13675))
- `react-router` - (INTERNAL) Slight refactor of internal `headers()` function processing for use with RSC ([#13639](https://github.com/remix-run/react-router/pull/13639))
- `react-router` `@react-router/dev` - Avoid additional `with-props` chunk in Framework Mode by moving route module component prop logic from the Vite plugin to `react-router` ([#13650](https://github.com/remix-run/react-router/pull/13650))
- `@react-router/dev` - When `future.unstable_viteEnvironmentApi` is enabled and an absolute Vite `base` has been configured, ensure critical CSS is handled correctly during development ([#13598](https://github.com/remix-run/react-router/pull/13598))
- `@react-router/dev` - Update `vite-node` ([#13673](https://github.com/remix-run/react-router/pull/13673))
- `@react-router/dev` - Fix typegen for non-{.js,.jsx,.ts,.tsx} routes like .mdx ([#12453](https://github.com/remix-run/react-router/pull/12453))
- `@react-router/dev` - Fix href types for optional dynamic params ([#13725](https://github.com/remix-run/react-router/pull/13725))

  7.6.1 introduced fixes for `href` when using optional static segments,
  but those fixes caused regressions with how optional dynamic params worked in 7.6.0:

  ```ts
  // 7.6.0
  href("/users/:id?"); // ✅
  href("/users/:id?", { id: 1 }); // ✅

  // 7.6.1
  href("/users/:id?"); // ❌
  href("/users/:id?", { id: 1 }); // ❌
  ```

  Now, optional static segments are expanded into different paths for `href`, but optional dynamic params are not.
  This way `href` can unambiguously refer to an exact URL path, all while keeping the number of path options to a minimum.

  ```ts
  // 7.6.2

  // path: /users/:id?/edit?
  href("
  //    ^ suggestions when cursor is here:
  //
  //    /users/:id?
  //    /users/:id?/edit
  ```

  Additionally, you can pass `params` from component props without needing to narrow them manually:

  ```ts
  declare const params: { id?: number };

  // 7.6.0
  href("/users/:id?", params);

  // 7.6.1
  href("/users/:id?", params); // ❌
  "id" in params ? href("/users/:id", params) : href("/users"); // works... but is annoying

  // 7.6.2
  href("/users/:id?", params); // restores behavior of 7.6.0
  ```

**Full Changelog**: [`v7.6.1...v7.6.2`](https://github.com/remix-run/react-router/compare/react-router@7.6.1...react-router@7.6.2)

## v7.6.1

Date: 2025-05-25

### Patch Changes

- `react-router` - Partially revert optimization added in `7.1.4` to reduce calls to `matchRoutes` because it surfaced other issues ([#13562](https://github.com/remix-run/react-router/pull/13562))
- `react-router` - Update `Route.MetaArgs` to reflect that `data` can be potentially `undefined` ([#13563](https://github.com/remix-run/react-router/pull/13563))
  - This is primarily for cases where a route `loader` threw an error to it's own `ErrorBoundary`, but it also arises in the case of a 404 which renders the root `ErrorBoundary`/`meta` but the root `loader` did not run because not routes matched
- `react-router` - Avoid initial fetcher execution 404 error when Lazy Route Discovery is interrupted by a navigation ([#13564](https://github.com/remix-run/react-router/pull/13564))
- `react-router` - Properly `href` replaces splats `*` ([#13593](https://github.com/remix-run/react-router/pull/13593))
  - `href("/products/*", { "*": "/1/edit" }); // -> /products/1/edit`
- `@react-router/architect` - Update `@architect/functions` from `^5.2.0` to `^7.0.0` ([#13556](https://github.com/remix-run/react-router/pull/13556))
- `@react-router/dev` - Prevent typegen with route files that are outside the `app/` directory ([#12996](https://github.com/remix-run/react-router/pull/12996))
- `@react-router/dev` - Add additional logging to `build` command output when cleaning assets from server build ([#13547](https://github.com/remix-run/react-router/pull/13547))
- `@react-router/dev` - Don't clean assets from server build when `build.ssrEmitAssets` has been enabled in Vite config ([#13547](https://github.com/remix-run/react-router/pull/13547))
- `@react-router/dev` - Fix typegen when same route is used at multiple paths ([#13574](https://github.com/remix-run/react-router/pull/13574))
  - For example, `routes/route.tsx` is used at 4 different paths here:

    ```ts
    import { type RouteConfig, route } from "@react-router/dev/routes";
    export default [
      route("base/:base", "routes/base.tsx", [
        route("home/:home", "routes/route.tsx", { id: "home" }),
        route("changelog/:changelog", "routes/route.tsx", { id: "changelog" }),
        route("splat/*", "routes/route.tsx", { id: "splat" }),
      ]),
      route("other/:other", "routes/route.tsx", { id: "other" }),
    ] satisfies RouteConfig;
    ```

  - Previously, typegen would arbitrarily pick one of these paths to be the "winner" and generate types for the route module based on that path
  - Now, typegen creates unions as necessary for alternate paths for the same route file

- `@react-router/dev` - Better types for `params` ([#13543](https://github.com/remix-run/react-router/pull/13543))
  - For example:

    ```ts
    // routes.ts
    import { type RouteConfig, route } from "@react-router/dev/routes";

    export default [
      route("parent/:p", "routes/parent.tsx", [
        route("route/:r", "routes/route.tsx", [
          route("child1/:c1a/:c1b", "routes/child1.tsx"),
          route("child2/:c2a/:c2b", "routes/child2.tsx"),
        ]),
      ]),
    ] satisfies RouteConfig;
    ```

  - Previously, `params` for `routes/route` were calculated as `{ p: string, r: string }`.
  - This incorrectly ignores params that could come from child routes
  - If visiting `/parent/1/route/2/child1/3/4`, the actual params passed to `routes/route` will have a type of `{ p: string, r: string, c1a: string, c1b: string }`
  - Now, `params` are aware of child routes and autocompletion will include child params as optionals:

    ```ts
    params.|
    //     ^ cursor is here and you ask for autocompletion
    // p: string
    // r: string
    // c1a?: string
    // c1b?: string
    // c2a?: string
    // c2b?: string
    ```

  - You can also narrow the types for `params` as it is implemented as a normalized union of params for each page that includes `routes/route`:

    ```ts
    if (typeof params.c1a === 'string') {
      params.|
      //     ^ cursor is here and you ask for autocompletion
      // p: string
      // r: string
      // c1a: string
      // c1b: string
    }
    ```

- `@react-router/dev` - Fix `href` for optional segments ([#13595](https://github.com/remix-run/react-router/pull/13595))
  - Type generation now expands paths with optionals into their corresponding non-optional paths
  - For example, the path `/user/:id?` gets expanded into `/user` and `/user/:id` to more closely model visitable URLs
  - `href` then uses these expanded (non-optional) paths to construct type-safe paths for your app:

    ```ts
    // original: /user/:id?
    // expanded: /user & /user/:id
    href("/user"); // ✅
    href("/user/:id", { id: 1 }); // ✅
    ```

  - This becomes even more important for static optional paths where there wasn't a good way to indicate whether the optional should be included in the resulting path:

    ```ts
    // original: /products/:id/detail?

    // before
    href("/products/:id/detail?"); // ❌ How can we tell `href` to include or omit `detail?` segment with a complex API?

    // now
    // expanded: /products/:id & /products/:id/detail
    href("/product/:id"); // ✅
    href("/product/:id/detail"); // ✅
    ```

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `@react-router/dev` - Renamed internal `react-router/route-module` export to `react-router/internal` ([#13543](https://github.com/remix-run/react-router/pull/13543))
- `@react-router/dev` - Removed `Info` export from generated `+types/*` files ([#13543](https://github.com/remix-run/react-router/pull/13543))
- `@react-router/dev` - Normalize dirent entry path across node versions when generating SRI manifest ([#13591](https://github.com/remix-run/react-router/pull/13591))

**Full Changelog**: [`v7.6.0...v7.6.1`](https://github.com/remix-run/react-router/compare/react-router@7.6.0...react-router@7.6.1)

## v7.6.0

Date: 2025-05-08

### What's Changed

#### `routeDiscovery` Config Option

We've added a new config option in `7.6.0` which grants you more control over the Lazy Route Discovery feature. You can now configure the `/__manifest` path if you're running multiple RR applications on the same server, or you can also disable the feature entirely if your application is small enough and the feature isn't necessary.

```ts
// react-router.config.ts

export default {
  // You can modify the manifest path used:
  routeDiscovery: { mode: "lazy", manifestPath: "/custom-manifest" }

  // Or you can disable this feature entirely and include all routes in the
  // manifest on initial document load:
  routeDiscovery: { mode: "initial" }

  // If you don't specify anything, the default config is as follows, which enables
  // Lazy Route Discovery and makes manifest requests to the `/__manifest` path:
  // routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" }
} satisfies Config;
```

#### Automatic Types for Future Flags

Some future flags alter the way types should work in React Router. Previously, you had to remember to manually opt-in to the new types. For example, for `future.unstable_middleware`:

```ts
// react-router.config.ts

// Step 1: Enable middleware
export default {
  future: {
    unstable_middleware: true,
  },
};

// Step 2: Enable middleware types
declare module "react-router" {
  interface Future {
    unstable_middleware: true; // 👈 Enable middleware types
  }
}
```

It was up to you to keep the runtime future flags synced with the types for those flags. This was confusing and error-prone.

Now, React Router will automatically enable types for future flags. That means you only need to specify the runtime future flag:

```ts
// react-router.config.ts

// Step 1: Enable middleware
export default {
  future: {
    unstable_middleware: true,
  },
};

// No step 2! That's it!
```

Behind the scenes, React Router will generate the corresponding `declare module` into `.react-router/types`. Currently this is done in `.react-router/types/+register.ts` but this is an implementation detail that may change in the future.

### Minor Changes

- `react-router` - Added a new `routeDiscovery` option in `react-router.config.ts` to configure Lazy Route Discovery behavior ([#13451](https://github.com/remix-run/react-router/pull/13451))
- `react-router` - Add support for route component props in `createRoutesStub` ([#13528](https://github.com/remix-run/react-router/pull/13528))
  - This allows you to unit test your route components using the props instead of the hooks:

    ```tsx
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        Component({ loaderData }) {
          let data = loaderData as { message: string };
          return <pre data-testid="data">Message: {data.message}</pre>;
        },
        loader() {
          return { message: "hello" };
        },
      },
    ]);

    render(<RoutesStub />);

    await waitFor(() => screen.findByText("Message: hello"));
    ```

- `@react-router/dev` - Automatic types for future flags ([#13506](https://github.com/remix-run/react-router/pull/13506))

### Patch Changes

You may notice this list is a bit larger than usual! The team ate their vegetables last week and spent the week [squashing bugs](https://x.com/BrooksLybrand/status/1918406062920589731) to work on lowering the issue count that had ballooned a bit since the v7 release.

- `react-router` - Fix `react-router` module augmentation for `NodeNext` ([#13498](https://github.com/remix-run/react-router/pull/13498))
- `react-router` - Don't bundle `react-router` in `react-router/dom` CJS export ([#13497](https://github.com/remix-run/react-router/pull/13497))
- `react-router` - Fix bug where a submitting `fetcher` would get stuck in a `loading` state if a revalidating `loader` redirected ([#12873](https://github.com/remix-run/react-router/pull/12873))
- `react-router` - Fix hydration error if a server `loader` returned `undefined` ([#13496](https://github.com/remix-run/react-router/pull/13496))
- `react-router` - Fix initial load 404 scenarios in data mode ([#13500](https://github.com/remix-run/react-router/pull/13500))
- `react-router` - Stabilize `useRevalidator`'s `revalidate` function ([#13542](https://github.com/remix-run/react-router/pull/13542))
- `react-router` - Preserve status code if a `clientAction` throws a `data()` result in framework mode ([#13522](https://github.com/remix-run/react-router/pull/13522))
- `react-router` - Be defensive against leading double slashes in paths to avoid `Invalid URL` errors from the URL constructor ([#13510](https://github.com/remix-run/react-router/pull/13510))
  - Note we do not sanitize/normalize these paths - we only detect them so we can avoid the error that would be thrown by `new URL("//", window.location.origin)`
- `react-router` - Remove `Navigator` declaration for `navigator.connection.saveData` to avoid messing with any other types beyond `saveData` in user land ([#13512](https://github.com/remix-run/react-router/pull/13512))
- `react-router` - Fix `handleError` `params` values on `.data` requests for routes with a dynamic param as the last URL segment ([#13481](https://github.com/remix-run/react-router/pull/13481))
- `react-router` - Don't trigger an `ErrorBoundary` UI before the reload when we detect a manifest version mismatch in Lazy Route Discovery ([#13480](https://github.com/remix-run/react-router/pull/13480))
- `react-router` - Inline `turbo-stream@2.4.1` dependency and fix decoding ordering of `Map`/`Set` instances ([#13518](https://github.com/remix-run/react-router/pull/13518))
- `react-router` - Only render dev warnings during dev ([#13461](https://github.com/remix-run/react-router/pull/13461))
- `react-router` - Short circuit post-processing on aborted `dataStrategy` requests ([#13521](https://github.com/remix-run/react-router/pull/13521))
  - This resolves non-user-facing console errors of the form `Cannot read properties of undefined (reading 'result')`
- `@react-router/dev` - Support project root directories without a `package.json` if it exists in a parent directory ([#13472](https://github.com/remix-run/react-router/pull/13472))
- `@react-router/dev` - When providing a custom Vite config path via the CLI `--config`/`-c` flag, default the project root directory to the directory containing the Vite config when not explicitly provided ([#13472](https://github.com/remix-run/react-router/pull/13472))
- `@react-router/dev` - In a `routes.ts` context, ensure the `--mode` flag is respected for `import.meta.env.MODE` ([#13485](https://github.com/remix-run/react-router/pull/13485))
  - Previously, `import.meta.env.MODE` within a `routes.ts` context was always `"development"` for the `dev` and `typegen --watch` commands, but otherwise resolved to `"production"`. These defaults are still in place, but if a `--mode` flag is provided, this will now take precedence.
- `@react-router/dev` - Ensure consistent project root directory resolution logic in CLI commands ([#13472](https://github.com/remix-run/react-router/pull/13472))
- `@react-router/dev` - When executing `react-router.config.ts` and `routes.ts` with `vite-node`, ensure that PostCSS config files are ignored ([#13489](https://github.com/remix-run/react-router/pull/13489))
- `@react-router/dev` - When extracting critical CSS during development, ensure it's loaded from the client environment to avoid issues with plugins that handle the SSR environment differently ([#13503](https://github.com/remix-run/react-router/pull/13503))
- `@react-router/dev` - Fix "Status message is not supported by HTTP/2" error during dev when using HTTPS ([#13460](https://github.com/remix-run/react-router/pull/13460))
- `@react-router/dev` - Update config when `react-router.config.ts` is created or deleted during development ([#12319](https://github.com/remix-run/react-router/pull/12319))
- `@react-router/dev` - Skip unnecessary `routes.ts` evaluation before Vite build is started ([#13513](https://github.com/remix-run/react-router/pull/13513))
- `@react-router/dev` - Fix `TS2300: Duplicate identifier` errors caused by generated types ([#13499](https://github.com/remix-run/react-router/pull/13499))
- Previously, routes that had the same full path would cause duplicate entries in the generated types for `href` (`.react-router/types/+register.ts`), causing type checking errors

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Fix a few bugs with error bubbling in middleware use-cases ([#13538](https://github.com/remix-run/react-router/pull/13538))
- `@react-router/dev` - When `future.unstable_viteEnvironmentApi` is enabled, ensure that `build.assetsDir` in Vite config is respected when `environments.client.build.assetsDir` is not configured ([#13491](https://github.com/remix-run/react-router/pull/13491))

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/create-react-router/CHANGELOG.md#760)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router/CHANGELOG.md#760)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-architect/CHANGELOG.md#760)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-cloudflare/CHANGELOG.md#760)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-dev/CHANGELOG.md#760)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-express/CHANGELOG.md#760)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-fs-routes/CHANGELOG.md#760)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-node/CHANGELOG.md#760)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#760)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.6.0/packages/react-router-serve/CHANGELOG.md#760)

**Full Changelog**: [`v7.5.3...v7.6.0`](https://github.com/remix-run/react-router/compare/react-router@7.5.3...react-router@7.6.0)

## v7.5.3

Date: 2025-04-28

### Patch Changes

- `react-router` - Fix bug where bubbled action errors would result in `loaderData` being cleared at the handling `ErrorBoundary` route ([#13476](https://github.com/remix-run/react-router/pull/13476))
- `react-router` - Handle redirects from `clientLoader.hydrate` initial load executions ([#13477](https://github.com/remix-run/react-router/pull/13477))

**Full Changelog**: [`v7.5.2...v7.5.3`](https://github.com/remix-run/react-router/compare/react-router@7.5.2...react-router@7.5.3)

## v7.5.2

Date: 2025-04-24

### Security Notice

Fixed 2 security vulnerabilities that could result in cache-poisoning attacks by sending specific headers intended for build-time usage for SPA Mode and Pre-rendering ([GHSA-f46r-rw29-r322](https://github.com/remix-run/react-router/security/advisories/GHSA-f46r-rw29-r322), [GHSA-cpj6-fhp6-mr6j](https://github.com/remix-run/react-router/security/advisories/GHSA-cpj6-fhp6-mr6j)).

### Patch Changes

- `react-router` - Adjust approach for Pre-rendering/SPA Mode via headers ([#13453](https://github.com/remix-run/react-router/pull/13453))
- `react-router` - Update Single Fetch to also handle the 204 redirects used in `?_data` requests in Remix v2 ([#13364](https://github.com/remix-run/react-router/pull/13364))
  - This allows applications to trigger a redirect on `.data` requests from outside the scope of React Router (i.e., an `express`/`hono` middleware) the same way they did in Remix v2 before Single Fetch was implemented
  - This is a bit of an escape hatch - the recommended way to handle this is redirecting from a root route middleware
  - To use this functionality, you may return from a `.data` request wih a response as follows:
    - Set a 204 status code
    - Set an `X-Remix-Redirect: <new-location>` header
    - Optionally, set `X-Remix-Replace: true` or `X-Remix-Reload-Document: true` headers to replicate `replace()`/`redirectDocument()` functionality
  - ⚠️ Please note that these responses rely on implementation details that are subject to change without a SemVer major release, and it is recommended you set up integration tests for your application to confirm this functionality is working correctly with each future React Router upgrade

**Full Changelog**: [`v7.5.1...v7.5.2`](https://github.com/remix-run/react-router/compare/react-router@7.5.1...react-router@7.5.2)

## v7.5.1

Date: 2025-04-17

### Patch Changes

- `react-router` - When using the object-based `route.lazy` API, the `HydrateFallback` and `hydrateFallbackElement` properties are now skipped when lazy loading routes after hydration ([#13376](https://github.com/remix-run/react-router/pull/13376))
  - If you move the code for these properties into a separate file, since the hydrate properties were unused already (if the route wasn't present during hydration), you can avoid downloading them at all. For example:

    ```ts
    createBrowserRouter([
      {
        path: "/show/:showId",
        lazy: {
          loader: async () => (await import("./show.loader.js")).loader,
          Component: async () =>
            (await import("./show.component.js")).Component,
          HydrateFallback: async () =>
            (await import("./show.hydrate-fallback.js")).HydrateFallback,
        },
      },
    ]);
    ```

- `react-router` - Fix single fetch bug where no revalidation request would be made when navigating upwards to a reused parent route ([#13253](https://github.com/remix-run/react-router/pull/13253))
- `react-router` - Properly revalidate pre-rendered paths when param values change when using `ssr:false` + `prerender` configs ([#13380](https://github.com/remix-run/react-router/pull/13380))
- `react-router` - Fix pre-rendering when a loader returns a redirect ([#13365](https://github.com/remix-run/react-router/pull/13365))
- `react-router` - Do not automatically add `null` to `staticHandler.query()` `context.loaderData` if routes do not have loaders ([#13223](https://github.com/remix-run/react-router/pull/13223))
  - This was a Remix v2 implementation detail inadvertently left in for React Router v7
  - Now that we allow returning `undefined` from loaders, our prior check of `loaderData[routeId] !== undefined` was no longer sufficient and was changed to a `routeId in loaderData` check - these `null` values can cause issues for this new check
  - ⚠️ This could be a "breaking bug fix" for you if you are doing manual SSR with `createStaticHandler()`/`<StaticRouterProvider>`, and using `context.loaderData` to control `<RouterProvider>` hydration behavior on the client

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add better error messaging when `getLoadContext` is not updated to return a `Map` ([#13242](https://github.com/remix-run/react-router/pull/13242))
- `react-router` - Update context type for `LoaderFunctionArgs`/`ActionFunctionArgs` when middleware is enabled ([#13381](https://github.com/remix-run/react-router/pull/13381))
- `react-router` - Add a new `unstable_runClientMiddleware` argument to `dataStrategy` to enable middleware execution in custom `dataStrategy` implementations ([#13395](https://github.com/remix-run/react-router/pull/13395))
- `react-router` - Add support for the new `unstable_shouldCallHandler`/`unstable_shouldRevalidateArgs` APIs in `dataStrategy` ([#13253](https://github.com/remix-run/react-router/pull/13253))

**Full Changelog**: [`v7.5.0...v7.5.1`](https://github.com/remix-run/react-router/compare/react-router@7.5.0...react-router@7.5.1)

## v7.5.0

Date: 2025-04-04

### What's Changed

#### `route.lazy` Object API

We've introduced a new `route.lazy` API which gives you more granular control over the lazy loading of route properties that you could not achieve with the `route.lazy()` function signature. This is useful for Framework mode and performance-critical library mode applications.

```ts
createBrowserRouter([
  {
    path: "/show/:showId",
    lazy: {
      loader: async () => (await import("./show.loader.js")).loader,
      action: async () => (await import("./show.action.js")).action,
      Component: async () => (await import("./show.component.js")).Component,
    },
  },
]);
```

⚠️ This is a breaking change if you have adopted the `route.unstable_lazyMiddleware` API which has been removed in favor of `route.lazy.unstable_middleware`. See the `Unstable Changes` section below for more information.

### Minor Changes

- `react-router` - Add granular object-based API for `route.lazy` to support lazy loading of individual route properties ([#13294](https://github.com/remix-run/react-router/pull/13294))

### Patch Changes

- `@react-router/dev` - Update optional `wrangler` peer dependency range to support `wrangler` v4 ([#13258](https://github.com/remix-run/react-router/pull/13258))
- `@react-router/dev` - Reinstate dependency optimization in the child compiler to fix `depsOptimizer is required in dev mode` errors when using `vite-plugin-cloudflare` and importing Node.js builtins ([#13317](https://github.com/remix-run/react-router/pull/13317))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Introduce `future.unstable_subResourceIntegrity` flag that enables generation of an `importmap` with `integrity` for the scripts that will be loaded by the browser ([#13163](https://github.com/remix-run/react-router/pull/13163))
- `react-router` - Remove support for the `route.unstable_lazyMiddleware` property ([#13294](https://github.com/remix-run/react-router/pull/13294))
  - In order to lazily load middleware, you can use the new object-based `route.lazy.unstable_middleware` API
- `@react-router/dev` - When `future.unstable_viteEnvironmentApi` is enabled, ensure critical CSS in development works when using a custom Vite `base` has been configured ([#13305](https://github.com/remix-run/react-router/pull/13305))

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/create-react-router/CHANGELOG.md#750)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router/CHANGELOG.md#750)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-architect/CHANGELOG.md#750)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-cloudflare/CHANGELOG.md#750)
- [`@react-router/dev`](http://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-dev/CHANGELOG.md#750)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-express/CHANGELOG.md#750)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-fs-routes/CHANGELOG.md#750)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-node/CHANGELOG.md#750)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#750)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.5.0/packages/react-router-serve/CHANGELOG.md#750)

**Full Changelog**: [`v7.4.1...v7.5.0`](https://github.com/remix-run/react-router/compare/react-router@7.4.1...react-router@7.5.0)

## v7.4.1

Date: 2025-03-28

### Security Notice

Fixed a security vulnerability that allowed URL manipulation and potential cache pollution via the `Host` and `X-Forwarded-Host` headers due to inadequate port sanitization ([GHSA-4q56-crqp-v477/CVE-2025-31137](https://github.com/remix-run/react-router/security/advisories/GHSA-4q56-crqp-v477)).

### Patch Changes

- `react-router` - Dedupe calls to `route.lazy` functions ([#13260](https://github.com/remix-run/react-router/pull/13260))
- `@react-router/dev` - Fix path in prerender error messages ([#13257](https://github.com/remix-run/react-router/pull/13257))
- `@react-router/dev` - Fix typegen for virtual modules when `moduleDetection` is set to `force` ([#13267](https://github.com/remix-run/react-router/pull/13267))
- `@react-router/express` - Better validation of `x-forwarded-host` header to prevent potential security issues ([#13309](https://github.com/remix-run/react-router/pull/13309))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Fix types on `unstable_MiddlewareFunction` to avoid type errors when a middleware doesn't return a value ([#13311](https://github.com/remix-run/react-router/pull/13311))
- `react-router` - Add support for `route.unstable_lazyMiddleware` function to allow lazy loading of middleware logic ([#13210](https://github.com/remix-run/react-router/pull/13210))
  - ⚠️ We do not recommend adoption of this API currently as we are likely going to change it prior to the stable release of middleware
  - ⚠️ This may be a breaking change if your app is currently returning `unstable_middleware` from `route.lazy`
  - The `route.unstable_middleware` property is no longer supported in the return value from `route.lazy`
  - If you want to lazily load middleware, you must use `route.unstable_lazyMiddleware`
- `@react-router/dev` - When both `future.unstable_middleware` and `future.unstable_splitRouteModules` are enabled, split `unstable_clientMiddleware` route exports into separate chunks when possible ([#13210](https://github.com/remix-run/react-router/pull/13210))
- `@react-router/dev` - Improve performance of `future.unstable_middleware` by ensuring that route modules are only blocking during the middleware phase when the `unstable_clientMiddleware` has been defined ([#13210](https://github.com/remix-run/react-router/pull/13210))

**Full Changelog**: [`v7.4.0...v7.4.1`](https://github.com/remix-run/react-router/compare/react-router@7.4.0...react-router@7.4.1)

## v7.4.0

Date: 2025-03-19

### Minor Changes

- `@react-router/dev` - Generate types for `virtual:react-router/server-build` module ([#13152](https://github.com/remix-run/react-router/pull/13152))

### Patch Changes

- `react-router` - Fix root loader data on initial load redirects in SPA mode ([#13222](https://github.com/remix-run/react-router/pull/13222))
- `react-router` - Load ancestor pathless/index routes in lazy route discovery for upwards non-eager-discovery routing ([#13203](https://github.com/remix-run/react-router/pull/13203))
- `react-router` - Fix `shouldRevalidate` behavior for `clientLoader`-only routes in `ssr:true` apps ([#13221](https://github.com/remix-run/react-router/pull/13221))
- `@react-router/dev` - Fix conflicts with other Vite plugins that use the `configureServer` and/or `configurePreviewServer` hooks ([#13184](https://github.com/remix-run/react-router/pull/13184))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - If a middleware throws an error, ensure we only bubble the error itself via `next()` and are no longer leaking the `MiddlewareError` implementation detail ([#13180](https://github.com/remix-run/react-router/pull/13180))
  - ⚠️ This may be a breaking change if you are `catch`-ing errors thrown by the `next()` function in your middlewares
- `react-router` - Fix `RequestHandler` `loadContext` parameter type when middleware is enabled ([#13204](https://github.com/remix-run/react-router/pull/13204))
- `react-router` - Update `Route.unstable_MiddlewareFunction` to have a return value of `Response | undefined` instead of `Response | void` ([#13199](https://github.com/remix-run/react-router/pull/13199))
- `@react-router/dev` - When `future.unstable_splitRouteModules` is set to `"enforce"`, allow both splittable and unsplittable root route exports since it's always in a single chunk ([#13238](https://github.com/remix-run/react-router/pull/13238))
- `@react-router/dev` - When `future.unstable_viteEnvironmentApi` is enabled, allow plugins that override the default SSR environment (such as `@cloudflare/vite-plugin`) to be placed before or after the React Router plugin ([#13183](https://github.com/remix-run/react-router/pull/13183))

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/create-react-router/CHANGELOG.md#740)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router/CHANGELOG.md#740)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-architect/CHANGELOG.md#740)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-cloudflare/CHANGELOG.md#740)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-dev/CHANGELOG.md#740)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-express/CHANGELOG.md#740)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-fs-routes/CHANGELOG.md#740)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-node/CHANGELOG.md#740)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#740)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.4.0/packages/react-router-serve/CHANGELOG.md#740)

**Full Changelog**: [`v7.3.0...v7.4.0`](https://github.com/remix-run/react-router/compare/react-router@7.3.0...react-router@7.4.0)

## v7.3.0

Date: 2025-03-06

### Minor Changes

- Add `fetcherKey` as a parameter to `patchRoutesOnNavigation` ([#13061](https://github.com/remix-run/react-router/pull/13061))

### Patch Changes

- `react-router` - Detect and handle manifest-skew issues on new deploys during active sessions ([#13061](https://github.com/remix-run/react-router/pull/13061))
  - In framework mode, Lazy Route Discovery will now detect manifest version mismatches in active sessions after a new deploy
  - On navigations to undiscovered routes, this mismatch will trigger a document reload of the destination path
  - On `fetcher` calls to undiscovered routes, this mismatch will trigger a document reload of the current path
- `react-router` - Skip resource route flow in dev server in SPA mode ([#13113](https://github.com/remix-run/react-router/pull/13113))
- `react-router` - Fix single fetch `_root.data` requests when a `basename` is used ([#12898](https://github.com/remix-run/react-router/pull/12898))
- `react-router` - Fix types for `loaderData` and `actionData` that contained `Record`s ([#13139](https://github.com/remix-run/react-router/pull/13139))
  - ⚠️ This is a breaking change for users who have already adopted `unstable_SerializesTo` - see the note in the `Unstable Changes` section below for more information
- `@react-router/dev` - Fix support for custom client `build.rollupOptions.output.entryFileNames` ([#13098](https://github.com/remix-run/react-router/pull/13098))
- `@react-router/dev` - Fix usage of `prerender` option when `serverBundles` option has been configured or provided by a preset, e.g. `vercelPreset` from `@vercel/react-router` ([#13082](https://github.com/remix-run/react-router/pull/13082))
- `@react-router/dev` - Fix support for custom `build.assetsDir` ([#13077](https://github.com/remix-run/react-router/pull/13077))
- `@react-router/dev` - Remove unused dependencies ([#13134](https://github.com/remix-run/react-router/pull/13134))
- `@react-router/dev` - Stub all routes except root in "SPA Mode" server builds to avoid issues when route modules or their dependencies import non-SSR-friendly modules ([#13023](https://github.com/remix-run/react-router/pull/13023))
- `@react-router/dev` - Remove unused Vite file system watcher ([#13133](https://github.com/remix-run/react-router/pull/13133))
- `@react-router/dev` - Fix support for custom SSR build input when `serverBundles` option has been configured ([#13107](https://github.com/remix-run/react-router/pull/13107))
  - ⚠️ Note that for consumers using the `future.unstable_viteEnvironmentApi` and `serverBundles` options together, hyphens are no longer supported in server bundle IDs since they also need to be valid Vite environment names.
- `@react-router/dev` - Fix dev server when using HTTPS by stripping HTTP/2 pseudo headers from dev server requests ([#12830](https://github.com/remix-run/react-router/pull/12830))
- `@react-router/dev` - Lazy load Cloudflare platform proxy on first dev server request when using the `cloudflareDevProxy` Vite plugin to avoid creating unnecessary `workerd` processes ([#13016](https://github.com/remix-run/react-router/pull/13016))
- `@react-router/dev` - Fix duplicated entries in typegen for layout routes and their corresponding index route ([#13140](https://github.com/remix-run/react-router/pull/13140))
- `@react-router/express` - Update `express` `peerDependency` to include v5 (https://github.com/remix-run/react-router/pull/13064) ([#12961](https://github.com/remix-run/react-router/pull/12961))

### Unstable Changes

⚠️ _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) are not recommended for production use_

- `react-router` - Add `context` support to client side data routers (unstable) ([#12941](https://github.com/remix-run/react-router/pull/12941))
- `react-router` - Support middleware on routes (unstable) ([#12941](https://github.com/remix-run/react-router/pull/12941))
- `@react-router/dev` - Fix errors with `future.unstable_viteEnvironmentApi` when the `ssr` environment has been configured by another plugin to be a custom `Vite.DevEnvironment` rather than the default `Vite.RunnableDevEnvironment` ([#13008](https://github.com/remix-run/react-router/pull/13008))
- `@react-router/dev` - When `future.unstable_viteEnvironmentApi` is enabled and the `ssr` environment has `optimizeDeps.noDiscovery` disabled, define `optimizeDeps.entries` and `optimizeDeps.include` ([#13007](https://github.com/remix-run/react-router/pull/13007))

#### Client-side `context` (unstable)

Your application `clientLoader`/`clientAction` functions (or `loader`/`action` in library mode) will now receive a `context` parameter on the client. This is an instance of `unstable_RouterContextProvider` that you use with type-safe contexts (similar to `React.createContext`) and is most useful with the corresponding `unstable_clientMiddleware` API:

```ts
import { unstable_createContext } from "react-router";

type User = {
  /*...*/
};

const userContext = unstable_createContext<User>();

const sessionMiddleware: Route.unstable_ClientMiddlewareFunction = async ({
  context,
}) => {
  let user = await getUser();
  context.set(userContext, user);
};

export const unstable_clientMiddleware = [sessionMiddleware];

export function clientLoader({ context }: Route.ClientLoaderArgs) {
  let user = context.get(userContext);
  let profile = await getProfile(user.id);
  return { profile };
}
```

Similar to server-side requests, a fresh `context` will be created per navigation (or `fetcher` call). If you have initial data you'd like to populate in the context for every request, you can provide an `unstable_getContext` function at the root of your app:

- Library mode - `createBrowserRouter(routes, { unstable_getContext })`
- Framework mode - `<HydratedRouter unstable_getContext>`

This function should return an value of type `unstable_InitialContext` which is a `Map<unstable_RouterContext, unknown>` of context's and initial values:

```ts
const loggerContext = unstable_createContext<(...args: unknown[]) => void>();

function logger(...args: unknown[]) {
  console.log(new Date.toISOString(), ...args);
}

function unstable_getContext() {
  let map = new Map();
  map.set(loggerContext, logger);
  return map;
}
```

#### Middleware (unstable)

Middleware is implemented behind a `future.unstable_middleware` flag. To enable, you must enable the flag and the types in your `react-router.config.ts` file:

```ts
import type { Config } from "@react-router/dev/config";
import type { Future } from "react-router";

declare module "react-router" {
  interface Future {
    unstable_middleware: true; // 👈 Enable middleware types
  }
}

export default {
  future: {
    unstable_middleware: true, // 👈 Enable middleware
  },
} satisfies Config;
```

⚠️ Middleware is unstable and should not be adopted in production. There is at least one known de-optimization in route module loading for `clientMiddleware` that we will be addressing this before a stable release.

⚠️ Enabling middleware contains a breaking change to the `context` parameter passed to your `loader`/`action` functions - see below for more information.

Once enabled, routes can define an array of middleware functions that will run sequentially before route handlers run. These functions accept the same parameters as `loader`/`action` plus an additional `next` parameter to run the remaining data pipeline. This allows middlewares to perform logic before and after handlers execute.

```tsx
// Framework mode
export const unstable_middleware = [serverLogger, serverAuth]; // server
export const unstable_clientMiddleware = [clientLogger]; // client

// Library mode
const routes = [
  {
    path: "/",
    // Middlewares are client-side for library mode SPA's
    unstable_middleware: [clientLogger, clientAuth],
    loader: rootLoader,
    Component: Root,
  },
];
```

Here's a simple example of a client-side logging middleware that can be placed on the root route:

```tsx
const clientLogger: Route.unstable_ClientMiddlewareFunction = async (
  { request },
  next,
) => {
  let start = performance.now();

  // Run the remaining middlewares and all route loaders
  await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);
};
```

Note that in the above example, the `next`/`middleware` functions don't return anything. This is by design as on the client there is no "response" to send over the network like there would be for middlewares running on the server. The data is all handled behind the scenes by the stateful `router`.

For a server-side middleware, the `next` function will return the HTTP `Response` that React Router will be sending across the wire, thus giving you a chance to make changes as needed. You may throw a new response to short circuit and respond immediately, or you may return a new or altered response to override the default returned by `next()`.

```tsx
const serverLogger: Route.unstable_MiddlewareFunction = async (
  { request, params, context },
  next,
) => {
  let start = performance.now();

  // 👇 Grab the response here
  let res = await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);

  // 👇 And return it here (optional if you don't modify the response)
  return res;
};
```

You can throw a `redirect` from a middleware to short circuit any remaining processing:

```tsx
import { sessionContext } from "../context";
const serverAuth: Route.unstable_MiddlewareFunction = (
  { request, params, context },
  next,
) => {
  let session = context.get(sessionContext);
  let user = session.get("user");
  if (!user) {
    session.set("returnTo", request.url);
    throw redirect("/login", 302);
  }
};
```

_Note that in cases like this where you don't need to do any post-processing you don't need to call the `next` function or return a `Response`._

Here's another example of using a server middleware to detect 404s and check the CMS for a redirect:

```tsx
const redirects: Route.unstable_MiddlewareFunction = async ({
  request,
  next,
}) => {
  // attempt to handle the request
  let res = await next();

  // if it's a 404, check the CMS for a redirect, do it last
  // because it's expensive
  if (res.status === 404) {
    let cmsRedirect = await checkCMSRedirects(request.url);
    if (cmsRedirect) {
      throw redirect(cmsRedirect, 302);
    }
  }

  return res;
};
```

For more information on the `middleware` API/design, please see the [decision doc](https://github.com/remix-run/react-router/blob/release-next/decisions/0014-context-middleware.md).

##### Middleware `context` parameter

When middleware is enabled, your application will use a different type of `context` parameter in your loaders and actions to provide better type safety. Instead of `AppLoadContext`, `context` will now be an instance of `ContextProvider` that you can use with type-safe contexts (similar to `React.createContext`):

```ts
import { unstable_createContext } from "react-router";
import { Route } from "./+types/root";
import type { Session } from "./sessions.server";
import { getSession } from "./sessions.server";

let sessionContext = unstable_createContext<Session>();

const sessionMiddleware: Route.unstable_MiddlewareFunction = ({
  context,
  request,
}) => {
  let session = await getSession(request);
  context.set(sessionContext, session);
  //                          ^ must be of type Session
};

// ... then in some downstream middleware
const loggerMiddleware: Route.unstable_MiddlewareFunction = ({
  context,
  request,
}) => {
  let session = context.get(sessionContext);
  //  ^ typeof Session
  console.log(session.get("userId"), request.method, request.url);
};

// ... or some downstream loader
export function loader({ context }: Route.LoaderArgs) {
  let session = context.get(sessionContext);
  let profile = await getProfile(session.get("userId"));
  return { profile };
}
```

If you are using a custom server with a `getLoadContext` function, the return value for initial context values passed from the server adapter layer is no longer an object and should now return an `unstable_InitialContext` (`Map<RouterContext, unknown>`):

```ts
let adapterContext = unstable_createContext<MyAdapterContext>();

function getLoadContext(req, res): unstable_InitialContext {
  let map = new Map();
  map.set(adapterContext, getAdapterContext(req));
  return map;
}
```

#### `unstable_SerializesTo`

`unstable_SerializesTo` added a way to register custom serialization types in Single Fetch for other library and framework authors like Apollo. It was implemented with branded type whose branded property that was made optional so that casting arbitrary values was easy:

```ts
// without the brand being marked as optional
let x1 = 42 as unknown as unstable_SerializesTo<number>;
//          ^^^^^^^^^^

// with the brand being marked as optional
let x2 = 42 as unstable_SerializesTo<number>;
```

However, this broke type inference in `loaderData` and `actionData` for any `Record` types as those would now (incorrectly) match `unstable_SerializesTo`. This affected all users, not just those that depended on `unstable_SerializesTo`. To fix this, the branded property of `unstable_SerializesTo` is marked as required instead of optional.

For library and framework authors using `unstable_SerializesTo`, you may need to add `as unknown` casts before casting to `unstable_SerializesTo`.

### Changes by Package

- [`create-react-router`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/create-react-router/CHANGELOG.md#730)
- [`react-router`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router/CHANGELOG.md#730)
- [`@react-router/architect`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-architect/CHANGELOG.md#730)
- [`@react-router/cloudflare`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-cloudflare/CHANGELOG.md#730)
- [`@react-router/dev`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-dev/CHANGELOG.md#730)
- [`@react-router/express`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-express/CHANGELOG.md#730)
- [`@react-router/fs-routes`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-fs-routes/CHANGELOG.md#730)
- [`@react-router/node`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-node/CHANGELOG.md#730)
- [`@react-router/remix-config-routes-adapter`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-remix-config-routes-adapter/CHANGELOG.md#730)
- [`@react-router/serve`](https://github.com/remix-run/react-router/blob/react-router%407.3.0/packages/react-router-serve/CHANGELOG.md#730)

**Full Changelog**: [`v7.2.0...v7.3.0`](https://github.com/remix-run/react-router/compare/react-router@7.2.0...react-router@7.3.0)

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

#### Split Route Modules (unstable)

> ⚠️ This feature is currently [unstable](https://reactrouter.com/community/api-development-strategy#unstable-flags), enabled by the `future.unstable_splitRouteModules` flag. We’d love any interested users to play with it locally and provide feedback, but we do not recommend using it in production yet.
>
> If you do choose to adopt this flag in production, please ensure you do sufficient testing against your production build to ensure that the optimization is working as expected.

One of the conveniences of the [Route Module API](https://reactrouter.com/start/framework/route-module) is that everything a route needs is in a single file. Unfortunately this comes with a performance cost in some cases when using the `clientLoader`, `clientAction`, and `HydrateFallback` APIs.

As a basic example, consider this route module:

```tsx filename=routes/example.tsx
import { MassiveComponent } from "~/components";

export async function clientLoader() {
  return await fetch("https://example.com/api").then((response) =>
    response.json(),
  );
}

export default function Component({ loaderData }) {
  return <MassiveComponent data={loaderData} />;
}
```

In this example we have a minimal `clientLoader` export that makes a basic fetch call, whereas the default component export is much larger. This is a problem for performance because it means that if we want to navigate to this route client-side, the entire route module must be downloaded before the client loader can start running.

To visualize this as a timeline:

<docs-info>In the following timeline diagrams, different characters are used within the Route Module bars to denote the different Route Module APIs being exported.</docs-info>

```
Get Route Module:  |--=======|
Run clientLoader:            |-----|
Render:                            |-|
```

Instead, we want to optimize this to the following:

```
Get clientLoader:  |--|
Get Component:     |=======|
Run clientLoader:     |-----|
Render:                     |-|
```

To achieve this optimization, React Router will split the route module into multiple smaller modules during the production build process. In this case, we'll end up with two separate [virtual modules](https://vite.dev/guide/api-plugin#virtual-modules-convention) — one for the client loader and one for the component and its dependencies.

```tsx filename=routes/example.tsx?route-chunk=clientLoader
export async function clientLoader() {
  return await fetch("https://example.com/api").then((response) =>
    response.json(),
  );
}
```

```tsx filename=routes/example.tsx?route-chunk=main
import { MassiveComponent } from "~/components";

export default function Component({ loaderData }) {
  return <MassiveComponent data={loaderData} />;
}
```

> 💡 This optimization is automatically applied in framework mode, but you can also implement it in library mode via `route.lazy` and authoring your route in multiple files as covered in our blog post on [lazy loading route modules.](https://remix.run/blog/lazy-loading-routes#advanced-usage-and-optimizations)

Now that these are available as separate modules, the client loader and the component can be downloaded in parallel. This means that the client loader can be executed as soon as it's ready without having to wait for the component.

This optimization is even more pronounced when more Route Module APIs are used. For example, when using `clientLoader`, `clientAction` and `HydrateFallback`, the timeline for a single route module during a client-side navigation might look like this:

```
Get Route Module:     |--~~++++=======|
Run clientLoader:                     |-----|
Render:                                     |-|
```

This would instead be optimized to the following:

```
Get clientLoader:     |--|
Get clientAction:     |~~|
Get HydrateFallback:  SKIPPED
Get Component:        |=======|
Run clientLoader:        |-----|
Render:                        |-|
```

Note that this optimization only works when the Route Module APIs being split don't share code within the same file. For example, the following route module can't be split:

```tsx filename=routes/example.tsx
import { MassiveComponent } from "~/components";

const shared = () => console.log("hello");

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then((response) =>
    response.json(),
  );
}

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

This route will still work, but since both the client loader and the component depend on the `shared` function defined within the same file, it will be de-optimized into a single route module.

To avoid this, you can extract any code shared between exports into a separate file. For example:

```tsx filename=routes/example/shared.tsx
export const shared = () => console.log("hello");
```

You can then import this shared code in your route module without triggering the de-optimization:

```tsx filename=routes/example/route.tsx
import { MassiveComponent } from "~/components";
import { shared } from "./shared";

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then((response) =>
    response.json(),
  );
}

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

Since the shared code is in its own module, React Router is now able to split this route module into two separate virtual modules:

```tsx filename=routes/example/route.tsx?route-chunk=clientLoader
import { shared } from "./shared";

export async function clientLoader() {
  shared();
  return await fetch("https://example.com/api").then((response) =>
    response.json(),
  );
}
```

```tsx filename=routes/example/route.tsx?route-chunk=main
import { MassiveComponent } from "~/components";
import { shared } from "./shared";

export default function Component({ loaderData }) {
  shared();
  return <MassiveComponent data={loaderData} />;
}
```

If your project is particularly performance sensitive, you can set the `unstable_splitRouteModules` future flag to `"enforce"`:

```tsx filename=react-router-config.ts
export default {
  future: {
    unstable_splitRouteModules: "enforce",
  },
};
```

This setting will raise an error if any route modules can't be split:

```
Error splitting route module: routes/example/route.tsx

- clientLoader

This export could not be split into its own chunk because it shares code with other exports. You should extract any shared code into its own module and then import it within the route module.
```

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

#### Type-safety improvements

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
