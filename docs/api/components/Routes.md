---
title: Routes
---

# Routes

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Routes.html)

Renders a branch of [Route](../components/Route) that best matches the current
location. Note that these routes do not participate in data loading, actions,
code splitting, or any other route module features.

```tsx
import { Routes, Route } from "react-router"

<Routes>
 <Route index element={<StepOne />} />
 <Route path="step-2" element={<StepTwo />} />
 <Route path="step-3" element={<StepThree />}>
</Routes>
```

## Props

### children

[modes: framework, data, declarative]

Nested [Route](../components/Route) elements

### location

[modes: framework, data, declarative]

The location to match against. Defaults to the current location.
