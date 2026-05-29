---
name: react-router-framework-mode
description: Build full-stack React applications using React Router's framework mode. Use when configuring routes, working with loaders and actions, handling forms, handling navigation, pending/optimistic UI, error boundaries, or working with react-router.config.ts or other react router conventions.
license: MIT
---

# React Router Framework Mode

Framework mode is React Router's full-stack development experience with file-based routing, server-side, client-side, and static rendering strategies, data loading and mutations, and type-safe route module API.

## When to Apply

- Configuring new routes (`app/routes.ts`)
- Loading data with `loader` or `clientLoader`
- Handling mutations with `action` or `clientAction`
- Navigating with `<Link>`, `<NavLink>`, `<Form>`, `redirect`, and `useNavigate`
- Implementing pending/loading UI states
- Configuring SSR, SPA mode, or pre-rendering (`react-router.config.ts`)
- Implementing authentication

## References

Load the relevant reference for detailed guidance on the specific API/concept:

| Reference                            | Use When                                              |
| ------------------------------------ | ----------------------------------------------------- |
| `references/routing.md`              | Configuring routes, nested routes, dynamic segments   |
| `references/route-modules.md`        | Understanding all route module exports                |
| `references/special-files.md`        | Customizing root.tsx, adding global nav/footer, fonts |
| `references/data-loading.md`         | Loading data with loaders, streaming, caching         |
| `references/actions.md`              | Handling forms, mutations, validation                 |
| `references/navigation.md`           | Links, programmatic navigation, redirects             |
| `references/pending-ui.md`           | Loading states, optimistic UI                         |
| `references/error-handling.md`       | Error boundaries, error reporting                     |
| `references/rendering-strategies.md` | SSR vs SPA vs pre-rendering configuration             |
| `references/middleware.md`           | Adding middleware (requires v7.9.0+)                  |
| `references/sessions.md`             | Cookie sessions, authentication, protected routes     |
| `references/type-safety.md`          | Auto-generated route types, type imports, type safety |

## Version Compatibility

Some features require specific React Router versions. **Always verify before implementing:**

```bash
npm list react-router
```

| Feature                 | Minimum Version | Notes                         |
| ----------------------- | --------------- | ----------------------------- |
| Middleware              | 7.9.0+          | Requires `v8_middleware` flag |
| Core framework features | 7.0.0+          | loaders, actions, Form, etc.  |

## Critical Patterns

These are the most important patterns to follow. Load the relevant reference for full details.

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

### Layouts

**Global UI belongs in `root.tsx`** - don't create separate layout files for nav/footer:

```tsx
// app/root.tsx - add navigation, footer, providers here
export default function App() {
  return (
    <div>
      <nav>...</nav>
      <Outlet />
      <footer>...</footer>
    </div>
  );
}
```

**Use nested routes** for section-specific layouts. See `references/routing.md`.

### Route Module Exports

**`meta` uses `loaderData`**, not deprecated `data`:

```tsx
// ✅ Correct
export function meta({ loaderData }: Route.MetaArgs) { ... }

// ❌ Wrong - `data` is deprecated
export function meta({ data }: Route.MetaArgs) { ... }
```

See `references/route-modules.md` for all exports.

## Further Documentation

If anything related to React Router is not covered in these references, you can search the official documentation:

https://reactrouter.com/docs
