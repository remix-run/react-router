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

## Return Types

Resource Routes are flexible when it comes to the return type - you can return [`Response`][Response] instances or [`data()`][data] objects. A good general rule of thumb when deciding which type to use is:

- If you're using resource routes intended for external consumption, return `Response` instances
  - Keeps the resulting response encoding explicit in your code rather than having to wonder how React Router might convert `data() -> Response` under the hood
- If you're accessing resource routes from [fetchers][fetcher] or [`<Form>`][form] submissions, return `data()`
  - Keeps things consistent with the loaders/actions in your UI routes
  - Allows you to stream promises down to your UI through `data()`/[`Await`][await]

## Error Handling

Throwing an `Error` from Resource route (or anything other than a `Response`/`data()`) will trigger [`handleError`][handleError] and result in a 500 HTTP Response:

```tsx
export function action() {
  let db = await getDb();
  if (!db) {
    // Fatal error - return a 500 response and trigger `handleError`
    throw new Error("Could not connect to DB");
  }
  // ...
}
```

If a resource route generates a `Response` (via `new Response()` or `data()`), it is considered a successful execution and will not trigger `handleError` because the API has successfully produced a Response for the HTTP request. This applies to thrown responses as well as returned responses with a 4xx/5xx status code. This behavior aligns with `fetch()` which does not return a rejected promise on 4xx/5xx Responses.

```tsx
export function action() {
  // Non-fatal error - don't trigger `handleError`:
  throw new Response(
    { error: "Unauthorized" },
    { status: 401 },
  );

  // These 3 are equivalent to the above
  return new Response(
    { error: "Unauthorized" },
    { status: 401 },
  );

  throw data({ error: "Unauthorized" }, { status: 401 });

  return data({ error: "Unauthorized" }, { status: 401 });
}
```

### Error Boundaries

[Error Boundaries][error-boundary] are only applicable when a resource route is accessed from a UI, such as from a [`fetcher`][fetcher] call or a [`<Form>`][form] submission. If you `throw` from your resource route in these cases, it will bubble to the nearest `ErrorBoundary` in the UI.

[handleError]: ../api/framework-conventions/entry.server.tsx#handleerror
[data]: ../api/utils/data
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[fetcher]: ../api/hooks/useFetcher
[form]: ../api/components/Form
[await]: ../api/components/Await
[error-boundary]: ../start/framework/route-module#errorboundary
