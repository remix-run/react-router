---
title: Actions
order: 6
---

# Actions

Data mutations are done through Route actions. When the action completes, all loader data on the page is revalidated to keep your UI in sync with the data without writing any code to do it.

Route actions defined with `action` are only called on the server while actions defined with `clientAction` are run in the browser.

## Client Actions

Client actions are run in the browser and defined with `clientAction` from a route module, they take precedences over `action` when both are defined.

```tsx filename=app/project.tsx
// route('/projects/:projectId', './project.tsx')

export async function clientAction({ request }) {
  const formData = await request.formData();
  const title = await formData.get("title");
  const res = await fetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const task = await res.json();
  return task;
}
```

## Server Actions

Server actions always run server side and are removed from client bundles.

```tsx filename=app/project.tsx
export async function action({ request }) {
  const formData = await request.formData();
  const title = await formData.get("title");
  const task = await db.createTask(title);
  return task;
}
```

## Calling Actions

Actions are called declaratively through `<Form>` and imperatively through `useSubmit` (or `<fetcher.Form>` and `fetcher.submit`) by referencing the route's path and a "post" method.

```tsx
import { Form } from "react-router";

function SomeComponent() {
  return (
    <div>
      <h2>Create a Task</h2>
      <Form
        action="/projects/:projectId"
        method="post"
        navigate={false}
      >
        <input type="text" name="title" />
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
```

When a form action is omitted, the closest route action is called.

```tsx
// route("/projects/:projectId", "./project.tsx");
export async function action() {
  // create a task
}

export default function Project() {
  return (
    <div>
      <h1>Project</h1>
      {/* when form action is omitted, this route's action will be called */}
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
```

See also:

- [Form][form]
- [useSubmit][use_submit]
- [useActionData][use_action_data]
- [useFetcher][use_fetcher]
- [Forms vs Fetchers][forms_vs_fetchers]
- [Progressive Enhancement][progressive_enhancement]

[form]: ../components/form
[use_submit]: ../hooks/use-submit
[use_action_data]: ../hooks/use-action-data
[use_fetcher]: ../hooks/use-fetcher
[forms_vs_fetchers]: ../discussion/form-vs-fetcher
[progressive_enhancement]: ../discussion//progressive-enhancement

## Revalidation

When an action completes, all loader data on the page is revalidated to keep your UI in sync with the data. There is nothing you need to do to trigger this, it happens automatically. You can opt-out of revalidation by implementing [`shouldRevalidate`][should_revalidate] in your route modules.

[should_revalidate]: #TODO
