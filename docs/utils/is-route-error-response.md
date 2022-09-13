---
title: isRouteErrorResponse
new: true
---

# `isRouteErrorResponse`

This returns `true` if a [route error][routeerror] is a _route error response_.

```jsx
import { isRouteErrorResponse } from "react-router-dom";

function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Oops!</h1>
        <h2>{error.status}</h2>
        <p>{error.statusText}</p>
        {error.data?.message && <p>{error.data.message}</p>}
      </div>
    );
  } else {
    return <div>Oops</div>;
  }
}
```

When a response is thrown from an action or loader, it will be unwrapped into an `ErrorResponse` so that your component doesn't have to deal with the complexity of unwrapping it (which would require React state and effects to deal with the promise returned from `res.json()`)

```jsx
import { json } from "react-router-dom";

<Route
  errorElement={<ErrorBoundary />}
  action={() => {
    throw json(
      { message: "email is required" },
      { status: 400 }
    );
  }}
/>;

function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    error.status; // 400
    error.data; // { "message: "email is required" }
  }
}
```

<docs-info>If the user visits a route that does not match any routes in the app, React Router itself will throw a 404 response.</docs-info>

[routeerror]: ../hooks/use-route-error
