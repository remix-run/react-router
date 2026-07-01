---
title: useMatches
---

# useMatches

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.useMatches.html)

Returns the active route matches, useful for accessing `loaderData` for
parent/child routes or the route [`handle`](../../start/framework/route-module#handle)
property

Pairing the route `handle` with `useMatches` gets very powerful since you can put
whatever you want on a route handle and have access to `useMatches` anywhere.
Please see the [handle](../../how-to/using-handle) documentation for an example
of breadcrumbs via `useMatches`/`handle`.

```tsx
import { useMatches } from "react-router";

function SomeComponent() {
  const matches = useMatches();
  // matches[i].id          // route id
  // matches[i].pathname    // the portion of the URL the route matched
  // matches[i].params      // the parsed params from the URL
  // matches[i].loaderData  // the data from the loader
  // matches[i].handle      // the route handle with any app specific data
}
```

<docs-info>useMatches only works with a data router like `createBrowserRouter`,
since they know the full route tree up front and can provide all of the current
matches. Additionally, `useMatches` will not match down into any descendant route
trees since the router isn't aware of the descendant routes.</docs-info>

## Signature

```tsx
function useMatches(): UIMatch[]
```

## Returns

An array of [UI matches](https://api.reactrouter.com/v8/interfaces/react-router.UIMatch.html) for the current route hierarchy

