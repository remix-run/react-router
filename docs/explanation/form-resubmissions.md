---
title: Form Resubmissions and Revalidation
---

# Form Resubmissions and Revalidation

[MODES: framework, data]

<br/>
<br/>

React Router builds form mutations on top of the browser's request model. A submission sends data to an `action`, and after a successful mutation React Router revalidates route data so the UI can reflect the latest server state.

This means most applications do not need to manually update every copy of mutated data in client state. The normal flow is:

```text
submit form → run action → revalidate loaders → render fresh data
```

## Successful Submissions Revalidate Data

Consider a route that loads a list of projects and also creates new projects:

```tsx
export async function loader() {
  return { projects: await getProjects() };
}

export async function action({ request }) {
  let formData = await request.formData();
  await createProject({ name: String(formData.get("name")) });
  return { ok: true };
}
```

```tsx
import { Form } from "react-router";

export default function Projects({ loaderData }) {
  return (
    <>
      <Form method="post">
        <input name="name" />
        <button type="submit">Create project</button>
      </Form>

      <ul>
        {loaderData.projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </>
  );
}
```

After the `action` succeeds, React Router revalidates the relevant loaders. The component then receives fresh loader data that includes the new project.

This keeps the server as the source of truth and avoids maintaining a separate client-side cache for the same route data.

## Validation Responses Do Not Revalidate by Default

Not every submission is a successful mutation. An `action` can return validation errors without changing server data:

```tsx
import { data } from "react-router";

export async function action({ request }) {
  let formData = await request.formData();
  let name = String(formData.get("name"));

  if (name.length < 3) {
    return data(
      { errors: { name: "Name must be at least 3 characters" } },
      { status: 400 },
    );
  }

  await createProject({ name });
  return { ok: true };
}
```

By default, action responses with a `4xx` or `5xx` status do not trigger loader revalidation. This is useful for validation errors because the action did not successfully mutate data, so the existing loader data does not need to be fetched again.

See [Form Validation][form-validation] for a complete validation example.

## Pending UI During a Submission

For navigation submissions with [`<Form>`][form], [`useNavigation`][use-navigation] exposes the current submission state:

```tsx
import { Form, useNavigation } from "react-router";

export function ProjectForm() {
  let navigation = useNavigation();
  let isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input name="name" />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create project"}
      </button>
    </Form>
  );
}
```

Disabling a submit button can be useful when sending the same mutation twice would be undesirable. However, client-side UI should not be your only protection against duplicate writes. Requests can be retried, users can submit from multiple tabs, and interrupted requests may still reach the server. Mutations that require uniqueness or idempotency should enforce those rules on the server.

## Repeated Navigation Submissions

A normal `<Form>` submission is a navigation. When another navigation submission starts before the previous one finishes, React Router follows browser-style interruption behavior: the newer navigation takes priority and stale client-side work from the earlier navigation is canceled.

Cancellation in the browser does not guarantee that the server stops processing the earlier request. Once a request reaches the server, it may still complete even if the browser no longer waits for its response. Server-side mutation logic should therefore remain correct when requests overlap or arrive more than once.

After the active mutation completes, React Router revalidates loader data and commits the latest relevant result to the UI.

For more detail about interrupted requests and stale revalidation results, see [Network Concurrency Management][concurrency].

## Concurrent Fetcher Submissions

[`useFetcher`][use-fetcher] is different from navigation forms because multiple fetchers can submit independently without changing the current URL.

```tsx
import { useFetcher } from "react-router";

export function FavoriteButton({ projectId, favorite }) {
  let fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/projects/favorite">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="favorite" value={String(!favorite)} />
      <button disabled={fetcher.state !== "idle"}>
        {favorite ? "Unfavorite" : "Favorite"}
      </button>
    </fetcher.Form>
  );
}
```

Several fetchers can be in flight at the same time. As actions complete, React Router coordinates their revalidations and avoids committing stale loader data from an older revalidation after newer data has already been accepted.

This is especially useful for interfaces with independent controls such as favorite buttons, inline edits, or list-item actions.

## Redirect After a Mutation

When a successful action should take the user somewhere else, return a redirect from the action:

```tsx
import { redirect } from "react-router";

export async function action({ request }) {
  let formData = await request.formData();
  let project = await createProject({
    name: String(formData.get("name")),
  });

  return redirect(`/projects/${project.id}`);
}
```

The redirect becomes the next navigation, and React Router loads the data needed for the destination route. This is the client-side equivalent of the familiar mutation-then-redirect pattern used by traditional server-rendered applications.

## Customizing Revalidation

Automatic revalidation is designed to keep the UI synchronized with server state. Avoid disabling it globally just to save requests.

If a particular mutation cannot affect a loader, you can customize revalidation with `shouldRevalidate` or use `defaultShouldRevalidate` for a specific submission. Prefer narrowly scoped conditions and fall back to React Router's default behavior for everything else.

See [Revalidation Optimization][revalidation] for examples and the differences between Framework and Data Modes.

## Summary

For most mutations, let React Router manage the full data lifecycle:

```text
user submits
    ↓
action runs
    ↓
success ──→ loaders revalidate ──→ fresh UI
    │
    └─ validation/error response ──→ show action data/error
```

Use pending states to communicate progress, enforce important mutation guarantees on the server, and customize revalidation only when you know a route's data cannot have changed.

[concurrency]: ./concurrency
[form]: ../api/components/Form
[form-validation]: ../how-to/form-validation
[revalidation]: ../how-to/optimize-revalidation
[use-fetcher]: ../api/hooks/useFetcher
[use-navigation]: ../api/hooks/useNavigation
