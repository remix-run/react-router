---
title: createRoutesStub
---

# createRoutesStub

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/ssr/routes-test-stub.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.createRoutesStub.html)

Creates a React component that renders the provided routes in a test-friendly
React Router context.

Use this to unit test components that rely on router context, such as
`loaderData`, `actionData`, and route matches.

## Signature

```tsx
function createRoutesStub(
  routes: StubRouteObject[],
  _context?: RouterContextProvider,
)
```

## Params

### routes

The route objects to render in the test router.

### _context

An optional [`RouterContextProvider`](../utils/RouterContextProvider) for supplying application context values to route middleware, loaders, and actions.

## Returns

A React component that renders the test router.

