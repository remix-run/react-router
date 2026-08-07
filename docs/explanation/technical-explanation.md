---
title: Technical Explanation
---

# Technical Explanation

[MODES: framework]

<br/>
<br/>

In Framework Mode, React Router is more than a client-side router. It coordinates a compiler, a request handler, route modules, and a browser runtime so that a route can describe both the UI and the data mutations or reads that support it.

That combination lets a React Router app work like a traditional web app first, then enhance navigations and form submissions in the browser after JavaScript loads.

## Compiler

Everything starts with the build. The React Router Vite plugin understands your route configuration and creates separate artifacts for the server and the browser.

The server build contains the route modules needed to render documents, run loaders and actions, and handle server-side requests. The browser build contains the JavaScript, CSS, and other assets needed to hydrate the page and support client-side transitions.

The build also creates a manifest that connects routes to their browser assets. React Router uses that information to load the right modules for the initial document and for later navigations.

This is what lets your app split code by route while still rendering the first document on the server. The server can send useful HTML before the browser has downloaded every route module, and the browser can fetch only the code and data needed for the next URL.

## Request Handler and Adapters

React Router does not need to be the JavaScript server itself. In Framework Mode, it provides a request handler that can be used by an actual server or deployment adapter.

The handler receives a standard web `Request`, matches the URL to your routes, runs the relevant loaders or actions, renders the route tree when needed, and returns a standard web `Response`.

Adapters are responsible for connecting that handler to a specific runtime. For example, an adapter can convert a platform-specific request into a web `Request`, call the React Router handler, and then translate the web `Response` back into the platform's response API.

This keeps the application model portable. The same route modules can run in different JavaScript server environments as long as an adapter can connect the host platform to the web request and response APIs.

## Route Modules

Routes are the main boundary in a Framework Mode app. A route module can own the UI for a URL segment and the server logic needed to load or mutate the data for that UI.

```tsx
import {
  Form,
  Outlet,
  useActionData,
  useLoaderData,
} from "react-router";

export async function loader() {
  return { projects: await db.projects.findAll() };
}

export async function action({ request }) {
  let formData = await request.formData();
  let title = formData.get("title");

  if (typeof title !== "string" || title.length === 0) {
    return { errors: ["A title is required"] };
  }

  await db.projects.create({ title });
  return { ok: true };
}

export default function Projects() {
  let { projects } = useLoaderData<typeof loader>();
  let actionData = useActionData<typeof action>();

  return (
    <section>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.title}</li>
        ))}
      </ul>

      <Form method="post">
        <input name="title" />
        <button type="submit">Create Project</button>
      </Form>

      {actionData?.errors ? (
        <p>{actionData.errors.join(", ")}</p>
      ) : null}

      <Outlet />
    </section>
  );
}
```

The `loader` runs for reads, the `action` runs for mutations, and the default export renders the route UI. Nested routes compose through `Outlet`, so each layout can own the data and UI for its part of the URL.

This route-focused model keeps related behavior close together without requiring the browser to call a separate API route for every interaction.

## Browser Runtime

After the server sends the document, the browser hydrates the route tree. From that point on, React Router can intercept links and forms that were already valid HTML and handle them with client-side navigation.

A `<Link>` renders an anchor. A `<Form>` renders a form. Before JavaScript loads, the browser can still follow the link or submit the form with normal document requests. After JavaScript loads, React Router enhances those same interactions by fetching the next route data, updating the UI, preserving persistent layouts, and exposing pending states.

For example, a submit button can start as plain HTML:

```tsx
import { Form } from "react-router";

export function CreateProject() {
  return (
    <Form method="post">
      <input name="title" />
      <button type="submit">Create Project</button>
    </Form>
  );
}
```

Then you can add browser-only feedback without changing the underlying interaction:

```tsx
import { Form, useNavigation } from "react-router";

export function CreateProject() {
  let navigation = useNavigation();
  let isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input name="title" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Project"}
      </button>
    </Form>
  );
}
```

The browser runtime improves the experience, but the server route still owns the mutation. This is the foundation of progressive enhancement in Framework Mode: start with the platform primitives of URLs, requests, responses, links, and forms, then layer on client-side behavior where it helps.

See also: [Progressive Enhancement][progressive_enhancement], [Server vs. Client Code Execution][server_client_execution], and [Backend For Frontend][backend_for_frontend].

[progressive_enhancement]: ./progressive-enhancement
[server_client_execution]: ./server-client-execution
[backend_for_frontend]: ./backend-for-frontend
