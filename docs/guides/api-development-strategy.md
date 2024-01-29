---
title: API Development Strategy
new: true
---

# API Development Strategy

Let's cut to the chase - major version upgrades can be a _pain_. Especially for something as foundational to your application as the framework or router it's built on. For Remix and React Router, we want to do our best to give you the smoothest upgrade experience possible.

<docs-info>This strategy is discussed in more detail in our [Future Flags][future-flags-blog-post] blog post, so give that a read if you want any more info at the end of this doc!</docs-info>

## Goals

Our goals for major Remix and React Router releases are:

- Developers can opt-into SemVer-major features individually _as they are released_ instead of having to wait to adopt them all at once when a new major version hits NPM
- Having opted into features ahead-of-time, developers can upgrade to new major versions in a single short-lived branch/commit (hours, not weeks)

## Implementation

We plan to do this via what we're calling **Future Flags** that you'll provide when you initialize your [Data Router][picking-a-router]. Think of these as **feature flags for future features**. As we implement new features, we always try to do them in a backwards-compatible way. But when a breaking change is warranted, we don't table that feature up for an _eventual_ v7 release. Instead, we add a **Future Flag** and implement the new feature alongside the current behavior in a v6 minor release. This allows users to start using the feature, providing feedback, and reporting bugs _immediately_.

That way, not only can you adopt features incrementally (and eagerly without a major version bump), we can also work out any kinks incrementally _before_ releasing v7. Eventually we also then add deprecation warnings to the v6 releases to nudge users to the new behavior. Then in v7 we remove the old v6 approach, remove the deprecations, and remove the flag - thus making the flagged behavior the new default in v7. If at the time v6 is released, an application has opted into _all_ future flags and updated their code - then they should just be able to update their dependency to v7, delete the future flags, and be running on v7 in a matter of minutes.

## Unstable vs. V7 Flags

Future flags come in 2 forms:

**`future.unstable_feature`**

`unstable_` flags allow us to iterate on the API with early adopters as if we're in `v0.x.x` versions, but for a specific feature. This avoids churning the API for all users and arriving at better APIs in the final release. This _does not mean_ that we think the feature is bug-ridden! We _absolutely_ want early adopters to start using these features so we can iterate on (and/or gain confidence in) the API.

**`future.v7_feature`**

`v7_` indicates a breaking change from v6 behavior and implies (1) that the API is considered stable and will not under any more breaking changes and (2) that the API will become the default behavior in v7. A `v7_` flag _does not_ mean the feature is bug-free - no software is! Our recommendation is to upgrade to v7 flags as you have the time, as it will make your v7 upgrade _much_ smoother.

### Example New Feature Flow

The decision flow for a new feature looks something like this (note this diagram is in relation to Remix v1/v2 but applies to React Router v6/v7 as well):

![Flowchart of the decision process for how to introduce a new feature][feature-flowchart]

The lifecycle is thus either:

- Non-Breaking + Stable API Feature -> Lands in v6
- Non-Breaking + Unstable API -> `future.unstable_` flag -> Lands in v6
- Breaking + Stable API Feature -> `future.v7_` flag -> Lands in v7
- Breaking + Unstable API -> `future.unstable_` flag -> `future.v7_` flag -> Lands in v7

## Current Future Flags

Here's the current future flags in React Router v6 today.

### `@remix-run/router` Future Flags

These flags are only applicable when using a [Data Router][picking-a-router] and are passed when creating the `router` instance:

```js
const router = createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
```

| Flag                                        | Description                                                           |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `v7_fetcherPersist`                         | Delay active fetcher cleanup until they return to an `idle` state     |
| `v7_normalizeFormMethod`                    | Normalize `useNavigation().formMethod` to be an uppercase HTTP Method |
| [`v7_partialHydration`][partialhydration]   | Support partial hydration for Server-rendered apps                    |
| `v7_prependBasename`                        | Prepend the router basename to navigate/fetch paths                   |
| [`v7_relativeSplatPath`][relativesplatpath] | Fix buggy relative path resolution in splat routes                    |

#### `createStaticHandler` Future Flags

These flags are only applicable when [SSR][ssr]-ing a React Router app:

```js
const handler = createStaticHandler(routes, {
  future: {
    v7_throwAbortReason: true,
  },
});
```

| Flag                                        | Description                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| [`v7_relativeSplatPath`][relativesplatpath] | Fix buggy relative path resolution in splat routes                      |
| [`v7_throwAbortReason`][abortreason]        | Throw `request.signal.reason` if a `query`/`queryRoute` call is aborted |

### React Router Future Flags

These flags apply to both Data and non-Data Routers and are passed to the rendered React component:

```jsx
<BrowserRouter future={{ v7_startTransition: true }}>
  <Routes>{/*...*/}</Routes>
</BrowserRouter>
```

```jsx
<RouterProvider
  router={router}
  future={{ v7_startTransition: true }}
/>
```

| Flag                 | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `v7_startTransition` | Wrap all router state updates in [`React.startTransition`][starttransition] |

[future-flags-blog-post]: https://remix.run/blog/future-flags
[feature-flowchart]: https://remix.run/docs-images/feature-flowchart.png
[picking-a-router]: ../routers/picking-a-router
[starttransition]: https://react.dev/reference/react/startTransition
[partialhydration]: ../routers/create-browser-router#partial-hydration-data
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
[ssr]: ../guides/ssr
[abortreason]: ../routers/create-static-handler#handlerqueryrequest-opts
