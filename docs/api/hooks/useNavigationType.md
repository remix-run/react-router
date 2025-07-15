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

Returns the current navigation action which describes how the router came to
the current location, either by a pop, push, or replace on the history stack.

## Signature

```tsx
function useNavigationType(): NavigationType
```

## Returns

The current navigation type (Action.Pop, Action.Push, or Action.Replace)

