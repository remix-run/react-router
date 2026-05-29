---
title: Navigation
description: Link, NavLink, useNavigate, redirect, and programmatic navigation
tags: [navigation, Link, NavLink, useNavigate, redirect, prefetch]
---

# Navigation

React Router provides several ways to navigate between routes.

## Link Component

Basic navigation:

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
- `prefetch` - `"none"`, `"intent"`, `"render"`, `"viewport"`

```tsx
<Link to="/dashboard" replace state={{ from: "home" }} prefetch="intent">
  Dashboard
</Link>
```

## NavLink Component

Link with active/pending state awareness:

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

## redirect Function

Redirect from loaders and actions:

```tsx
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}

export async function action({ request }: Route.ActionArgs) {
  await createProject(request);
  return redirect("/projects");
}
```

### Redirect with Status

```tsx
// Temporary redirect (302, default)
throw redirect("/new-location");

// Permanent redirect (301)
throw redirect("/new-location", { status: 301 });
```

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
```

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

## Scroll Restoration

`<ScrollRestoration />` (in root) handles scroll position automatically.

Prevent scroll reset on specific links:

```tsx
<Link to="/products" preventScrollReset>
  Products
</Link>
```
