---
title: Routes
---

# Routes

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Routes.html)

Renders a branch of [`<Route>`s](../components/Route) that best matches the current
location. Note that these routes do not participate in [data loading](../../start/framework/route-module#loader),
[`action`](../../start/framework/route-module#action), code splitting, or
any other [route module](../../start/framework/route-module) features.

```tsx
import { Route, Routes } from "react-router";

<Routes>
  <Route index element={<StepOne />} />
  <Route path="step-2" element={<StepTwo />} />
  <Route path="step-3" element={<StepThree />} />
</Routes>
```

## Signature

```tsx
function Routes({
  children,
  location,
}: RoutesProps): React.ReactElement | null
```

## Props

### children

Nested [`Route`](../components/Route) elements

### location

The [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) to match against. Defaults to the current location.

