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

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.unstable_useRoute.html)

Returns the current route's `handle`, `loaderData`, and `actionData`, or
those of a matched route identified by `routeId`.

Omit `routeId` to read the current route. Pass a route ID to infer the
fields from registered route module types. Without an ID, the fields
are typed as `unknown`.

```tsx
import { unstable_useRoute as useRoute } from "react-router";

let currentRoute = useRoute();
let rootRoute = useRoute("root");

// A registered non-root route may not currently be matched:
let dashboard = useRoute("routes/dashboard");
if (dashboard) {
  console.log(dashboard.handle, dashboard.loaderData);
}
```

## Signature

```tsx
function useRoute<Args extends UseRouteArgs>(
  ...args: Args
): UseRouteResult<Args>
```

## Params

### args

An optional route ID. Omit it to read the current route.

## Returns

An object with the route's `handle`, `loaderData`, and
`actionData`, or `undefined` if the specified route is not matched.
Individual fields can be `undefined` when the handle or data is unavailable.

