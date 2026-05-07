---
title: useRouterState
---

# useRouterState

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

A unified hook for reading router state: current (`active`) and in-flight
(`pending`) locations, search params, params, matches, and navigation type.

```tsx
import { unstable_useRouterState as useRouterState } from "react-router";

let { active, pending } = useRouterState();
active.params; // params from the leaf match
pending?.location.pathname; // populated during in-flight navigations
```

## Signature

```tsx
function useRouterState(): unstable_RouterState
```

## Returns

The current router state with `active` and `pending` variants

