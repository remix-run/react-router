---
title: Resource Routes
---

<docs-info>This feature is available when using the [React Router Vite Plugin][vite-plugin]</docs-info>

# Resource Routes

Resource Routes are not part of your application UI, but are still part of your application. They can send any kind of Response.

Most routes in React Router are UI Routes, or routes that actually render a component. But routes don't always have to render components. There are a handful of cases where you want to use route as a general-purpose endpoint to your website. Here are a few examples:

- JSON API for a mobile app that reuses server-side code with the React Router UI
- Dynamically generating PDFs
- Dynamically generating social images for blog posts or other pages
- Webhooks for other services like Stripe or GitHub
- a CSS file that dynamically renders custom properties for a user's preferred theme

## Creating Resource Routes

If a route doesn't export a default component, it can be used as a Resource Route. If called with `GET`, the loader's response is returned and none of the parent route loaders are called either (because those are needed for the UI, but this is not the UI). If called with `POST`, the action's response is returned.

For example, consider a UI Route that renders a report, note the link:

```tsx filename=app/routes/reports.$id.tsx lines=[12-14]
export async function loader({
  params,
}: LoaderFunctionArgs) {
  let report = await getReport(params.id);
  return report;
}

export default function Report() {
  const report = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>{report.name}</h1>
      <Link to="pdf" reloadDocument>
        View as PDF
      </Link>
      {/* ... */}
    </div>
  );
}
```

It's linking to a PDF version of the page. To make this work we can create a Resource Route below it. Notice that it has no default export component: that makes it a Resource Route.

```tsx filename=app/routes/reports.$id[.pdf].tsx
export async function loader({
  params,
}: LoaderFunctionArgs) {
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

<docs-info>Note the filename uses [escaping patterns][escaping] to include the extension in the URL.</docs-info>

When the user clicks the link from the UI route, they will navigate to the PDF.

## Linking to Resource Routes

<docs-error>It’s imperative that you use <code>reloadDocument</code> on any Links to Resource Routes</docs-error>

There's a subtle detail to be aware of when linking to resource routes. You need to link to it with `<Link reloadDocument>` or a plain `<a href>`. If you link to it with a normal `<Link to="pdf">` without `reloadDocument`, then the resource route will be treated as a UI route. React Router will try to get the data with `fetch` and render the component. Don't sweat it too much, you'll get a helpful error message if you make this mistake.

## Handling different request methods

To handle `GET` requests export a loader function:

```tsx
import type { Route } from "./+types.resource";

export const loader = async ({
  request,
}: Route.LoaderArgs) => {
  // handle "GET" request

  return { success: true };
};
```

To handle `POST`, `PUT`, `PATCH` or `DELETE` requests export an action function:

```tsx
import type { Route } from "./+types.resource";

export const action = async ({
  request,
}: Route.ActionArgs) => {
  switch (request.method) {
    case "POST": {
      /* handle "POST" */
    }
    case "PUT": {
      /* handle "PUT" */
    }
    case "PATCH": {
      /* handle "PATCH" */
    }
    case "DELETE": {
      /* handle "DELETE" */
    }
  }
};
```

Resource Routes do not support [non-standard HTTP methods][nonstandard-http-methods] - those should be handled by the HTTP server that serves your React Router requests.

## Turbo Stream

Returning bare objects or using the [`data` util][data-util] from a Resource Route will automatically encode the responses as a [turbo-stream][turbo-stream], which automatically serializes Dates, Promises, and other objects over the network. React Router automatically deserializes turbo-stream data when you call resource routes from React Router APIs such as `<Form>`, `useSubmit`, or `useFetcher`.

Third-party services, like webhooks, that call your resource routes likely can't decode turbo-stream data. You should use Response instances to respond with any other kind of data using `Response.json` or `new Response()` with the `Content-Type` header.

```ts
export const action = async () => {
  return Response.json(
    { time: Date.now() },
    {
      status: 200,
    }
  );
};
```

<docs-warning>turbo-stream is an implementation detail of Resource Routes, and you shouldn't rely on it outside of the React Router APIs. If you want to manually decode turbo-stream responses outside of React Router, such as from a `fetch` call in a mobile app, it is best to manually encode the data using the `turbo-stream` package directly, return that using `new Response`, and have the client decode the response using `turbo-stream`.</docs-warning>

## Client Loaders & Client Actions

When calling Resource Routes using `<Form>`, `useSubmit`, or Fetchers, Client Loaders and Actions defined in the Resource Route will participate in the request lifecycle.

```ts
import type { Route } from "./+types.github";

export const action = async () => {
  return Response.json(
    { time: Date.now() },
    {
      status: 200,
    }
  );
};

export const clientAction = async ({
  serverAction,
}: Route.ClientActionArgs) => {
  return Promise.race([
    serverAction,
    new Promise((resolve, reject) =>
      setTimeout(reject, 5000)
    ),
  ]);
};
```

## Webhooks

Resource routes can be used to handle webhooks. For example, you can create a webhook that receives notifications from GitHub when a new commit is pushed to a repository:

```tsx
import type { Route } from "./+types.github";

import crypto from "node:crypto";

export const action = async ({
  request,
}: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return Response.json(
      { message: "Method not allowed" },
      {
        status: 405,
      }
    );
  }
  const payload = await request.json();

  /* Validate the webhook */
  const signature = request.headers.get(
    "X-Hub-Signature-256"
  );
  const generatedSignature = `sha256=${crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex")}`;
  if (signature !== generatedSignature) {
    return Response.json(
      { message: "Signature mismatch" },
      {
        status: 401,
      }
    );
  }

  /* process the webhook (e.g. enqueue a background job) */

  return Response.json({ success: true });
};
```

[vite-plugin]: ../start/rendering
[turbo-stream]: https://github.com/jacob-ebey/turbo-stream
[data-util]: ../../api/react-router/data
[nonstandard-http-methods]: https://github.com/remix-run/react-router/issues/11959
[escaping]: ../misc/file-route-conventions#escaping-special-characters
