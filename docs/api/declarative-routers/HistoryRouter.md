---
title: HistoryRouter
unstable: true
---

# unstable_HistoryRouter

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: declarative]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.index.unstable_HistoryRouter.html)

A declarative [`<Router>`](../declarative-routers/Router) that accepts a pre-instantiated
`history` object.
It's important to note that using your own `history` object is highly discouraged
and may add two versions of the `history` library to your bundles unless you use
the same version of the `history` library that React Router uses internally.

## Signature

```tsx
function HistoryRouter({ basename, children, history }: HistoryRouterProps)
```

## Props

### basename

Application basename

### children

``<Route>`` components describing your route configuration

### history

A `History` implementation for use by the router

