---
title: useRoute
unstable: true
---

# unstable_useRoute

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

A typed shortcut for reading the current route's `handle`, `loaderData`,
and `actionData` in one call — the same data you would otherwise get
from `useRouteLoaderData` plus the route's `handle` export.

```tsx
import { unstable_useRoute as useRoute } from "react-router";

let { handle, loaderData } = useRoute();
// With a route id, the result is `... | undefined` when the route is not matched:
let dashboard = useRoute("dashboard");
```

## Params

### routeId

The id of the route to read data for. Defaults to the current route.

## Returns

The route's `handle`, `loaderData`, and `actionData`.
