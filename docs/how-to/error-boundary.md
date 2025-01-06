---
title: Error Boundaries
---

# Error Boundaries

To avoid rendering an empty page to users, route modules will automatically catch errors in your code and render the closest `ErrorBoundary`.

Error boundaries are not intended for error reporting or rendering form validation errors. Please see [Form Validation](./form-validation) and [Error Reporting](./error-reporting) instead.

## 1. Add a root error boundary

All applications should at a minimum export a root error boundary. This one handles the three main cases:

- Thrown `data` with a status code and text
- Instances of errors with a stack trace
- Randomly thrown values

```tsx filename=root.tsx
import { Route } from "./+types/root";

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
```

## 2. Write a bug

It's not recommended to intentionally throw errors to force the error boundary to render as a means of control flow. Error Boundaries are primarily for catching unintentional errors in your code.

```tsx
export async function loader() {
  return undefined();
}
```

This will render the `instanceof Error` branch of the UI from step 1.

This is not just for loaders, but for all route module APIs: loaders, actions, components, headers, links, and meta.

## 3. Throw data in loaders/actions

There are exceptions to the rule in #2, especially 404s. You can intentionally `throw data()` (with a proper status code) to the closest error boundary when your loader can't find what it needs to render the page. Throw a 404 and move on.

```tsx
import { data } from "react-router";

export async function loader({ params }) {
  let record = await fakeDb.getRecord(params.id);
  if (!record) {
    throw data("Record Not Found", { status: 404 });
  }
  return record;
}
```

This will render the `isRouteErrorResponse` branch of the UI from step 1.

## 4. Nested error boundaries

When an error is thrown, the "closest error boundary" will be rendered. Consider these nested routes:

```tsx filename="routes.ts"
// ✅ has error boundary
route("/app", "app.tsx", [
  // ❌ no error boundary
  route("invoices", "invoices.tsx", [
    // ✅ has error boundary
    route("invoices/:id", "invoice-page.tsx", [
      // ❌ no error boundary
      route("payments", "payments.tsx"),
    ]),
  ]),
]);
```

The following table shows which error boundary will render given the origin of the error:

| error origin     | rendered boundary |
| ---------------- | ----------------- |
| app.tsx          | app.tsx           |
| invoices.tsx     | app.tsx           |
| invoice-page.tsx | invoice-page.tsx  |
| payments.tsx     | invoice-page.tsx  |

## Error Sanitization

In production mode, any errors that happen on the server are automatically sanitized before being sent to the browser to prevent leaking any sensitive server information (like stack traces).

This means that a thrown `Error` will have a generic message and no stack trace in production in the browser. The original error is untouched on the server.

Also note that data sent with `throw data(yourData)` is not sanitized as the data there is intended to be rendered.
