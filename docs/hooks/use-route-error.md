---
title: useRouteError
new: true
---

# `useRouteError`

Inside of an [`errorElement`][errorelement], this hooks returns anything thrown during an action, loader, or rendering. Note that thrown responses have special treatment, see [`isRouteErrorResponse`][isrouteerrorresponse] for more information.

```jsx
function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return <div>{error.message}</div>;
}

<Route
  errorElement={<ErrorBoundary />}
  loader={() => {
    // unexpected errors in loaders/actions
    something.that.breaks();
  }}
  action={() => {
    // stuff you throw on purpose in loaders/actions
    throw new Response("Bad Request", { status: 400 });
  }}
  element={
    // and errors thrown while rendering
    <div>{breaks.while.rendering}</div>
  }
/>;
```

[errorelement]: ../route/error-element
[isrouteerrorresponse]: ../fetch/is-route-error-response
