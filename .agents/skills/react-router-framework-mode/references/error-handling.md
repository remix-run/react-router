---
title: Error Handling
description: ErrorBoundary, error responses, isRouteErrorResponse, error reporting
tags: [errors, ErrorBoundary, useRouteError, isRouteErrorResponse, 404, 500]
---

# Error Handling

React Router catches errors in loaders, actions, and rendering, then displays them in error boundaries.

## ErrorBoundary Export

Export an `ErrorBoundary` from any route module:

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && <pre>{error.stack}</pre>}
      </div>
    );
  }

  return <h1>Unknown Error</h1>;
}
```

## Throwing Responses

Throw Response objects for expected errors:

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.getProduct(params.id);

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  return product;
}
```

Use the `data` helper for structured error data:

```tsx
import { data } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.getProduct(params.id);

  if (!product) {
    throw data(
      { message: "Product not found", productId: params.id },
      { status: 404 },
    );
  }

  return product;
}
```

## isRouteErrorResponse

Check if an error is a Response thrown from a loader/action:

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // This was a Response thrown intentionally
    // error.status, error.statusText, error.data are available
    return <NotFoundPage />;
  }

  // This was an unexpected error
  return <GenericErrorPage />;
}
```

## Error Bubbling

Errors bubble up to the nearest ErrorBoundary:

```
root.tsx (has ErrorBoundary)
└── products.tsx (no ErrorBoundary)
    └── product.$id.tsx (has ErrorBoundary)
```

- Error in `product.$id.tsx` → caught by `product.$id.tsx`
- Error in `products.tsx` → caught by `root.tsx`

## Root Error Boundary

Always define an ErrorBoundary in your root route as a last resort:

```tsx
// app/root.tsx
export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html>
      <head>
        <title>Oops!</title>
      </head>
      <body>
        <h1>Something went wrong</h1>
        {isRouteErrorResponse(error) ? (
          <p>
            {error.status}: {error.data}
          </p>
        ) : (
          <p>An unexpected error occurred</p>
        )}
      </body>
    </html>
  );
}
```

## Error Reporting

Report errors to a logging service in `entry.server.tsx`:

```tsx
// app/entry.server.tsx
import type { HandleErrorFunction } from "react-router";

export const handleError: HandleErrorFunction = (error, { request }) => {
  // Don't log aborted requests
  if (request.signal.aborted) {
    return;
  }

  // Report to your error tracking service
  reportErrorToService(error);

  // Always log for debugging
  console.error(error);
};
```

Reveal the server entry if it doesn't exist:

```shellscript
npx react-router reveal entry.server
```

## Validation Errors (Not Error Boundaries)

For form validation, return errors from the action instead of throwing:

```tsx
import { data } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString() ?? "";

  if (!email.includes("@")) {
    return data({ errors: { email: "Invalid email" } }, { status: 400 });
  }

  // Success
  await createUser({ email });
  return redirect("/welcome");
}
```

Access in component via `fetcher.data`:

```tsx
function SignupForm() {
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors;

  return (
    <fetcher.Form method="post">
      <input type="email" name="email" />
      {errors?.email && <span className="error">{errors.email}</span>}
      <button>Sign Up</button>
    </fetcher.Form>
  );
}
```

## Production vs Development

In production, error messages are sanitized to prevent leaking sensitive info. Full error details are only shown in development.
