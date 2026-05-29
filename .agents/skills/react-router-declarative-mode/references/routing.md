---
title: Routing
description: JSX-based route configuration with Routes and Route components
tags:
  [
    routing,
    Routes,
    Route,
    nested-routes,
    layout,
    dynamic-segments,
    params,
    Outlet,
  ]
---

# Routing

In declarative mode, routes are configured using JSX with `<Routes>` and `<Route>` components wrapped in a `<BrowserRouter>`.

## Basic Setup

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Route Component Props

| Prop       | Purpose                       | Example                               |
| ---------- | ----------------------------- | ------------------------------------- |
| `path`     | URL pattern to match          | `path="users/:id"`                    |
| `element`  | Component to render           | `element={<User />}`                  |
| `index`    | Default child route (no path) | `<Route index element={...} />`       |
| `children` | Nested routes                 | `<Route path="dashboard">...</Route>` |

## Nested Routes

Child routes are nested inside parent routes. Use `<Outlet />` in the parent to render the matched child:

```tsx
import { Routes, Route, Outlet } from "react-router";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <Link to="settings">Settings</Link>
        <Link to="profile">Profile</Link>
      </nav>
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

This creates:

- `/dashboard` → `<Dashboard>` with `<DashboardHome />` in the outlet
- `/dashboard/settings` → `<Dashboard>` with `<Settings />` in the outlet
- `/dashboard/profile` → `<Dashboard>` with `<Profile />` in the outlet

## Layout Routes

Routes without a `path` act as layout wrappers:

```tsx
<Routes>
  <Route element={<MarketingLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
  </Route>
  <Route element={<AppLayout />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

All routes under a layout route render inside that layout's `<Outlet />`.

## Index Routes

Index routes render at the parent's URL (the "default" child):

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="dashboard" element={<Dashboard />}>
    <Route index element={<DashboardHome />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

- `/` → `<Home />`
- `/dashboard` → `<Dashboard>` with `<DashboardHome />` in outlet
- `/dashboard/settings` → `<Dashboard>` with `<Settings />` in outlet

Index routes cannot have children.

## Route Prefixes

A Route with `path` but without `element` adds a path prefix to its children without introducing a layout:

```tsx
<Routes>
  {/* /projects/... without a shared layout */}
  <Route path="projects">
    <Route index element={<ProjectsHome />} />
    <Route path=":projectId" element={<Project />} />
    <Route path=":projectId/edit" element={<EditProject />} />
  </Route>
</Routes>
```

This is useful when routes share a path prefix but don't need a shared layout component.

## Dynamic Segments

Segments starting with `:` are dynamic and captured as params:

```tsx
<Route path="users/:userId" element={<User />} />
<Route path="posts/:postId/comments/:commentId" element={<Comment />} />
```

Access params with `useParams()`:

```tsx
import { useParams } from "react-router";

function User() {
  const { userId } = useParams();
  return <h1>User {userId}</h1>;
}
```

## Optional Segments

Add `?` to make a segment optional:

```tsx
<Route path=":lang?/products" element={<Products />} />
// matches /products and /en/products

<Route path="users/:userId/edit?" element={<User />} />
// matches /users/123 and /users/123/edit
```

## Splats (Catch-All)

Match any remaining path with `*`:

```tsx
<Route path="files/*" element={<FileViewer />} />
```

```tsx
import { useParams } from "react-router";

function FileViewer() {
  const { "*": filePath } = useParams();
  // filePath = "docs/intro.md" for /files/docs/intro.md
  return <div>Viewing: {filePath}</div>;
}
```

### 404 Catch-All

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Anti-Pattern: Flat Routes

```tsx
// ❌ DON'T: Flat structure when routes share layout
function App() {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="dashboard/settings" element={<DashboardSettings />} />
      <Route path="dashboard/profile" element={<DashboardProfile />} />
    </Routes>
  );
}

// ✅ DO: Use nested routes with shared layout
function App() {
  return (
    <Routes>
      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<DashboardSettings />} />
        <Route path="profile" element={<DashboardProfile />} />
      </Route>
    </Routes>
  );
}
```

Nested routes:

- Share layout code via `<Outlet />`
- Reduce code duplication
- Make it clear which routes are related
- Enable layout-level state persistence

## Linking Basics

Use `<Link>` for navigation between routes:

```tsx
import { Link } from "react-router";

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/users/123">User 123</Link>
    </nav>
  );
}
```

See [navigation.md](./navigation.md) for full details on navigation patterns.

## See Also

- [navigation.md](./navigation.md) - Link, NavLink, and useNavigate
- [url-values.md](./url-values.md) - Reading params and search params
- [React Router Documentation](https://reactrouter.com/docs)
