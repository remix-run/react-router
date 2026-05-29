---
name: react-router-declarative-mode
description: Build React applications using React Router's declarative mode with BrowserRouter. Use when configuring routes with JSX, navigating with Link/NavLink, or reading URL params and search params without data loaders or actions.
license: MIT
---

# React Router Declarative Mode

Declarative mode is React Router's simplest mode using `<BrowserRouter>`, `<Routes>`, and `<Route>` for basic client-side routing without data loading features like loaders or actions.

## When to Apply

- Using `<BrowserRouter>` for routing
- Configuring routes with `<Routes>` and `<Route>`
- Navigating with `<Link>`, `<NavLink>`, or `useNavigate`
- Reading URL params with `useParams`
- Working with search params using `useSearchParams`
- Accessing location with `useLocation`

## References

Load the relevant reference for detailed guidance on the specific API/concept:

| Reference                  | Use When                                          |
| -------------------------- | ------------------------------------------------- |
| `references/routing.md`    | Configuring routes, nested routes, dynamic params |
| `references/navigation.md` | Links, NavLink active states, programmatic nav    |
| `references/url-values.md` | Reading params, search params, location           |

## Critical Patterns

These are the most important patterns to follow. Load the relevant reference for full details.

### Basic Route Setup

Configure routes with JSX using `<Routes>` and `<Route>`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="users/:userId" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### NavLink Active States

Use `NavLink` for navigation with active styling:

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
        to="/dashboard"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Dashboard
      </NavLink>
    </nav>
  );
}
```

### Reading URL Params

Use `useParams` to read dynamic route segments:

```tsx
import { useParams } from "react-router";

function User() {
  const { userId } = useParams();
  return <h1>User {userId}</h1>;
}
```

### Working with Search Params

Use `useSearchParams` for query string values:

```tsx
import { useSearchParams } from "react-router";

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q");

  return (
    <div>
      <input
        value={query || ""}
        onChange={(e) => setSearchParams({ q: e.target.value })}
      />
      <p>Results for: {query}</p>
    </div>
  );
}
```

## Further Documentation

If anything related to React Router is not covered in these references, you can search the official documentation:

https://reactrouter.com/docs
