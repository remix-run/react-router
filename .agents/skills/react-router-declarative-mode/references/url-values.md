---
title: URL Values
description: Reading route params, search params, and location from the URL
tags: [useParams, useSearchParams, useLocation, params, query-string]
---

# URL Values

React Router provides hooks to read values from the current URL: route params, search params (query string), and the location object.

## useParams

Read dynamic segments from the route path:

```tsx
// Route: <Route path="users/:userId" element={<User />} />
// URL: /users/123

import { useParams } from "react-router";

function User() {
  const { userId } = useParams();
  // userId = "123"
  return <h1>User {userId}</h1>;
}
```

### Multiple Params

```tsx
// Route: <Route path="teams/:teamId/members/:memberId" element={<Member />} />
// URL: /teams/abc/members/456

function Member() {
  const { teamId, memberId } = useParams();
  // teamId = "abc", memberId = "456"
  return (
    <h1>
      Member {memberId} of Team {teamId}
    </h1>
  );
}
```

### Splat Params

```tsx
// Route: <Route path="files/*" element={<FileViewer />} />
// URL: /files/docs/intro.md

function FileViewer() {
  const { "*": filePath } = useParams();
  // filePath = "docs/intro.md"
  return <div>Viewing: {filePath}</div>;
}
```

### Type Safety

Params are always `string | undefined`. Parse and validate as needed:

```tsx
function User() {
  const { userId } = useParams();

  // ❌ DON'T: Assume params exist or are numbers
  const id = parseInt(userId); // userId could be undefined

  // ✅ DO: Handle undefined and validate
  if (!userId) {
    return <div>User ID required</div>;
  }
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return <div>Invalid user ID</div>;
  }

  return <h1>User {id}</h1>;
}
```

## useSearchParams

Read and update the query string (`?key=value`):

```tsx
// URL: /search?q=react&page=2

import { useSearchParams } from "react-router";

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q"); // "react"
  const page = searchParams.get("page"); // "2"
  const missing = searchParams.get("foo"); // null

  return <div>Searching for: {query}</div>;
}
```

`searchParams` is a [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) object:

### Updating Search Params

```tsx
function SearchForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const isFirstSearch = !searchParams.has("q");

    if (value) {
      setSearchParams(
        { q: value },
        { replace: !isFirstSearch }, // Replace while typing, push on first search
      );
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  return (
    <input
      type="search"
      value={query}
      onChange={handleSearch}
      placeholder="Search..."
    />
  );
}
```

> **Tip**: Use `replace: true` for incremental updates like type-ahead search. This prevents the back button from cycling through every keystroke.

### Navigation Options

`setSearchParams` accepts navigation options as a second argument:

```tsx
function Filters() {
  const [searchParams, setSearchParams] = useSearchParams();

  function applyFilter(category: string) {
    setSearchParams(
      { category },
      {
        replace: true, // Don't add to history (back button skips)
        preventScrollReset: true, // Keep scroll position
      },
    );
  }

  return (
    <button onClick={() => applyFilter("electronics")}>Electronics</button>
  );
}
```

| Option               | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `replace`            | Replace history entry instead of pushing      |
| `preventScrollReset` | Keep current scroll position after navigation |
| `state`              | Pass state to the new location                |

### Preserving Other Params

When updating search params programmatically, preserve existing params:

```tsx
function SortDropdown() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "name";

  function handleSortChange(newSort: string) {
    // ❌ DON'T: Overwrite all params
    setSearchParams({ sort: newSort });

    // ✅ DO: Preserve existing params (like page, filters)
    setSearchParams((prev) => {
      prev.set("sort", String(newSort));
      return prev;
    });
  }

  return (
    <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
      <option value="name">Name</option>
      <option value="date">Date</option>
    </select>
  );
}
```

> **Note**: For pagination and other navigation controls, prefer the [Link-based approach](#link-based-pagination-preferred) below for better accessibility.

### Link-based Pagination (Preferred)

For pagination and similar controls, prefer `<Link>` over buttons with `setSearchParams`:

```tsx
import { Link, useSearchParams } from "react-router";

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const [searchParams] = useSearchParams();

  // Build URL that preserves existing search params
  function getPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination">
      {currentPage > 1 && (
        <Link to={getPageUrl(currentPage - 1)}>Previous</Link>
      )}
      <span>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link to={getPageUrl(currentPage + 1)}>Next</Link>
      )}
    </nav>
  );
}
```

Why prefer Links over buttons:

- **Accessibility**: Real anchor elements work with screen readers and keyboard navigation
- **Right-click**: Users can open in new tab or copy link
- **Middle-click**: Opens in new tab automatically
- **Browser features**: Back/forward, bookmarking work naturally
- **SEO**: Search engines can discover paginated content

```tsx
// ❌ DON'T: Use buttons for navigation that changes URL
<button onClick={() => setSearchParams({ page: "2" })}>
  Page 2
</button>

// ✅ DO: Use Links for URL-changing navigation
<Link to="?page=2">Page 2</Link>
```

### Multiple Values

```tsx
// URL: /products?tag=react&tag=typescript

function Products() {
  const [searchParams] = useSearchParams();

  // Get all values for a key
  const tags = searchParams.getAll("tag");
  // tags = ["react", "typescript"]

  return <div>Tags: {tags.join(", ")}</div>;
}
```

### Default Values

```tsx
function ProductList() {
  const [searchParams] = useSearchParams({
    page: "1",
    sort: "name",
  });

  const page = searchParams.get("page"); // "1" if not in URL
  const sort = searchParams.get("sort"); // "name" if not in URL

  return (
    <div>
      Page {page}, sorted by {sort}
    </div>
  );
}
```

## useLocation

Access the full location object:

```tsx
import { useLocation } from "react-router";

function CurrentPath() {
  const location = useLocation();

  return <pre>{JSON.stringify(location, null, 2)}</pre>;
}
```

### Location Object Properties

| Property   | Type   | Description                      | Example                   |
| ---------- | ------ | -------------------------------- | ------------------------- |
| `pathname` | string | The path portion of the URL      | `"/users/123"`            |
| `search`   | string | The query string (including `?`) | `"?q=react&page=2"`       |
| `hash`     | string | The hash portion (including `#`) | `"#section-1"`            |
| `state`    | any    | State passed during navigation   | `{ from: "/home" }`       |
| `key`      | string | Unique key for this location     | `"default"` or random key |

```tsx
// URL: /search?q=react#results
// Navigated with state: { from: "/home" }

function SearchPage() {
  const location = useLocation();

  console.log(location.pathname); // "/search"
  console.log(location.search); // "?q=react"
  console.log(location.hash); // "#results"
  console.log(location.state); // { from: "/home" }
  console.log(location.key); // "abc123" (unique key)
}
```

### Reading Navigation State

State passed via `<Link state={...}>` or `navigate(path, { state })`:

```tsx
// Sender
<Link to="/checkout" state={{ cartId: "abc", from: "/cart" }}>
  Checkout
</Link>;

// Receiver
function Checkout() {
  const location = useLocation();
  const { cartId, from } = location.state || {};

  return (
    <div>
      <h1>Checkout</h1>
      {from && <Link to={from}>← Back</Link>}
      <p>Cart: {cartId}</p>
    </div>
  );
}
```

### Watching Location Changes

```tsx
import { useEffect } from "react";
import { useLocation } from "react-router";

function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route change
    trackPageView(location.pathname);
  }, [location]);

  return null;
}
```

## Combining Hooks

```tsx
// URL: /products/shoes?color=red&size=10#reviews

function ProductPage() {
  const { category } = useParams(); // "shoes"
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const color = searchParams.get("color"); // "red"
  const size = searchParams.get("size"); // "10"
  const hash = location.hash; // "#reviews"

  return (
    <div>
      <h1>{category}</h1>
      <p>
        Color: {color}, Size: {size}
      </p>
      {hash === "#reviews" && <Reviews />}
    </div>
  );
}
```

## See Also

- [routing.md](./routing.md) - Route configuration and dynamic segments
- [navigation.md](./navigation.md) - Passing state with Link and navigate
- [React Router Hooks Documentation](https://reactrouter.com/docs)
