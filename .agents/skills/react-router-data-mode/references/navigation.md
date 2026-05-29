---
title: Navigation
description: Link, NavLink, useNavigate, redirect, and Form navigation
tags: [navigation, Link, NavLink, useNavigate, redirect, Form, ScrollRestoration]
---

# Navigation

React Router provides several ways to navigate between routes.

## Link Component

Basic navigation with the `<Link>` component:

```tsx
import { Link } from "react-router";

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/products/123">Product</Link>
    </nav>
  );
}
```

### Link Props

- `to` - Destination path (string or object)
- `replace` - Replace current history entry instead of pushing
- `state` - Pass state to the destination
- `preventScrollReset` - Prevent scroll position reset

```tsx
<Link to="/dashboard" replace state={{ from: "home" }}>
  Dashboard
</Link>
```

---

## NavLink Component

Link with active and pending state awareness:

```tsx
import { NavLink } from "react-router";

function Nav() {
  return (
    <nav>
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Home
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive, isPending }) =>
          isPending ? "pending" : isActive ? "active" : ""
        }
      >
        Products
      </NavLink>
    </nav>
  );
}
```

### NavLink Props

- `end` - Only match if the path is exact (not just a prefix)
- `className` - String or function receiving `{ isActive, isPending }`
- `style` - Object or function receiving `{ isActive, isPending }`
- `children` - Can be a function receiving `{ isActive, isPending }`

```tsx
<NavLink to="/messages">
  {({ isActive, isPending }) => (
    <span>Messages {isPending && <Spinner />}</span>
  )}
</NavLink>
```

### isPending State

The `isPending` prop is `true` when navigating TO this link (while the loader runs):

```tsx
<NavLink
  to="/dashboard"
  className={({ isPending }) => (isPending ? "loading" : "")}
>
  Dashboard
</NavLink>
```

---

## useNavigate Hook

Programmatic navigation:

```tsx
import { useNavigate } from "react-router";

function LogoutButton() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Navigate Options

```tsx
const navigate = useNavigate();

// Basic navigation
navigate("/dashboard");

// Replace history entry
navigate("/login", { replace: true });

// Pass state
navigate("/checkout", { state: { cartId: "abc" } });

// Go back/forward
navigate(-1); // Back
navigate(1); // Forward
```

---

## redirect Function

Redirect from loaders and actions:

```tsx
import { redirect } from "react-router";

const router = createBrowserRouter([
  {
    path: "/dashboard",
    loader: async ({ request }) => {
      const user = await getUser(request);

      if (!user) {
        throw redirect("/login");
      }

      return user;
    },
    Component: Dashboard,
  },
  {
    path: "/projects/new",
    action: async ({ request }) => {
      const project = await createProject(request);
      return redirect(`/projects/${project.id}`);
    },
    Component: NewProject,
  },
]);
```

### Redirect with Status

```tsx
// Temporary redirect (302, default)
throw redirect("/new-location");

// Permanent redirect (301)
throw redirect("/new-location", { status: 301 });
```

---

## Form Navigation

Forms with `method="get"` navigate with search params:

```tsx
import { Form } from "react-router";

function SearchForm() {
  return (
    <Form method="get" action="/search">
      <input type="text" name="q" />
      <button type="submit">Search</button>
    </Form>
  );
}
// Navigates to /search?q=...
```

Forms with `method="post"` submit to actions:

```tsx
function NewProject() {
  return (
    <Form method="post" action="/projects">
      <input type="text" name="title" />
      <button type="submit">Create</button>
    </Form>
  );
}
// Submits to /projects action, then redirects
```

---

## Relative Navigation

Paths are relative to the current route:

```tsx
// If current URL is /products/123

<Link to="reviews">     // → /products/123/reviews
<Link to="../456">      // → /products/456
<Link to="..">          // → /products
```

Use `relative="path"` for path-based relativity instead of route-based:

```tsx
<Link to=".." relative="path">
  Go up one path segment
</Link>
```

---

## Accessing Location State

Read state passed during navigation:

```tsx
import { useLocation } from "react-router";

function Checkout() {
  const location = useLocation();
  const { from } = location.state || {};

  return (
    <div>
      <h1>Checkout</h1>
      {from && <Link to={from}>Go back</Link>}
    </div>
  );
}
```

---

## ScrollRestoration

Add `<ScrollRestoration />` to handle scroll position automatically:

```tsx
import { ScrollRestoration, Outlet } from "react-router";

function Root() {
  return (
    <div>
      <nav>...</nav>
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ...routes
    ],
  },
]);
```

Prevent scroll reset on specific links:

```tsx
<Link to="/products" preventScrollReset>
  Products
</Link>
```

---

## useSearchParams

Access and modify URL search params:

```tsx
import { useSearchParams } from "react-router";

function FilterPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "all";

  // ⚠️ For form submissions, prefer <Form method="get"> instead
  function handleChange(newCategory: string) {
    setSearchParams({ category: newCategory });
  }

  return (
    <select value={category} onChange={(e) => handleChange(e.target.value)}>
      <option value="all">All</option>
      <option value="electronics">Electronics</option>
      <option value="clothing">Clothing</option>
    </select>
  );
}
```

---

## Complete Navigation Example

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useNavigate,
  redirect,
} from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      {
        path: "dashboard",
        loader: async () => {
          const user = await getUser();
          if (!user) throw redirect("/login");
          return user;
        },
        Component: Dashboard,
      },
    ],
  },
]);

function Root() {
  return (
    <div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
          Home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>
          About
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive, isPending }) =>
          isPending ? "pending" : isActive ? "active" : ""
        }>
          Dashboard
        </NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

---

## See Also

- [pending-ui.md](./pending-ui.md) - NavLink pending states
- [actions.md](./actions.md) - Form navigation patterns
- [React Router Navigation Documentation](https://reactrouter.com/start/data/routing)
