---
title: HydratedRouter
---

# HydratedRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom-export/hydrated-router.tsx
-->

[MODES: framework]

## Summary

Framework-mode router component to be used to hydrate a router from a
[`ServerRouter`](../framework-routers/ServerRouter). See [`entry.client.tsx`](../framework-conventions/entry.client.tsx).

## Signature

```tsx
function HydratedRouter(props: HydratedRouterProps)
```

## Props

### getContext

Context factory function to be passed through to [`createBrowserRouter`](../data-routers/createBrowserRouter).
This function will be called to create a fresh `context` instance on each
navigation/fetch and made available to
[`clientAction`](../../start/framework/route-module#clientAction)/[`clientLoader`](../../start/framework/route-module#clientLoader)
functions.

### onError

An error handler function that will be called for any middleware, loader, action,
or render errors that are encountered in your application.  This is useful for
logging or reporting errors instead of in the `ErrorBoundary` because it's not
subject to re-rendering and will only run one time per error.

The `errorInfo` parameter is passed along from
[`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
and is only present for render errors.

```tsx
<HydratedRouter onError={(error, info) => {
  let { location, params, pattern, errorInfo } = info;
  console.error(error, location, errorInfo);
  reportToErrorService(error, location, errorInfo);
}} />
```

### unstable_fetch

<docs-warning>This prop is experimental and subject to breaking
changes.</docs-warning>

Provide a custom implementation for `fetch`, which will be used to perform
JavaScript-issued manifest and data requests. The context identifies the
operation that initiated each request. Defaults to `window.fetch`.

This prop is read when the singleton router is created. Changing it after
router initialization has no effect. To use changing values such as auth
tokens, read current application state inside the function rather than
capturing values from a component render.

See the [Custom Fetch guide](../../how-to/custom-fetch) for examples of
authentication headers, cross-origin credentials, traversal caching, and
retries.

<docs-info>
Browser-managed data prefetches from [`Link`](../components/Link), [`NavLink`](../components/NavLink), or
[`PrefetchPageLinks`](../components/PrefetchPageLinks) use native `<link rel="prefetch">` elements
and do not call this function. If your data requests require custom headers
or other request transformations, use `prefetch="none"` on links and avoid
rendering [`PrefetchPageLinks`](../components/PrefetchPageLinks).
</docs-info>

