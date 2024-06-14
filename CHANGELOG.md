<!-- markdownlint-disable no-duplicate-header no-emphasis-as-heading no-inline-html -->

# React Router Releases

This page lists all releases/release notes for React Router back to `v6.0.0`. For releases prior to v6, please refer to the [Github Releases Page](https://github.com/remix-run/react-router/releases).

We manage release notes in this file instead of the paginated Github Releases Page for 2 reasons:

- Pagination in the Github UI means that you cannot easily search release notes for a large span of releases at once
- The paginated Github interface also cuts off longer releases notes without indication in list view, and you need to click into the detail view to see the full set of release notes

<details>
  <summary>Table of Contents</summary>

- [React Router Releases](#react-router-releases)
  - [v6.23.1](#v6231)
    - [Patch Changes](#patch-changes)
  - [v6.23.0](#v6230)
    - [What's Changed](#whats-changed)
      - [Data Strategy (unstable)](#data-strategy-unstable)
      - [Skip Action Error Revalidation (unstable)](#skip-action-error-revalidation-unstable)
    - [Minor Changes](#minor-changes)
  - [v6.22.3](#v6223)
    - [Patch Changes](#patch-changes-1)
  - [v6.22.2](#v6222)
    - [Patch Changes](#patch-changes-2)
  - [v6.22.1](#v6221)
    - [Patch Changes](#patch-changes-3)
  - [v6.22.0](#v6220)
    - [What's Changed](#whats-changed-1)
      - [Core Web Vitals Technology Report Flag](#core-web-vitals-technology-report-flag)
    - [Minor Changes](#minor-changes-1)
    - [Patch Changes](#patch-changes-4)
  - [v6.21.3](#v6213)
    - [Patch Changes](#patch-changes-5)
  - [v6.21.2](#v6212)
    - [Patch Changes](#patch-changes-6)
  - [v6.21.1](#v6211)
    - [Patch Changes](#patch-changes-7)
  - [v6.21.0](#v6210)
    - [What's Changed](#whats-changed-2)
      - [`future.v7_relativeSplatPath`](#futurev7_relativesplatpath)
      - [Partial Hydration](#partial-hydration)
    - [Minor Changes](#minor-changes-2)
    - [Patch Changes](#patch-changes-8)
  - [v6.20.1](#v6201)
    - [Patch Changes](#patch-changes-9)
  - [v6.20.0](#v6200)
    - [Minor Changes](#minor-changes-3)
    - [Patch Changes](#patch-changes-10)
  - [v6.19.0](#v6190)
    - [What's Changed](#whats-changed-3)
      - [`unstable_flushSync` API](#unstable_flushsync-api)
    - [Minor Changes](#minor-changes-4)
    - [Patch Changes](#patch-changes-11)
  - [v6.18.0](#v6180)
    - [What's Changed](#whats-changed-4)
      - [New Fetcher APIs](#new-fetcher-apis)
      - [Persistence Future Flag (`future.v7_fetcherPersist`)](#persistence-future-flag-futurev7_fetcherpersist)
    - [Minor Changes](#minor-changes-5)
    - [Patch Changes](#patch-changes-12)
  - [v6.17.0](#v6170)
    - [What's Changed](#whats-changed-5)
      - [View Transitions 🚀](#view-transitions-)
    - [Minor Changes](#minor-changes-6)
    - [Patch Changes](#patch-changes-13)
  - [v6.16.0](#v6160)
    - [Minor Changes](#minor-changes-7)
    - [Patch Changes](#patch-changes-14)
  - [v6.15.0](#v6150)
    - [Minor Changes](#minor-changes-8)
    - [Patch Changes](#patch-changes-15)
  - [v6.14.2](#v6142)
    - [Patch Changes](#patch-changes-16)
  - [v6.14.1](#v6141)
    - [Patch Changes](#patch-changes-17)
  - [v6.14.0](#v6140)
    - [What's Changed](#whats-changed-6)
      - [JSON/Text Submissions](#jsontext-submissions)
    - [Minor Changes](#minor-changes-9)
    - [Patch Changes](#patch-changes-18)
  - [v6.13.0](#v6130)
    - [What's Changed](#whats-changed-7)
    - [Minor Changes](#minor-changes-10)
    - [Patch Changes](#patch-changes-19)
  - [v6.12.1](#v6121)
    - [Patch Changes](#patch-changes-20)
  - [v6.12.0](#v6120)
    - [What's Changed](#whats-changed-8)
      - [`React.startTransition` support](#reactstarttransition-support)
    - [Minor Changes](#minor-changes-11)
    - [Patch Changes](#patch-changes-21)
  - [v6.11.2](#v6112)
    - [Patch Changes](#patch-changes-22)
  - [v6.11.1](#v6111)
    - [Patch Changes](#patch-changes-23)
  - [v6.11.0](#v6110)
    - [Minor Changes](#minor-changes-12)
    - [Patch Changes](#patch-changes-24)
  - [v6.10.0](#v6100)
    - [What's Changed](#whats-changed-9)
    - [Minor Changes](#minor-changes-13)
    - [Patch Changes](#patch-changes-25)
  - [v6.9.0](#v690)
    - [What's Changed](#whats-changed-10)
      - [`Component`/`ErrorBoundary` route properties](#componenterrorboundary-route-properties)
      - [Introducing Lazy Route Modules](#introducing-lazy-route-modules)
    - [Minor Changes](#minor-changes-14)
    - [Patch Changes](#patch-changes-26)
  - [v6.8.2](#v682)
    - [Patch Changes](#patch-changes-27)
  - [v6.8.1](#v681)
    - [Patch Changes](#patch-changes-28)
  - [v6.8.0](#v680)
    - [Minor Changes](#minor-changes-15)
    - [Patch Changes](#patch-changes-29)
  - [v6.7.0](#v670)
    - [Minor Changes](#minor-changes-16)
    - [Patch Changes](#patch-changes-30)
  - [v6.6.2](#v662)
    - [Patch Changes](#patch-changes-31)
  - [v6.6.1](#v661)
    - [Patch Changes](#patch-changes-32)
  - [v6.6.0](#v660)
    - [What's Changed](#whats-changed-11)
    - [Minor Changes](#minor-changes-17)
    - [Patch Changes](#patch-changes-33)
  - [v6.5.0](#v650)
    - [What's Changed](#whats-changed-12)
    - [Minor Changes](#minor-changes-18)
    - [Patch Changes](#patch-changes-34)
  - [v6.4.5](#v645)
    - [Patch Changes](#patch-changes-35)
  - [v6.4.4](#v644)
    - [Patch Changes](#patch-changes-36)
  - [v6.4.3](#v643)
    - [Patch Changes](#patch-changes-37)
  - [v6.4.2](#v642)
    - [Patch Changes](#patch-changes-38)
  - [v6.4.1](#v641)
    - [Patch Changes](#patch-changes-39)
  - [v6.4.0](#v640)
    - [What's Changed](#whats-changed-13)
      - [Remix Data APIs](#remix-data-apis)
    - [Patch Changes](#patch-changes-40)
  - [v6.3.0](#v630)
    - [Minor Changes](#minor-changes-19)
  - [v6.2.2](#v622)
    - [Patch Changes](#patch-changes-41)
  - [v6.2.1](#v621)
    - [Patch Changes](#patch-changes-42)
  - [v6.2.0](#v620)
    - [Minor Changes](#minor-changes-20)
    - [Patch Changes](#patch-changes-43)
  - [v6.1.1](#v611)
    - [Patch Changes](#patch-changes-44)
  - [v6.1.0](#v610)
    - [Minor Changes](#minor-changes-21)
    - [Patch Changes](#patch-changes-45)
  - [v6.0.2](#v602)
    - [Patch Changes](#patch-changes-46)
  - [v6.0.1](#v601)
    - [Patch Changes](#patch-changes-47)
  - [v6.0.0](#v600)

</details>

<!-- To add a new release, copy from this template:

## v6.X.Y

Date: YYYY-MM-DD

### What's Changed

#### Big New Feature 1

#### Big New Feature 2

### Minor Changes

### Patch Changes

**Full Changelog**: [`v6.X.Y...v6.X.Y`](https://github.com/remix-run/react-router/compare/react-router@6.X.Y...react-router@6.X.Y)
-->

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

The new `unstable_dataStrategy` API is a low-level API designed for advanced use-cases where you need to take control over the data strategy for your `loader`/`action` functions. The default implementation is today's behavior, to fetch all loaders in parallel, but this option allows users to implement more advanced data flows including Remix ["Single Fetch"](https://remix.run/docs/guides/single-fetch), user-land middleware/context APIs, automatic loader caching, and more. Please see the [docs](https://reactrouter.com/routers/create-browser-router#unstable_datastrategy) for more information.

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

For more information, please refer to the [`useResolvedPath` docs](https://reactrouter.com/hooks/use-resolved-path#splat-paths) and/or the [detailed changelog entry](https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/CHANGELOG.md#6210).

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
- Remove the `unstable_` prefix from the [`useBlocker`](https://reactrouter.com/en/main/hooks/use-blocker) hook as it's been in use for enough time that we are confident in the API ([#10991](https://github.com/remix-run/react-router/pull/10991))
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
- `Form` and `useSumbit` now support optional `navigate`/`fetcherKey` props/params to allow kicking off a fetcher submission under the hood with an optionally user-specified `key`
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

The simplest approach to enabling a View Transition in your React Router app is via the new [`<Link unstable_viewTransition>`](https://reactrouter.com/components/link#unstable_viewtransition) prop. This will cause the navigation DOM update to be wrapped in `document.startViewTransition` which will enable transitions for the DOM update. Without any additional CSS styles, you'll get a basic cross-fade animation for your page.

If you need to apply more fine-grained styles for your animations, you can leverage the [`unstable_useViewTransitionState`](https://reactrouter.com/hooks/use-view-transition-state) hook which will tell you when a transition is in progress and you can use that to apply classes or styles:

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

You can also use the [`<NavLink unstable_viewTransition>`](https://reactrouter.com/components/nav-link#unstable_viewtransition) shorthand which will manage the hook usage for you and automatically add a `transitioning` class to the `<a>` during the transition:

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

#### v7_startTransition

The **tl;dr;** is that `6.13.0` is the same as [`6.12.0`](https://github.com/remix-run/react-router/releases/tag/react-router%406.12.0) bue we've moved the usage of `React.startTransition` behind an opt-in `future.v7_startTransition` [future flag](https://reactrouter.com/en/main/guides/api-development-strategy) because we found that there are applications in the wild that are currently using `Suspense` in ways that are incompatible with `React.startTransition`.

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

#### future.v7_normalizeFormMethod

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

An example of this in action can be found in the [`examples/lazy-loading-router-provider`](https://github.com/remix-run/react-router/tree/main/examples/lazy-loading-router-provider) directory of the repository. For more info, check out the [`lazy` docs](https://reactrouter.com/en/main/route/lazy).

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
