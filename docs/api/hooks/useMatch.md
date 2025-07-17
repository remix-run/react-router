---
title: useMatch
---

# useMatch

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useMatch.html)

Returns a [`PathMatch`](https://api.reactrouter.com/v7/interfaces/react_router.PathMatch.html) object if the given pattern matches the current URL.
This is useful for components that need to know "active" state, e.g.
[`<NavLink>`](../components/NavLink).

## Signature

```tsx
function useMatch<ParamKey extends ParamParseKey<Path>, Path extends string>(
  pattern: PathPattern<Path> | Path,
): PathMatch<ParamKey> | null
```

## Params

### pattern

The pattern to match against the current [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html)

## Returns

The path match object if the pattern matches, `null` otherwise

