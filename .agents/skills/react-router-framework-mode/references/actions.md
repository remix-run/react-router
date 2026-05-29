---
title: Actions and Form Handling
description: Form submission patterns, useFetcher, mutations, and validation
tags: [forms, mutations, useFetcher, Form, action, validation, optimistic-ui]
---

# Actions and Form Handling

Actions handle data mutations (create, update, delete). After an action completes, all loaders on the page automatically revalidate.

## Choosing the Right Pattern

| Use Case                     | Pattern                | Why                                |
| ---------------------------- | ---------------------- | ---------------------------------- |
| Search/filter forms          | `<Form method="get">`  | Auto-updates URL search params     |
| Mutations that navigate      | `<Form method="post">` | Creates, then redirects            |
| Mutations without navigation | `useFetcher`           | Ratings, likes, inline edits       |
| Multiple mutations on page   | `useFetcher`           | Each fetcher has independent state |

**Default to `useFetcher` for mutations** - it provides smoother UX with optimistic updates and no page reload.

## Anti-Patterns to Avoid

```tsx
// ❌ DON'T: Manual form handling for search
function SearchForm() {
  const [searchParams, setSearchParams] = useSearchParams();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchParams({ q: formData.get("q") as string });
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="q" />
      <button type="submit">Search</button>
    </form>
  );
}

// ✅ DO: Use Form with method="get" - handles search params automatically
function SearchForm() {
  return (
    <Form method="get">
      <input name="q" />
      <button type="submit">Search</button>
    </Form>
  );
}
```

```tsx
// ❌ DON'T: Use Form for inline mutations (causes full navigation)
function RatingButton({ itemId }) {
  return (
    <Form method="post" action={`/items/${itemId}/rate`}>
      <button>Rate</button>
    </Form>
  );
}

// ✅ DO: Use useFetcher for inline mutations (no navigation, smoother UX)
function RatingButton({ itemId, currentRating }) {
  const fetcher = useFetcher();

  // Optimistic UI - show expected state immediately
  const optimisticRating = fetcher.formData
    ? Number(fetcher.formData.get("rating"))
    : currentRating;

  return (
    <fetcher.Form method="post" action={`/items/${itemId}/rate`}>
      <input type="hidden" name="rating" value={optimisticRating + 1} />
      <button>⭐ {optimisticRating}</button>
    </fetcher.Form>
  );
}
```

---

## Search Forms with GET

`<Form method="get">` automatically serializes inputs to URL search params:

```tsx
import { Form, useSearchParams } from "react-router";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <div>
      <Form method="get">
        <input type="text" name="q" defaultValue={query} />
        <button type="submit">Search</button>
      </Form>
      {/* Results render here */}
    </div>
  );
}

// Loader receives search params via request.url
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  return { results: await search(query) };
}
```

---

## Server Action

Runs on the server:

```tsx
import { redirect, data } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");

  await db.createProject({ title });

  return redirect("/projects");
}
```

## Client Action

Runs in the browser:

```tsx
export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const formData = await request.formData();

  // Can call server action
  const result = await serverAction();

  // Or handle entirely on client
  await clientApi.update(formData);

  return result;
}
```

---

## Form Component

The `<Form>` component submits to actions and handles navigation:

```tsx
import { Form } from "react-router";

export default function NewProject() {
  return (
    <Form method="post">
      <input type="text" name="title" required />
      <button type="submit">Create</button>
    </Form>
  );
}
```

### Form Props

- `method` - HTTP method: `"get"`, `"post"`, `"put"`, `"delete"`, `"patch"`
- `action` - URL to submit to (defaults to current route)
- `navigate` - Set to `false` to prevent navigation after submission

```tsx
<Form method="post" action="/projects/new">
  {/* ... */}
</Form>
```

## useSubmit

Submit forms programmatically:

```tsx
import { useSubmit } from "react-router";

function AutoSave({ data }) {
  const submit = useSubmit();

  useEffect(() => {
    const timeout = setTimeout(() => {
      submit(data, { method: "post" });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [data, submit]);

  return null;
}
```

## useFetcher (Preferred for Mutations)

**Use `useFetcher` as the default for mutations** - it provides independent state, no page navigation, and enables optimistic UI.

### Basic Usage

```tsx
import { useFetcher } from "react-router";

function LikeButton({ postId }) {
  const fetcher = useFetcher();
  const isLiking = fetcher.state === "submitting";

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <button disabled={isLiking}>{isLiking ? "Liking..." : "Like"}</button>
    </fetcher.Form>
  );
}
```

### Optimistic UI Pattern (Recommended)

Use `fetcher.formData` to show expected results immediately. See [pending-ui.md](./pending-ui.md#optimistic-ui-with-usefetcher-recommended-pattern) for complete patterns.

Quick example:

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

### Typing useFetcher

See [type-safety.md](./type-safety.md#typing-usefetcher) for typing patterns.

### Fetcher Properties

- `fetcher.state` - `"idle"`, `"submitting"`, or `"loading"`
- `fetcher.data` - Data returned from the action
- `fetcher.formData` - FormData being submitted (use for optimistic UI)
- `fetcher.Form` - Form component scoped to this fetcher
- `fetcher.submit()` - Submit programmatically

## Returning Data from Actions

Return data for the UI to use:

```tsx
import { data } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  const errors: Record<string, string> = {};

  if (!email?.toString().includes("@")) {
    errors.email = "Invalid email address";
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  await createUser({ email });
  return redirect("/dashboard");
}
```

Access action data with `fetcher.data`:

```tsx
function SignupForm() {
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors;

  return (
    <fetcher.Form method="post">
      <input type="email" name="email" />
      {errors?.email && <span>{errors.email}</span>}
      <button type="submit">Sign Up</button>
    </fetcher.Form>
  );
}
```

## Form Validation Pattern

```tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const errors: Record<string, string> = {};

  if (!email.includes("@")) {
    errors.email = "Invalid email address";
  }

  if (password.length < 12) {
    errors.password = "Password must be at least 12 characters";
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  // Validation passed
  await createAccount({ email, password });
  return redirect("/dashboard");
}
```

## Multiple Actions per Route

Use a hidden input or button name to distinguish intents:

```tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  switch (intent) {
    case "update":
      return updateProject(formData);
    case "delete":
      return deleteProject(formData);
    default:
      throw new Response("Invalid intent", { status: 400 });
  }
}

// In component
<Form method="post">
  <button name="intent" value="update">
    Save
  </button>
  <button name="intent" value="delete">
    Delete
  </button>
</Form>;
```

---

## See Also

- [pending-ui.md](./pending-ui.md) - Optimistic UI and loading states
- [type-safety.md](./type-safety.md) - Typing useFetcher and actions
- [route-modules.md](./route-modules.md) - All route module exports
