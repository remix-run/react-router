---
title: Actions and Form Handling
description: Form submission, mutations with actions, useFetcher, and validation
tags: [action, Form, useFetcher, useSubmit, useActionData, mutations, validation]
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

## Defining Actions on Routes

Actions are defined on route objects and handle form submissions:

```tsx
import { redirect } from "react-router";

const router = createBrowserRouter([
  {
    path: "/projects/new",
    action: async ({ request }) => {
      const formData = await request.formData();
      const title = formData.get("title");

      const project = await db.createProject({ title });

      return redirect(`/projects/${project.id}`);
    },
    Component: NewProject,
  },
]);
```

### Action Arguments

- `request` - The Fetch Request object with form data
- `params` - URL parameters from dynamic segments

```tsx
{
  path: "/projects/:projectId",
  action: async ({ request, params }) => {
    const formData = await request.formData();
    await db.updateProject(params.projectId, {
      title: formData.get("title"),
    });
    return { success: true };
  },
  Component: EditProject,
}
```

---

## Search Forms with GET

`<Form method="get">` automatically serializes inputs to URL search params:

```tsx
import { Form, useSearchParams, useLoaderData } from "react-router";

const router = createBrowserRouter([
  {
    path: "/search",
    loader: async ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get("q") ?? "";
      return { results: await search(query) };
    },
    Component: SearchPage,
  },
]);

function SearchPage() {
  const [searchParams] = useSearchParams();
  const { results } = useLoaderData();
  const query = searchParams.get("q") ?? "";

  return (
    <div>
      <Form method="get">
        <input type="text" name="q" defaultValue={query} />
        <button type="submit">Search</button>
      </Form>
      <SearchResults results={results} />
    </div>
  );
}
```

---

## Form Component

The `<Form>` component submits to actions and handles navigation:

```tsx
import { Form } from "react-router";

function NewProject() {
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

---

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

---

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

### Fetcher Properties

- `fetcher.state` - `"idle"`, `"submitting"`, or `"loading"`
- `fetcher.data` - Data returned from the action
- `fetcher.formData` - FormData being submitted (use for optimistic UI)
- `fetcher.Form` - Form component scoped to this fetcher
- `fetcher.submit()` - Submit programmatically

---

## useActionData

Access data returned from the current route's action:

```tsx
import { Form, useActionData } from "react-router";

const router = createBrowserRouter([
  {
    path: "/signup",
    action: async ({ request }) => {
      const formData = await request.formData();
      const email = formData.get("email");

      const errors = {};
      if (!email?.toString().includes("@")) {
        errors.email = "Invalid email address";
      }

      if (Object.keys(errors).length > 0) {
        return { errors };
      }

      await createUser({ email });
      return redirect("/dashboard");
    },
    Component: Signup,
  },
]);

function Signup() {
  const actionData = useActionData();

  return (
    <Form method="post">
      <input type="email" name="email" />
      {actionData?.errors?.email && <span>{actionData.errors.email}</span>}
      <button type="submit">Sign Up</button>
    </Form>
  );
}
```

---

## Form Validation Pattern

```tsx
{
  path: "/register",
  action: async ({ request }) => {
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
      return { errors };
    }

    // Validation passed
    await createAccount({ email, password });
    return redirect("/dashboard");
  },
  Component: Register,
}
```

---

## Multiple Actions per Route

Use a hidden input or button name to distinguish intents:

```tsx
{
  path: "/projects/:projectId",
  action: async ({ request, params }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");

    switch (intent) {
      case "update":
        return updateProject(params.projectId, formData);
      case "delete":
        await deleteProject(params.projectId);
        return redirect("/projects");
      default:
        throw new Response("Invalid intent", { status: 400 });
    }
  },
  Component: Project,
}

// In component
function Project() {
  return (
    <Form method="post">
      <input name="title" />
      <button name="intent" value="update">Save</button>
      <button name="intent" value="delete">Delete</button>
    </Form>
  );
}
```

---

## Fetcher with Action Data

Access data returned from fetcher actions:

```tsx
function SignupForm() {
  const fetcher = useFetcher();
  const errors = fetcher.data?.errors;

  return (
    <fetcher.Form method="post" action="/signup">
      <input type="email" name="email" />
      {errors?.email && <span>{errors.email}</span>}
      <button type="submit">Sign Up</button>
    </fetcher.Form>
  );
}
```

---

## See Also

- [pending-ui.md](./pending-ui.md) - Optimistic UI and loading states
- [data-loading.md](./data-loading.md) - Loading data with loaders
- [React Router Actions Documentation](https://reactrouter.com/start/data/data-mutations)
