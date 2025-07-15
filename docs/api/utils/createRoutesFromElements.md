---
title: createRoutesFromElements
---

# createRoutesFromElements

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx#L1516
-->

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createRoutesFromElements.html)

Create route objects from JSX elements instead of arrays of objects.

```tsx
const routes = createRoutesFromElements(
  <>
    <Route index loader={step1Loader} Component={StepOne} />
    <Route path="step-2" loader={step2Loader} Component={StepTwo} />
    <Route path="step-3" loader={step3Loader} Component={StepThree} />
  </>
);

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}
```

## Params

### children

The React children to convert into a route config

### parentPath

The path of the parent route, used to generate unique IDs. This is used for internal recursion and is not intended to be used by the
application developer.

## Returns

An array of route objects that can be used with a data router

