---
title: Resource Routes
---

# Resource Routes

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
