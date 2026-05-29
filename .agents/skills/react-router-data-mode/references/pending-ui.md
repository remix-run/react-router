---
title: Pending UI and Optimistic Updates
description: Loading states, optimistic UI with useNavigation and useFetcher
tags: [pending-ui, optimistic-ui, useNavigation, useFetcher, loading, spinner]
---

# Pending UI and Optimistic Updates

**Key principle:** Show expected results immediately using `fetcher.formData`, then let React Router sync with the server.

## Quick Reference

| Pattern                  | Hook                      | Use Case                   |
| ------------------------ | ------------------------- | -------------------------- |
| Optimistic mutations     | `useFetcher` + `formData` | Likes, ratings, toggles    |
| Global loading indicator | `useNavigation`           | Page-level spinner         |
| Link pending state       | `NavLink`                 | Nav item loading indicator |

For mutation patterns (when to use Form vs useFetcher), see [actions.md](./actions.md#choosing-the-right-pattern).

---

## useNavigation

Track global navigation state:

```tsx
import { useNavigation, Outlet } from "react-router";

function Root() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <div className={isNavigating ? "loading" : ""}>
      {isNavigating && <GlobalSpinner />}
      <Outlet />
    </div>
  );
}
```

### Navigation States

- `navigation.state` - `"idle"`, `"loading"`, or `"submitting"`
- `navigation.location` - The location being navigated to (if any)
- `navigation.formData` - Form data being submitted (if any)
- `navigation.formMethod` - HTTP method of the submission

```tsx
const navigation = useNavigation();

// Check if navigating
const isNavigating = navigation.state !== "idle";

// Check if submitting a form
const isSubmitting = navigation.state === "submitting";

// Check if loading after submission
const isLoading = navigation.state === "loading";
```

---

## NavLink Pending State

Show pending state on the specific link being clicked:

```tsx
import { NavLink } from "react-router";

function Nav() {
  return (
    <NavLink to="/dashboard">
      {({ isPending }) => <span>Dashboard {isPending && <Spinner />}</span>}
    </NavLink>
  );
}
```

Or use className:

```tsx
<NavLink
  to="/dashboard"
  className={({ isPending }) => (isPending ? "pending" : "")}
>
  Dashboard
</NavLink>
```

---

## useFetcher for Local State

Each fetcher tracks its own state independently:

```tsx
import { useFetcher } from "react-router";

function LikeButton({ postId, liked }) {
  const fetcher = useFetcher();

  // Show pending state while submitting
  const isPending = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <button disabled={isPending}>
        {isPending ? "..." : liked ? "Unlike" : "Like"}
      </button>
    </fetcher.Form>
  );
}
```

### Fetcher States

- `fetcher.state` - `"idle"`, `"submitting"`, or `"loading"`
- `fetcher.data` - Data returned from the action/loader
- `fetcher.formData` - Form data being submitted

---

## Optimistic UI with useFetcher (Recommended Pattern)

**This is the standard pattern for mutations.** Show the expected result immediately using `fetcher.formData`:

```tsx
import { useFetcher } from "react-router";

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

### Complete Optimistic UI Example

```tsx
import { useFetcher } from "react-router";

function RatingStars({ itemId, currentRating }) {
  const fetcher = useFetcher();

  // 1. Check if we're submitting - use the pending value
  // 2. Otherwise use the server value
  const displayRating = fetcher.formData
    ? Number(fetcher.formData.get("rating"))
    : currentRating;

  const isSubmitting = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action={`/items/${itemId}/rate`}>
      <div style={{ opacity: isSubmitting ? 0.5 : 1 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="submit" name="rating" value={star}>
            {star <= displayRating ? "★" : "☆"}
          </button>
        ))}
      </div>
    </fetcher.Form>
  );
}
```

### Why fetcher.formData?

- **Instant feedback** - UI updates immediately on click
- **No loading spinners needed** - the optimistic state IS the loading state
- **Automatic rollback** - if the action fails, loaders revalidate and reset to server state

---

## Optimistic UI with useNavigation

For form submissions that navigate (using `<Form>` instead of `useFetcher`):

```tsx
import { Form, useNavigation } from "react-router";

function NewProjectForm() {
  const navigation = useNavigation();

  // Get optimistic value from submission
  const optimisticTitle = navigation.formData?.get("title");
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input type="text" name="title" />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </button>

      {optimisticTitle && <p>Creating "{optimisticTitle}"...</p>}
    </Form>
  );
}
```

---

## Disabling During Submission

Prevent double submissions:

```tsx
function ContactForm() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input type="text" name="message" disabled={isSubmitting} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </Form>
  );
}
```

With useFetcher:

```tsx
function CommentForm() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  return (
    <fetcher.Form method="post">
      <textarea name="comment" disabled={isSubmitting} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Posting..." : "Post Comment"}
      </button>
    </fetcher.Form>
  );
}
```

---

## Skeleton Loading Patterns

Show skeletons while data loads during navigation:

```tsx
import { useNavigation, Outlet } from "react-router";

function Root() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div>
      <nav>...</nav>
      <main>{isLoading ? <PageSkeleton /> : <Outlet />}</main>
    </div>
  );
}
```

### Route-specific Skeletons

```tsx
function Root() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const nextPath = navigation.location?.pathname;

  return (
    <div>
      <nav>...</nav>
      <main>
        {isLoading && nextPath?.startsWith("/dashboard") ? (
          <DashboardSkeleton />
        ) : isLoading ? (
          <GenericSkeleton />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
```

---

## Busy Indicators with CSS

```tsx
function Root() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <div style={{ opacity: isNavigating ? 0.5 : 1 }}>
      <Outlet />
    </div>
  );
}
```

---

## Progress Indicators

Show progress during slow navigations:

```tsx
import { useNavigation } from "react-router";

function GlobalProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  if (!isNavigating) return null;

  return <ProgressBar />;
}

function Root() {
  return (
    <div>
      <GlobalProgress />
      <nav>...</nav>
      <Outlet />
    </div>
  );
}
```

---

## Complete Example

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  NavLink,
  Outlet,
  useNavigation,
  useFetcher,
} from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      {
        path: "items/:itemId",
        loader: async ({ params }) => fetchItem(params.itemId),
        action: async ({ request, params }) => {
          const formData = await request.formData();
          return toggleFavorite(
            params.itemId,
            formData.get("favorite") === "true",
          );
        },
        Component: Item,
      },
    ],
  },
]);

function Root() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <div style={{ opacity: isNavigating ? 0.5 : 1 }}>
      <nav>
        <NavLink
          to="/"
          className={({ isPending }) => (isPending ? "pending" : "")}
        >
          Home
        </NavLink>
      </nav>
      {isNavigating && <GlobalSpinner />}
      <Outlet />
    </div>
  );
}

function Item() {
  const { item } = useLoaderData();
  const fetcher = useFetcher();

  // Optimistic UI
  const isFavorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : item.isFavorite;

  return (
    <div>
      <h1>{item.name}</h1>
      <fetcher.Form method="post">
        <input type="hidden" name="favorite" value={String(!isFavorite)} />
        <button>{isFavorite ? "★ Favorited" : "☆ Add to Favorites"}</button>
      </fetcher.Form>
    </div>
  );
}
```

---

## See Also

- [actions.md](./actions.md) - Form handling and useFetcher patterns
- [navigation.md](./navigation.md) - NavLink and navigation
- [React Router Pending UI Documentation](https://reactrouter.com/start/data/pending-ui)
