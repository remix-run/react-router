---
title: Actions
order: 6
---

# Actions

<docs-warning>
  The types for route modules are still in development, this API may change.
</docs-warning>

Data mutations are done through Route actions. When the action completes, all loader data on the page is revalidated to keep your UI in sync with the data without writing any code to do it.

Route actions defined with `action` are only called on the server while actions defined with `clientAction` are run in the browser.

## Client Actions

Client actions only run in the browser and take priority over a server action when both are defined.

```tsx filename=app/project.tsx
// route('/projects/:projectId', './project.tsx')
import type {
  DefaultProps,
  ClientActionArgs,
} from "./+types.project";
import { Form } from "react-router";

export async function clientAction({
  request,
}: ClientActionArgs) {
  let formData = await request.formData();
  let title = await formData.get("title");
  let project = await someApi.updateProject({ title });
  return project;
}

export default function Project({
  clientActionData,
}: DefaultProps) {
  return (
    <div>
      <h1>Project</h1>
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Submit</button>
      </Form>
      {clientActionData ? (
        <p>{clientActionData.title} updated</p>
      ) : null}
    </div>
  );
}
```

## Server Actions

Server actions only run on the server and are removed from client bundles.

```tsx filename=app/project.tsx
// route('/projects/:projectId', './project.tsx')
import type {
  DefaultProps,
  ActionArgs,
} from "./+types.project";
import { Form } from "react-router";

export async function action({ request }: ActionArgs) {
  let formData = await request.formData();
  let title = await formData.get("title");
  let project = await someApi.updateProject({ title });
  return project;
}

export default function Project({
  actionData,
}: DefaultProps) {
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

## Calling Actions

Actions are called declaratively through `<Form>` and imperatively through `useSubmit` (or `<fetcher.Form>` and `fetcher.submit`) by referencing the route's path and a "post" method.

### Calling actions with a Form

```tsx
import { Form } from "react-router";

function SomeComponent() {
  return (
    <Form action="/projects/:projectId" method="post">
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
    <fetcher.Form method="post">
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
  { action: "/update-task", method: "post" }
);
```

See the [Using Fetchers](../misc/fetchers) guide for more information.
