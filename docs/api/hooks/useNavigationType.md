---
title: useNavigationType
---

# useNavigationType

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigationType.html)

Returns the current [`Navigation`](https://api.reactrouter.com/v7/types/react_router.Navigation.html) action which describes how the router
came to the current [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html), either by a pop, push, or replace on
the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack.

## Signature

```tsx
function useNavigationType(): NavigationType
```

## Returns

The current [`NavigationType`](https://api.reactrouter.com/v7/enums/react_router.NavigationType.html) (`"POP"`, `"PUSH"`, or `"REPLACE"`)

