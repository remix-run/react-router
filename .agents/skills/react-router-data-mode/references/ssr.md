---
title: Server-Side Rendering
description: Manual SSR setup with createStaticHandler, createStaticRouter, and StaticRouterProvider
tags: [ssr, server-side-rendering, createStaticHandler, createStaticRouter, StaticRouterProvider, hydration]
---

# Server-Side Rendering

SSR with data mode requires manual setup using `createStaticHandler` on the server and hydration with `createBrowserRouter` on the client. Use this when you want SSR without the framework's Vite plugin.

## When to Use

- Server-side rendering with data mode (without the framework Vite plugin)
- Custom server setups (Express, Fastify, etc.)
- Need to run loaders/actions on the server

## Route Configuration

Extract routes to a shared file used by both server and client:

```tsx
// routes.tsx
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Team } from "./pages/Team";

export const routes = [
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      {
        path: "teams/:teamId",
        loader: async ({ params }) => {
          return fetchTeam(params.teamId);
        },
        Component: Team,
      },
    ],
  },
];
```

## Server-Side Rendering

Use `createStaticHandler` to create a handler that runs loaders and actions on the server:

```tsx
// server.tsx
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { renderToString } from "react-dom/server";
import { routes } from "./routes";

export async function render(request: Request): Promise<Response> {
  // Create handler that can run loaders/actions
  const handler = createStaticHandler(routes);

  // Execute loaders for the matched routes
  const context = await handler.query(request);

  // Handle redirects (query returns a Response for redirects)
  if (context instanceof Response) {
    return context;
  }

  // Create static router with the context from loaders
  const router = createStaticRouter(handler.dataRoutes, context);

  // Render the app to HTML
  const html = renderToString(
    <StaticRouterProvider router={router} context={context} />
  );

  return new Response(renderFullDocument(html), {
    headers: { "Content-Type": "text/html" },
  });
}
```

### Handle Redirects

The `handler.query()` method returns a `Response` when a loader or action redirects:

```tsx
const context = await handler.query(request);

// Check if it's a redirect response
if (context instanceof Response) {
  // Return the redirect response directly
  return context;
}

// Otherwise, context contains the routing data
const router = createStaticRouter(handler.dataRoutes, context);
```

### HTML Template

Include CSS in a `<link>` tag to avoid flash of unstyled content:

```tsx
function renderFullDocument(appHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My App</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/client.tsx"></script>
  </body>
</html>`;
}
```

## Client Hydration

Use `createBrowserRouter` with the same routes and hydrate with `hydrateRoot`:

```tsx
// client.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { hydrateRoot } from "react-dom/client";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

hydrateRoot(
  document.getElementById("root")!,
  <RouterProvider router={router} />
);
```

The browser router automatically picks up the data that was serialized from the server.

## Complete Example

### Shared Routes

```tsx
// routes.tsx
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { Team } from "./pages/Team";
import { fetchTeam } from "./api";

export const routes = [
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: "teams/:teamId",
        loader: async ({ params }) => {
          return fetchTeam(params.teamId);
        },
        Component: Team,
      },
    ],
  },
];
```

### Server Entry

```tsx
// server.tsx
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router";
import { renderToString } from "react-dom/server";
import { routes } from "./routes";

export async function handleRequest(request: Request): Promise<Response> {
  const handler = createStaticHandler(routes);
  const context = await handler.query(request);

  // Handle redirects
  if (context instanceof Response) {
    return context;
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const appHtml = renderToString(
    <StaticRouterProvider router={router} context={context} />
  );

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/client.tsx"></script>
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

### Client Entry

```tsx
// client.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { hydrateRoot } from "react-dom/client";
import { routes } from "./routes";

const router = createBrowserRouter(routes);

hydrateRoot(
  document.getElementById("root")!,
  <RouterProvider router={router} />
);
```

## CSS Considerations

Always include CSS as a `<link>` tag in the HTML template, not just via JavaScript imports:

```tsx
// ❌ DON'T: Only import CSS in JavaScript
// This causes flash of unstyled content on initial load
import "./styles.css";

// ✅ DO: Include CSS in the HTML template
<link rel="stylesheet" href="/styles.css" />
```

JavaScript-imported CSS won't be available until the JS loads and executes, causing a flash of unstyled content (FOUC) on the initial server-rendered page.

## API Reference

| Function | Purpose |
| -------- | ------- |
| `createStaticHandler(routes)` | Creates a handler that can run loaders/actions on the server |
| `handler.query(request)` | Executes loaders for matched routes, returns context or redirect Response |
| `createStaticRouter(dataRoutes, context)` | Creates a static router from handler's dataRoutes and context |
| `StaticRouterProvider` | Renders the app on the server with router and context props |

## See Also

- [routing.md](./routing.md) - Route configuration
- [data-loading.md](./data-loading.md) - Loader patterns
- [React Router SSR Documentation](https://reactrouter.com/start/data/custom)
