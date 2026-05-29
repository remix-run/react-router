---
title: Pending UI and Optimistic Updates
description: Loading states, optimistic UI, useNavigation, and fetcher states
tags: [pending-ui, optimistic-ui, loading, useNavigation, useFetcher, spinner]
---

# Pending UI and Optimistic Updates

**Key principle:** Show expected results immediately using `fetcher.formData`, then let React Router sync with the server.

## Quick Reference

| Pattern                  | Hook                      | Use Case                   |
| ------------------------ | ------------------------- | -------------------------- |
| Optimistic mutations     | `useFetcher` + `formData` | Likes, ratings, toggles    |
| Global loading indicator | `useNavigation`           | Page-level spinner         |
| Link pending state       | `NavLink`                 | Nav item loading indicator |
| Deferred data            | `Await` + `Suspense`      | Stream slow data           |

For mutation patterns (when to use Form vs useFetcher), see [actions.md](./actions.md#choosing-the-right-pattern).

---

## useNavigation

Track global navigation state:

```tsx
import { useNavigation } from "react-router";

export default function Root() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <html>
      <body className={isNavigating ? "loading" : ""}>
        {isNavigating && <GlobalSpinner />}
        <Outlet />
      </body>
    </html>
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

## Optimistic UI with useFetcher (Recommended Pattern)

**This is the standard pattern for mutations.** Show the expected result immediately using `fetcher.formData`:

```tsx
import { useFetcher } from "react-router";

function LikeButton({ postId, initialLiked }) {
  const fetcher = useFetcher();

  // Optimistic: check pending form data first, fallback to server state
  const liked = fetcher.formData
    ? fetcher.formData.get("liked") === "true"
    : initialLiked;

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <input type="hidden" name="liked" value={String(!liked)} />
      <button>{liked ? "❤️" : "🤍"}</button>
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

## Optimistic UI with useNavigation

For form submissions that navigate:

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

## Skeleton Loading

Show skeletons while data loads:

```tsx
import { Suspense } from "react";
import { Await } from "react-router";

export async function loader() {
  return {
    fastData: await getFastData(),
    slowData: getSlowData(), // Don't await
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>{loaderData.fastData.title}</h1>

      <Suspense fallback={<CommentsSkeleton />}>
        <Await resolve={loaderData.slowData}>
          {(data) => <Comments data={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

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

## Busy Indicators with CSS

Use CSS for simple loading indicators:

```css
.loading {
  opacity: 0.5;
  pointer-events: none;
}
```

```tsx
<body className={isNavigating ? "loading" : ""}>
```

---

## See Also

- [actions.md](./actions.md) - Form handling and useFetcher patterns
- [special-files.md](./special-files.md#customizing-roottsx-complete-example) - Global loading indicators in root.tsx
