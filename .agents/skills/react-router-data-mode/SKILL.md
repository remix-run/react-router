---
name: react-router-data-mode
description: Build React applications using React Router's data mode with createBrowserRouter and RouterProvider. Use when working with route objects, loaders, actions, Form, useFetcher, or pending/optimistic UI without the Vite plugin.
license: MIT
---

# React Router Data Mode

Data mode uses `createBrowserRouter` and `RouterProvider` to enable data loading, actions, and pending UI without the framework's Vite plugin. This is ideal for existing React applications that want to add data loading and mutation capabilities.

## When to Apply

- Using `createBrowserRouter` with route objects
- Loading data with `loader` property on routes
- Handling mutations with `action` property
- Navigating with `<Link>`, `<NavLink>`, `<Form>`, `redirect`, and `useNavigate`
- Implementing pending/loading UI states with `useNavigation`
- Using `useFetcher` for mutations without navigation

## References

Load the relevant reference for detailed guidance on the specific API/concept:

| Reference                    | Use When                                  |
| ---------------------------- | ----------------------------------------- |
| `references/routing.md`      | Configuring routes, nested routes, layout |
| `references/route-object.md` | Understanding route object properties     |
| `references/data-loading.md` | Loading data with loaders                 |
| `references/actions.md`      | Handling forms, mutations, validation     |
| `references/navigation.md`   | Links, programmatic navigation, redirects |
| `references/pending-ui.md`   | Loading states, optimistic UI             |
| `references/ssr.md`          | Server-side rendering with data mode      |

## Critical Patterns

These are the most important patterns to follow. Load the relevant reference for full details.

### Basic Router Setup

```tsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
    ],
  },
]);

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
```

### Forms & Mutations

**Search forms** - use `<Form method="get">`, NOT `onSubmit` with `setSearchParams`:

```tsx
// ✅ Correct
<Form method="get">
  <input name="q" />
</Form>

// ❌ Wrong - don't manually handle search params
<form onSubmit={(e) => { e.preventDefault(); setSearchParams(...) }}>
```

**Inline mutations** - use `useFetcher`, NOT `<Form>` (which causes page navigation):

```tsx
const fetcher = useFetcher();
const optimistic = fetcher.formData?.get("favorite") === "true" ?? isFavorite;

<fetcher.Form method="post" action={`/favorites/${id}`}>
  <button>{optimistic ? "★" : "☆"}</button>
</fetcher.Form>;
```

See `references/actions.md` for complete patterns.

### Optimistic UI Pattern

Use `fetcher.formData` to show expected results immediately:

```tsx
function FavoriteButton({ itemId, isFavorite }) {
  const fetcher = useFetcher();

  // Optimistic: use pending form data, fallback to server state
  const optimistic = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : isFavorite;

  return (
    <fetcher.Form method="post" action={`/items/${itemId}/favorite`}>
      <input type="hidden" name="favorite" value={String(!optimistic)} />
      <button>{optimistic ? "★" : "☆"}</button>
    </fetcher.Form>
  );
}
```

See `references/pending-ui.md` for complete patterns.

## Further Documentation

If anything related to React Router is not covered in these references, you can search the official documentation:

https://reactrouter.com/docs
