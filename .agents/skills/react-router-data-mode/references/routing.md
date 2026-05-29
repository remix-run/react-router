---
title: Routing
description: Route configuration with createBrowserRouter and route objects
tags: [routing, createBrowserRouter, route-objects, nested-routes, layout, dynamic-segments]
---

# Routing

Routes are configured as JavaScript objects and passed to `createBrowserRouter`.

## Basic Setup

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## Route Object Properties

| Property   | Purpose                               |
| ---------- | ------------------------------------- |
| `path`     | URL segment to match                  |
| `Component`| React component to render             |
| `children` | Nested routes                         |
| `index`    | Default child route (no path segment) |
| `loader`   | Data loading function                 |
| `action`   | Form submission handler               |

See [route-object.md](./route-object.md) for all properties.

## Nested Routes

Child routes render inside the parent's `<Outlet />`:

```tsx
import { Outlet } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { path: "teams", Component: Teams },
      { path: "projects", Component: Projects },
    ],
  },
]);

function Root() {
  return (
    <div>
      <nav>
        <Link to="/teams">Teams</Link>
        <Link to="/projects">Projects</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

Parent path is automatically included in children: `/teams` and `/projects`.

### Deeply Nested Routes

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "dashboard",
        Component: Dashboard,
        children: [
          { index: true, Component: DashboardHome },
          { path: "settings", Component: Settings },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
]);
```

Creates: `/dashboard`, `/dashboard/settings`, `/dashboard/profile`.

## Layout Routes

Layout routes have no `path` - they only provide UI wrapper via `<Outlet />`:

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        // No path - this is a layout route
        Component: AuthLayout,
        children: [
          { path: "login", Component: Login },
          { path: "register", Component: Register },
        ],
      },
    ],
  },
]);

function AuthLayout() {
  return (
    <div className="auth-container">
      <Outlet />
    </div>
  );
}
```

Both `/login` and `/register` render inside `AuthLayout`.

## Index Routes

Index routes render at the parent's URL (default child):

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home }, // Renders at /
      {
        path: "dashboard",
        Component: Dashboard,
        children: [
          { index: true, Component: DashboardHome }, // Renders at /dashboard
          { path: "settings", Component: Settings }, // Renders at /dashboard/settings
        ],
      },
    ],
  },
]);
```

Index routes cannot have children.

## Dynamic Segments

Segments starting with `:` are dynamic and available via `useParams` or `params`:

```tsx
const router = createBrowserRouter([
  {
    path: "/teams/:teamId",
    loader: async ({ params }) => {
      return fetchTeam(params.teamId);
    },
    Component: Team,
  },
]);

function Team() {
  const { teamId } = useParams();
  const data = useLoaderData();
  return <h1>Team {teamId}: {data.name}</h1>;
}
```

Multiple dynamic segments:

```tsx
{ path: "c/:categoryId/p/:productId", Component: Product }
// params: { categoryId: string; productId: string }
```

## Optional Segments

Add `?` to make a segment optional:

```tsx
{ path: ":lang?/categories", Component: Categories }
// Matches /categories and /en/categories

{ path: "users/:userId/edit?", Component: User }
// Matches /users/123 and /users/123/edit
```

## Splats (Catch-All)

Match any remaining path with `*`:

```tsx
const router = createBrowserRouter([
  {
    path: "/files/*",
    loader: async ({ params }) => {
      const filePath = params["*"]; // e.g., "docs/intro.md"
      return getFile(filePath);
    },
    Component: FileBrowser,
  },
]);
```

### 404 Catch-All

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ... other routes
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);

function NotFound() {
  return <h1>Page not found</h1>;
}
```

## Anti-Pattern: Flat Routes

```tsx
// ❌ DON'T: Flat structure with no shared layouts
const router = createBrowserRouter([
  { path: "/dashboard", Component: Dashboard },
  { path: "/dashboard/settings", Component: DashboardSettings },
  { path: "/dashboard/profile", Component: DashboardProfile },
]);

// ✅ DO: Use nested routes with shared layout
const router = createBrowserRouter([
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "settings", Component: Settings },
      { path: "profile", Component: Profile },
    ],
  },
]);
```

## See Also

- [route-object.md](./route-object.md) - All route object properties
- [React Router Routing Documentation](https://reactrouter.com/start/data/routing)
