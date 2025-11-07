---
title: Resource Routes
---

# Resource Routes

[MODES: framework, data]

<br/>
<br/>

When server rendering, routes can serve "resources" instead of rendering components, like images, PDFs, JSON payloads, webhooks, etc.

## Defining a Resource Route

A route becomes a resource route by convention when its module exports a loader or action but does not export a default component.

Consider a route that serves a PDF instead of UI:

```ts
route("/reports/pdf/:id", "pdf-report.ts");
```

```tsx filename=pdf-report.ts
import type { Route } from "./+types/pdf-report";

export async function loader({ params }: Route.LoaderArgs) {
  const report = await getReport(params.id);
  const pdf = await generateReportPDF(report);
  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
```

Note there is no default export. That makes this route a resource route.

## Linking to Resource Routes

When linking to resource routes, use `<a>` or `<Link reloadDocument>`, otherwise React Router will attempt to use client side routing and fetching the payload (you'll get a helpful error message if you make this mistake).

```tsx
<Link reloadDocument to="/reports/pdf/123">
  View as PDF
</Link>
```

## Handling different request methods

GET requests are handled by the `loader`, while POST, PUT, PATCH, and DELETE are handled by the `action`:

```tsx
import type { Route } from "./+types/resource";

export function loader(_: Route.LoaderArgs) {
  return Response.json({ message: "I handle GET" });
}

export function action(_: Route.ActionArgs) {
  return Response.json({
    message: "I handle everything else",
  });
}
```

## Error Handling

Resource routes can be accessed in two ways, and the error handling approach depends on how they're accessed:

### Internal access (via fetchers)

If your resource route is accessed internally via [`useFetcher`](../api/hooks/use-fetcher) (or might be accessed both ways), use `data()` instead of `Response` objects. This allows the route to be encoded into single-fetch responses and supports streaming:

```tsx filename=api/data.ts
import type { Route } from "./+types/data";
import { data } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const record = await getRecord(params.id);

  if (!record) {
    // Return 4xx errors - these are expected and don't trigger ErrorBoundary
    return data(
      { error: "Record not found" },
      { status: 404 },
    );
  }

  return data(record);
}

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const input = formData.get("input");

  if (!input) {
    // Return 4xx for validation errors
    return data(
      { error: "Input required" },
      { status: 400 },
    );
  }

  try {
    const result = await processData(input);
    return data(result);
  } catch (error) {
    // Throw 5xx errors - these trigger ErrorBoundary for the fetcher
    throw data({ error: "" }, { status: 500 });
  }
}
```

- **`return data()`**: For normal responses and expected errors (4xx). The data is available in `fetcher.data` and won't trigger an error boundary.
- **`throw data()`**: For fatal errors (5xx) that should trigger the error boundary. Use [`isRouteErrorResponse`](../api/utils/isRouteErrorResponse) in your [Error Boundary](./error-boundary) to handle these.

### External-only access (REST API)

If your resource route is only accessed externally (via `fetch`, `cURL`, direct browser navigation, etc.), treat it as a standard REST API endpoint. Always return `Response` objects with appropriate status codes:

```tsx filename=api/users.ts
import type { Route } from "./+types/users";

export async function loader({ params }: Route.LoaderArgs) {
  const user = await getUser(params.id);

  if (!user) {
    // Return 404 for not found
    return Response.json(
      { error: "User not found" },
      { status: 404 },
    );
  }

  return Response.json(user);
}

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || !isValidEmail(email)) {
    // Return 400 for validation errors
    return Response.json(
      { error: "Invalid email" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(email);
    return Response.json(user, { status: 201 });
  } catch (error) {
    // Unexpected errors will be caught and wrapped in a 500 response
    // In production, error details are sanitized for security
    throw error;
  }
}
```

When accessed externally, resource routes don't render error boundaries (there's no UI to render). Any thrown `Error` instances will be automatically wrapped in a 500 response and sanitized in production.

When a resource route using `data()` is accessed externally, React Router automatically converts the `data()` response to a `Response` object, allowing you to write flexible resource routes that work both ways.
