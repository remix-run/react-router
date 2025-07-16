---
title: Route
---

# Route

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Route.html)

Configures an element to render when a pattern matches the current location.
It must be rendered within a [`Routes`](../components/Routes) element. Note that these routes
do not participate in data loading, actions, code splitting, or any other
route module features.

```tsx
// Usually used in a declarative router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<StepOne />} />
        <Route path="step-2" element={<StepTwo />} />
        <Route path="step-3" element={<StepThree />} />
      </Routes>
   </BrowserRouter>
  );
}

// But can be used with a data router as well if you prefer the JSX notation
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

## Signature

```tsx
function Route(props: RouteProps): React.ReactElement | null
```

## Props

### action

The route action.
See [`action`](../../start/data/route-object#action).

### caseSensitive

Whether the path should be case-sensitive. Defaults to `false`.

### Component

The React Component to render when this route matches.
Mutually exclusive with `element`.

### children

Child Route components

### element

The React element to render when this Route matches.
Mutually exclusive with `Component`.

### ErrorBoundary

The React Component to render at this route if an error occurs.
Mutually exclusive with `errorElement`.

### errorElement

The React element to render at this route if an error occurs.
Mutually exclusive with `ErrorBoundary`.

### handle

The route handle.

### HydrateFallback

The React Component to render while this router is loading data.
Mutually exclusive with `hydrateFallbackElement`.

### hydrateFallbackElement

The React element to render while this router is loading data.
Mutually exclusive with `HydrateFallback`.

### id

The unique identifier for this route (for use with [`DataRouter`](https://api.reactrouter.com/v7/interfaces/react_router.DataRouter.html)s)

### index

Whether this is an index route.

### lazy

A function that returns a promise that resolves to the route object.
Used for code-splitting routes.
See [`lazy`](../../start/data/route-object#lazy).

### loader

The route loader.
See [`loader`](../../start/data/route-object#loader).

### path

The path pattern to match. If unspecified or empty, then this becomes a
layout route.

### shouldRevalidate

The route shouldRevalidate function.
See [`shouldRevalidate`](../../start/data/route-object#shouldRevalidate).

