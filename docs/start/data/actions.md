---
title: Actions
order: 5
---

# Actions

[MODES: data]

## Defining Actions

Data mutations are done through Route actions defined on the `action` property of a route object. When the action completes, all loader data on the page is revalidated to keep your UI in sync with the data without writing any code to do it.

```tsx
import { createBrowserRouter } from "react-router";
import { someApi } from "./api";

let router = createBrowserRouter([
  {
    path: "/projects/:projectId",
    Component: Project,
    action: async ({ request }) => {
      let formData = await request.formData();
      let title = formData.get("title");
      let project = await someApi.updateProject({ title });
      return project;
    },
  },
]);
```

## Calling Actions

Actions are called declaratively through `<Form>` and imperatively through `useSubmit` (or `<fetcher.Form>` and `fetcher.submit`) by referencing the route's path and a "post" method.

### Calling actions with a Form

```tsx
import { Form } from "react-router";

function SomeComponent() {
  return (
    <Form action="/projects/123" method="post">
      <input type="text" name="title" />
      <button type="submit">Submit</button>
    </Form>
  );
}
```

This will cause a navigation and a new entry will be added to the browser history.

### Calling actions with useSubmit

You can submit form data to an action imperatively with `useSubmit`.

```tsx
import { useCallback } from "react";
import { useSubmit } from "react-router";
import { useFakeTimer } from "fake-lib";

function useQuizTimer() {
  let submit = useSubmit();

  let cb = useCallback(() => {
    submit(
      { quizTimedOut: true },
      { action: "/end-quiz", method: "post" }
    );
  }, []);

  let tenMinutes = 10 * 60 * 1000;
  useFakeTimer(tenMinutes, cb);
}
```

This will cause a navigation and a new entry will be added to the browser history.

### Calling actions with a fetcher

Fetchers allow you to submit data to actions (and loaders) without causing a navigation (no new entries in the browser history).

```tsx
import { useFetcher } from "react-router";

function Task() {
  let fetcher = useFetcher();
  let busy = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action="/update-task/123">
      <input type="text" name="title" />
      <button type="submit">
        {busy ? "Saving..." : "Save"}
      </button>
    </fetcher.Form>
  );
}
```

They also have the imperative `submit` method.

```tsx
fetcher.submit(
  { title: "New Title" },
  { action: "/update-task/123", method: "post" }
);
```

See the [Using Fetchers][fetchers] guide for more information.

## Accessing Action Data

Actions can return data available through `useActionData` in the route component or `fetcher.data` when using a fetcher.

```tsx
function Project() {
  let actionData = useActionData();
  return (
    <div>
      <h1>Project</h1>
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Submit</button>
      </Form>
      {actionData ? (
        <p>{actionData.title} updated</p>
      ) : null}
    </div>
  );
}
```

---

Next: [Navigating](./navigating)

[fetchers]: ../../how-to/fetchers
