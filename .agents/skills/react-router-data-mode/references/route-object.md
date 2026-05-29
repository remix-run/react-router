---
title: Route Object
description: Route object properties including Component, loader, action, and lazy
tags:
  [route-object, Component, loader, action, lazy, shouldRevalidate, middleware]
---

# Route Object

Route objects define the behavior of each route in your application.

## Properties Quick Reference

| Property           | Purpose                             | Type                       |
| ------------------ | ----------------------------------- | -------------------------- |
| `path`             | URL segment to match                | `string`                   |
| `Component`        | React component to render           | `React.ComponentType`      |
| `loader`           | Load data before render             | `LoaderFunction`           |
| `action`           | Handle form mutations               | `ActionFunction`           |
| `children`         | Nested routes                       | `RouteObject[]`            |
| `index`            | Mark as index route                 | `boolean`                  |
| `ErrorBoundary`    | Render on errors                    | `React.ComponentType`      |
| `lazy`             | Code-split route module             | `() => Promise<...>`       |
| `shouldRevalidate` | Control loader revalidation         | `ShouldRevalidateFunction` |
| `middleware`       | Pre/post request processing (v7.9+) | `MiddlewareFunction[]`     |
| `handle`           | Custom route metadata               | `any`                      |

## Component

The React component to render when the route matches:

```tsx
const router = createBrowserRouter([
  {
    path: "/about",
    Component: About,
  },
]);

function About() {
  return <h1>About Us</h1>;
}
```

Use `useLoaderData()` and `useActionData()` hooks inside the component to access data.

## loader

Function that loads data before the component renders:

```tsx
const router = createBrowserRouter([
  {
    path: "/teams/:teamId",
    loader: async ({ params, request }) => {
      return fetchTeam(params.teamId);
    },
    Component: Team,
  },
]);
```

See [data-loading.md](./data-loading.md) for complete patterns.

## action

Function that handles form submissions and mutations:

```tsx
const router = createBrowserRouter([
  {
    path: "/projects/new",
    action: async ({ request }) => {
      const formData = await request.formData();
      const project = await createProject(formData);
      return redirect(`/projects/${project.id}`);
    },
    Component: NewProject,
  },
]);
```

See [actions.md](./actions.md) for complete patterns.

## children

Array of nested route objects:

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      {
        path: "dashboard",
        Component: Dashboard,
        children: [
          { index: true, Component: DashboardHome },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
]);
```

## index

Marks the route as an index route (renders at parent's URL):

```tsx
{
  path: "/dashboard",
  Component: Dashboard,
  children: [
    { index: true, Component: DashboardHome }, // Renders at /dashboard
    { path: "settings", Component: Settings }, // Renders at /dashboard/settings
  ],
}
```

## ErrorBoundary

Component to render when errors occur in the route:

```tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

const router = createBrowserRouter([
  {
    path: "/teams/:teamId",
    loader: async ({ params }) => {
      const team = await fetchTeam(params.teamId);
      if (!team) {
        throw new Response("Not Found", { status: 404 });
      }
      return team;
    },
    Component: Team,
    ErrorBoundary: TeamErrorBoundary,
  },
]);

function TeamErrorBoundary() {
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
    return <h1>Error: {error.message}</h1>;
  }

  return <h1>Unknown Error</h1>;
}
```

## lazy

Code-split route modules for better performance:

```tsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    lazy: async () => {
      const { Dashboard, loader } = await import("./routes/dashboard");
      return { Component: Dashboard, loader };
    },
  },
]);
```

The `lazy` function can return any route properties except `path` and `children`:

```tsx
lazy: async () => ({
  Component: Dashboard,
  loader: dashboardLoader,
  action: dashboardAction,
  ErrorBoundary: DashboardError,
});
```

## shouldRevalidate

Control when the loader re-runs after navigation:

```tsx
const router = createBrowserRouter([
  {
    path: "/products",
    loader: productsLoader,
    shouldRevalidate: ({
      currentUrl,
      nextUrl,
      formMethod,
      defaultShouldRevalidate,
    }) => {
      // Don't revalidate on search param changes only
      if (currentUrl.pathname === nextUrl.pathname) {
        return false;
      }
      return defaultShouldRevalidate;
    },
    Component: Products,
  },
]);
```

### ShouldRevalidate Arguments

- `currentUrl` - The current URL
- `nextUrl` - The URL being navigated to
- `formMethod` - HTTP method if triggered by form submission
- `formAction` - Form action URL if triggered by form
- `formData` - Form data if triggered by form submission
- `defaultShouldRevalidate` - React Router's default decision

## middleware (v7.9.0+)

Array of functions that run before loaders and actions:

```tsx
import { unstable_MiddlewareContext as MiddlewareContext } from "react-router";

const userContext = new MiddlewareContext<User>();

const router = createBrowserRouter([
  {
    path: "/dashboard",
    middleware: [
      async ({ request, context }, next) => {
        const user = await getUser(request);
        if (!user) {
          throw redirect("/login");
        }
        context.set(userContext, user);
        return next();
      },
    ],
    loader: async ({ context }) => {
      const user = context.get(userContext);
      return { user };
    },
    Component: Dashboard,
  },
]);
```

## handle

Custom metadata accessible via `useMatches()`:

```tsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    Component: Dashboard,
    handle: {
      breadcrumb: "Dashboard",
      permissions: ["admin"],
    },
  },
]);

// Access in any component
function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => m.handle?.breadcrumb)
    .map((m) => m.handle.breadcrumb);
  return <nav>{crumbs.join(" > ")}</nav>;
}
```

## Complete Example

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
  isRouteErrorResponse,
  useRouteError,
  useLoaderData,
} from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: Home },
      {
        path: "teams/:teamId",
        loader: async ({ params }) => {
          const team = await fetchTeam(params.teamId);
          if (!team) {
            throw new Response("Not Found", { status: 404 });
          }
          return team;
        },
        action: async ({ request, params }) => {
          const formData = await request.formData();
          await updateTeam(params.teamId, formData);
          return { success: true };
        },
        Component: Team,
        ErrorBoundary: TeamError,
        handle: { breadcrumb: "Team" },
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
```

## See Also

- [routing.md](./routing.md) - Route configuration patterns
- [data-loading.md](./data-loading.md) - Loader patterns
- [actions.md](./actions.md) - Action patterns
- [React Router Route Object Documentation](https://reactrouter.com/start/data/routing)
