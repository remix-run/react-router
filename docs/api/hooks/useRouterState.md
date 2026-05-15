---
title: useRouterState
unstable: true
---

# unstable_useRouterState

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react-router.unstable_useRouterState.html)

A unified hook for reading router state: current (`active`) and in-flight
(`pending`) locations, search params, params, matches, and navigation type.

This hook consolidates the information you used to get from [`useLocation`](../hooks/useLocation),
[`useSearchParams`](../hooks/useSearchParams), [`useParams`](../hooks/useParams), [`useMatches`](../hooks/useMatches), [`useNavigation`](../hooks/useNavigation),
and [`useNavigationType`](../hooks/useNavigationType) into a single hook.

```tsx
import { unstable_useRouterState as useRouterState } from "react-router";

let { active, pending } = unstable_useRouterState();

// Active is always populated with the current location
active.location; // replaces `useLocation()`
active.searchParams; // replaces `useSearchParams()[0]`
active.params; // replaces `useParams()`
active.matches; // replaces `useMatches()`
active.type; // replaces `useNavigationType()`

// Pending is only populated during a navigation
pending.location; // replaces `useNavigation().location`
pending.searchParams; // equivalent to `new URLSearchParams(useNavigation().search)`
pending.params; // Not directly accessible today
pending.matches; // Not directly accessible today
pending.type; // Not directly accessible today
pending.state; // replaces `useNavigation().state`
pending.formMethod; // replaces useNavigation().formMethod
pending.formAction; // replaces useNavigation().formAction
pending.formEncType; // replaces useNavigation().formEncType
pending.formData; // replaces useNavigation().formData
pending.json; // replaces useNavigation().json
pending.text; // replaces useNavigation().text
```

## Signature

```tsx
function useRouterState(): unstable_RouterState
```

## Returns

The current router state with `active` and `pending` variants

