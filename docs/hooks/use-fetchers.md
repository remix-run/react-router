---
title: useFetchers
new: true
---

# `useFetchers`

Returns an array of all inflight [fetchers][usefetcher] without their `load`, `submit`, or `Form` properties (can't have parent components trying to control the behavior of their children! We know from IRL experience that this is a fool's errand.)

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
import { useFetchers } from "react-router-dom";

function SomeComp() {
  const fetchers = useFetchers();
  // array of inflight fetchers
}
```

This is useful for components throughout the app that didn't create the fetchers but want to use their submissions to participate in optimistic UI.

For example, imagine a UI where the sidebar lists projects, and the main view displays a list of checkboxes for the current project. The sidebar could display the number of completed and total tasks for each project.

```
+-----------------+----------------------------+
|                 |                            |
|   Soccer  (8/9) | [x] Do the dishes          |
|                 |                            |
| > Home    (2/4) | [x] Fold laundry           |
|                 |                            |
|                 | [ ] Replace battery in the |
|                 |     smoke alarm            |
|                 |                            |
|                 | [ ] Change lights in kids  |
|                 |     bathroom               |
|                 |                            |
+-----------------+----------------------------┘
```

When the user clicks a checkbox, the submission goes to the action to change the state of the task. Instead of creating a "loading state" we want to create an "optimistic UI" that will **immediately** update the checkbox to appear checked even though the server hasn't processed it yet. In the checkbox component, we can use `fetcher.formData`:

```tsx
function Task({ task }) {
  const { projectId, id } = task;
  const toggle = useFetcher();
  const checked = toggle.formData
    ? toggle.formData.get("complete") === "on"
    : task.complete;

  return (
    <toggle.Form
      method="put"
      action={`/projects/${projectId}/tasks/${id}`}
    >
      <input name="id" type="hidden" defaultValue={id} />
      <label>
        <input
          name="complete"
          type="checkbox"
          checked={checked}
          onChange={(e) => toggle.submit(e.target.form)}
        />
      </label>
    </toggle.Form>
  );
}
```

This awesome for the checkbox, but the sidebar will say 2/4 while the checkboxes show 3/4 when the user clicks on of them!

```
+-----------------+----------------------------+
|                 |                            |
|   Soccer  (8/9) | [x] Do the dishes          |
|                 |                            |
| > Home    (2/4) | [x] Fold laundry           |
|     WRONG! ^    |                            |
|          CLICK!-->[x] Replace battery in the |
|                 |     smoke alarm            |
|                 |                            |
|                 | [ ] Change lights in kids  |
|                 |     bathroom               |
|                 |                            |
+-----------------+----------------------------┘
```

Because routes are automatically revalidated, the sidebar will quickly update and be correct. But for a moment, it's gonna feel a little funny.

This is where `useFetchers` comes in. Up in the sidebar, we can access all the inflight fetcher states from the checkboxes - even though it's not the component that created them.

The strategy has three steps:

1. Find the submissions for tasks in a specific project
2. Use the `fetcher.formData` to immediately update the count
3. Use the normal task's state if it's not inflight

```tsx
function ProjectTaskCount({ project }) {
  let completedTasks = 0;
  const fetchers = useFetchers();

  // Find this project's fetchers
  const relevantFetchers = fetchers.filter((fetcher) => {
    return fetcher.formAction?.startsWith(
      `/projects/${project.id}/tasks/`
    );
  });

  // Store in a map for easy lookup
  const myFetchers = new Map(
    relevantFetchers.map(({ formData }) => [
      formData.get("id"),
      formData.get("complete") === "on",
    ])
  );

  // Increment the count
  for (const task of project.tasks) {
    if (myFetchers.has(task.id)) {
      if (myFetchers.get(task.id)) {
        // if it's being submitted, increment optimistically
        completedTasks++;
      }
    } else if (task.complete) {
      // otherwise use the real task's data
      completedTasks++;
    }
  }

  return (
    <small>
      {completedTasks}/{project.tasks.length}
    </small>
  );
}
```

It's a little bit of work, but it's mostly just asking React Router for the state it's tracking and doing an optimistic calculation based on it.

[usefetcher]: ./use-fetcher
[pickingarouter]: ../routers/picking-a-router
