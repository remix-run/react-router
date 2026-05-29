---
title: Navigation
description: Link, NavLink, and useNavigate for client-side navigation
tags: [navigation, Link, NavLink, useNavigate]
---

# Navigation

React Router provides several ways to navigate between routes in declarative mode.

## Link Component

Basic navigation between routes:

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

| Prop      | Purpose                             | Example                    |
| --------- | ----------------------------------- | -------------------------- |
| `to`      | Destination path (string or object) | `to="/dashboard"`          |
| `replace` | Replace current history entry       | `replace`                  |
| `state`   | Pass state to the destination       | `state={{ from: "home" }}` |

```tsx
<Link to="/dashboard" replace state={{ from: "home" }}>
  Dashboard
</Link>
```

## NavLink Component

Link with active state awareness for styling navigation:

```tsx
import { NavLink } from "react-router";

function Nav() {
  return (
    <nav>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/products">Products</NavLink>
    </nav>
  );
}
```

### Automatic Active Class

NavLink automatically adds an `.active` class when active, so you can style it with CSS:

```css
a.active {
  color: blue;
  font-weight: bold;
}
```

For custom class names, use the `className` function:

```tsx
<NavLink
  to="/products"
  className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}
>
  Products
</NavLink>
```

### NavLink Props

| Prop        | Purpose                                | Example                                |
| ----------- | -------------------------------------- | -------------------------------------- |
| `end`       | Only match exact path (not prefixes)   | `<NavLink to="/" end>`                 |
| `className` | String or function with `{ isActive }` | `className={({ isActive }) => ...}`    |
| `style`     | Object or function with `{ isActive }` | `style={({ isActive }) => ...}`        |
| `children`  | Can be a function with `{ isActive }`  | `{({ isActive }) => <span>...</span>}` |

### Styling Active Links

```tsx
// With className function
<NavLink
  to="/dashboard"
  className={({ isActive }) =>
    isActive ? "nav-link active" : "nav-link"
  }
>
  Dashboard
</NavLink>

// With style function
<NavLink
  to="/dashboard"
  style={({ isActive }) => ({
    fontWeight: isActive ? "bold" : "normal",
    color: isActive ? "blue" : "gray",
  })}
>
  Dashboard
</NavLink>

// With children function
<NavLink to="/messages">
  {({ isActive }) => (
    <span className={isActive ? "active" : ""}>
      Messages {isActive && "✓"}
    </span>
  )}
</NavLink>
```

### The `end` Prop

Without `end`, NavLink matches if the current URL starts with the `to` path:

```tsx
// ❌ Without end: both are active at /dashboard/settings
<NavLink to="/">Home</NavLink>           // active at / AND /dashboard
<NavLink to="/dashboard">Dashboard</NavLink>  // active at /dashboard AND /dashboard/settings

// ✅ With end: exact matching
<NavLink to="/" end>Home</NavLink>       // only active at /
<NavLink to="/dashboard" end>Dashboard</NavLink>  // only active at /dashboard
```

## useNavigate Hook

Programmatic navigation for situations where the user is _not_ directly clicking a link:

```tsx
import { useNavigate } from "react-router";

function LoginForm() {
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login();
    navigate("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit">Login</button>
    </form>
  );
}
```

> **Important**: Prefer `Link` or `NavLink` for user-initiated navigation. They provide better UX including keyboard events, accessibility, right-click menus, and "open in new tab". Reserve `useNavigate` for:
>
> - After form submissions complete
> - Logging out after inactivity
> - Redirects based on data/conditions
> - Timed UIs (quizzes, etc.)

### Navigate Options

```tsx
const navigate = useNavigate();

// Basic navigation
navigate("/dashboard");

// Replace history entry (back button skips this page)
navigate("/login", { replace: true });

// Pass state to destination
navigate("/checkout", { state: { cartId: "abc" } });

// Go back/forward in history
navigate(-1); // Go back one page
navigate(-2); // Go back two pages
navigate(1); // Go forward one page
```

### When to Use Each Approach

| Approach      | Use Case                                   |
| ------------- | ------------------------------------------ |
| `<Link>`      | Standard navigation, SEO-friendly links    |
| `<NavLink>`   | Navigation menus with active state styling |
| `useNavigate` | After async operations, in event handlers  |

## Relative Navigation

Paths without a leading `/` are relative to the current route:

```tsx
// Current URL: /products/123

<Link to="reviews">         // → /products/123/reviews
<Link to="../456">          // → /products/456
<Link to="..">              // → /products
```

### Relative Path vs Route

By default, `..` is relative to the route hierarchy. Use `relative="path"` for URL path relativity:

```tsx
// Route: /products/:id, Current URL: /products/123

<Link to="..">                    // → / (parent route)
<Link to=".." relative="path">    // → /products (parent path segment)
```

## Passing State

Pass data to the destination without putting it in the URL:

```tsx
// Sending state
<Link to="/checkout" state={{ cartId: "abc123", from: "/cart" }}>
  Checkout
</Link>;

// Or with useNavigate
navigate("/checkout", { state: { cartId: "abc123" } });
```

Reading state at the destination - see [url-values.md](./url-values.md#uselocation).

## Anti-Patterns

```tsx
// ❌ DON'T: Use anchor tags for internal navigation
<a href="/about">About</a>  // causes full page reload

// ✅ DO: Use Link for client-side navigation
<Link to="/about">About</Link>
```

```tsx
// ❌ DON'T: Use window.location for navigation
function handleClick() {
  window.location.href = "/dashboard"; // full page reload
}

// ✅ DO: Use useNavigate for programmatic navigation
function handleClick() {
  navigate("/dashboard"); // client-side navigation
}
```

## See Also

- [routing.md](./routing.md) - Route configuration
- [url-values.md](./url-values.md) - Reading location state
- [React Router Navigation Documentation](https://reactrouter.com/docs)
