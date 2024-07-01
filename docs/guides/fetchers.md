---
title: Using Fetchers
---

# Using Fetchers

Fetchers are useful for creating complex, dynamic user interfaces that require multiple, concurrent data interactions without causing a navigation.

Fetchers track their own, independent state and can be used to load data, mutate data, submit forms, and generally interact with loaders and actions.

## React 19

With the introduction of form actions, transitions, `useOptimistic`, `useActionState`, and `useFormStatus`, React has extended its scope into the same use cases as fetchers. You may want to consider using React's built-in APIs before reaching for a fetcher in React Router.

If you are on React 18, fetchers are still a great way to manage complex data interactions.

## Calling Actions

The most common case for a fetcher is to submit data to an action, triggering a revalidation of route data. Consider the following route module:

```tsx
import { defineRoute } from "react-router";

export default defineRoute({
  async clientLoader({ request }) {
    let title = localStorage.getItem("title") || "No Title";
    return { title };
  },

  Component({ data }) {
    return (
      <div>
        <h1>{data.title}</h1>
      </div>
    );
  },
});
```

### 1. Add an action

First we'll add an action to the route for the fetcher to call:

```tsx lines=[6-10]
export default defineRoute({
  async clientLoader({ request }) {
    // ...
  },

  async clientAction({ request }) {
    await new Promise((res) => setTimeout(res, 1000));
    let data = await request.formData();
    localStorage.setItem("title", data.get("title"));
    return { ok: true };
  },

  Component({ data }) {
    // ...
  },
});
```

### 2. Create a fetcher

Next create a fetcher and render a form with it:

```tsx lines=[7,12-14]
import { useFetcher, defineRoute } from "react-router";

export default defineRoute({
  // ...

  Component({ data }) {
    let fetcher = useFetcher<typeof this.action>();
    return (
      <div>
        <h1>{data.title}</h1>

        <fetcher.Form method="post">
          <input type="text" name="title" />
        </fetcher.Form>
      </div>
    );
  },
});
```

### 3. Submit the form

If you submit the form now, the fetcher call the action and revalidate the route data automatically.

### 4. Render pending state

Fetchers make their state available during the async work so you can render pending UI the moment the user interacts:

```tsx lines=[12]
export default defineRoute({
  // ...

  Component({ data }) {
    let fetcher = useFetcher<typeof this.action>();
    return (
      <div>
        <h1>{data.title}</h1>

        <fetcher.Form method="post">
          <input type="text" name="title" />
          {fetcher.state !== "idle" && <p>Saving...</p>}
        </fetcher.Form>
      </div>
    );
  },
});
```

### 5. Optimistic UI

Sometimes there's enough information in the form to render the next state immediately. You can access the form data with `fetcher.formData`:

```tsx lines=[6-7,11]
export default defineRoute({
  // ...

  Component({ data }) {
    let fetcher = useFetcher();
    let title =
      fetcher.formData?.get("title") || data.title;

    return (
      <div>
        <h1>{title}</h1>

        <fetcher.Form method="post">
          <input type="text" name="title" />
          {fetcher.state !== "idle" && <p>Saving...</p>}
        </fetcher.Form>
      </div>
    );
  },
});
```

### 6. Fetcher Data and Validation

Data returned from an action is available in the fetcher's `data` property. This is primarily useful for returning error messages to the user for a failed mutation:

```tsx lines=[8-11,29-33]
export default defineRoute({
  // ...

  async clientAction({ request }) {
    await new Promise((res) => setTimeout(res, 1000));
    let data = await request.formData();

    let title = data.get("title") as string;
    if (title.trim() === "") {
      return { ok: false, error: "Title cannot be empty" };
    }

    localStorage.setItem("title", title);
    return { ok: true, error: null };
  },

  Component({ data }) {
    let fetcher = useFetcher();
    let title =
      fetcher.formData?.get("title") || data.title;

    return (
      <div>
        <h1>{title}</h1>

        <fetcher.Form method="post">
          <input type="text" name="title" />
          {fetcher.state !== "idle" && <p>Saving...</p>}
          {fetcher.data?.error && (
            <p style={{ color: "red" }}>
              {fetcher.data.error}
            </p>
          )}
        </fetcher.Form>
      </div>
    );
  },
});
```

### With React 19

You can use form actions, `useActionState`, and `useOptimistic` instead of fetchers with React 19.

- Action: `clientAction` moves into a React action function but goes mostly unchanged
- Revalidation: Route data is revalidated manually now with `useRevalidator`
- Pending states: `useActionState` provides the pending flag instead of `fetcher.state`
- Optimistic UI: `useOptimistic` provides the optimistic value instead of reading from `fetcher.formData`

```tsx
import { defineRoute, useRevalidator } from "react-router";
import { useActionState, useOptimistic } from "react";

async function updateTitleAction(formData: formData) {
  await new Promise((res) => setTimeout(res, 1000));
  let data = await request.formData();

  let title = data.get("title") as string;
  if (title.trim() === "") {
    return { ok: false, error: "Title cannot be empty" };
  }

  localStorage.setItem("title", title);
  return { ok: true, error: null };
}

export default defineRoute({
  async clientLoader() {
    // ...
  },

  Component({ data }) {
    let revalidator = useRevalidator();
    let [title, setTitle] = useOptimistic(data.title);
    let [state, action, pending] = useActionState(
      async (_prev: any, formData: FormData) => {
        setTitle(formData.get("title") as string);
        let result = await updateTitleAction(formData);
        if (result.ok) await revalidator.revalidate();
        return result;
      },
      null
    );

    return (
      <div>
        <h1>{title}</h1>

        <form action={action}>
          <input type="text" name="title" />
          {pending && <p>Saving...</p>}
          {state?.error && (
            <p style={{ color: "red" }}>{state.error}</p>
          )}
        </form>
      </div>
    );
  },
});
```

## Loading Data

Another common use case for fetchers is to load data from a route for something like a combobox.

### 1. Create a search route

Consider the following route with a very basic search:

```tsx filename=./search-users.tsx
// { path: '/search-users', filename: './search-users.tsx' }
import { defineRoute } from "react-router";

const users = [
  { id: 1, name: "Ryan" },
  { id: 2, name: "Michael" },
  // ...
];

export default defineRoute({
  async loader({ request }) {
    await new Promise((res) => setTimeout(res, 300));
    let url = new URL(request.url);
    let query = url.searchParams.get("q");
    return users.filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );
  },
});
```

### 2. Render a fetcher in a combobox component

```tsx
import { useFetcher } from "react-router";

export function UserSearchCombobox() {
  let fetcher = useFetcher();
  return (
    <div>
      <fetcher.Form method="get" action="/search-users">
        <input type="text" name="q" />
      </fetcher.Form>
    </div>
  );
}
```

- The action points to the route we created above: "/search-users"
- The name of the input is "q" to match the query parameter

### 3. Add type inference

```tsx lines=[2,5]
import { useFetcher } from "react-router";
import type { Search } from "./search-users";

export function UserSearchCombobox() {
  let fetcher = useFetcher<typeof Search.action>();
  // ...
}
```

Ensure you use `import type` so you only import the types.

### 4. Render the data

```tsx lines=[10-16]
import { useFetcher } from "react-router";

export function UserSearchCombobox() {
  let fetcher = useFetcher<typeof Search.action>();
  return (
    <div>
      <fetcher.Form method="get" action="/search-users">
        <input type="text" name="q" />
      </fetcher.Form>
      {fetcher.data && (
        <ul>
          {fetcher.data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Note you will need to hit "enter" to submit the form and see the results.

### 5. Render a pending state

```tsx lines=[12-14]
import { useFetcher } from "react-router";

export function UserSearchCombobox() {
  let fetcher = useFetcher<typeof Search.action>();
  return (
    <div>
      <fetcher.Form method="get" action="/search-users">
        <input type="text" name="q" />
      </fetcher.Form>
      {fetcher.data && (
        <ul
          style={{
            opacity: fetcher.state === "idle" ? 1 : 0.25,
          }}
        >
          {fetcher.data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 6. Search on user input

Fetchers can be submitted programmatically with `fetcher.submit`:

```tsx lines=[5-7]
<fetcher.Form method="get" action="/search-users">
  <input
    type="text"
    name="q"
    onChange={(event) => {
      fetcher.submit(event.currentTarget.form);
    }}
  />
</fetcher.Form>
```

Note the input event's form is passed as the first argument to `fetcher.submit`. The fetcher will use that form to submit the request, reading it's attributes and serializing the data from it's elements.

### With React 19

When using React 19, you can do the same thing with form actions, `useActionState`, and `useTransition` without needing to configure a route for the search.

```tsx filename=./search-users.tsx
const users = [
  { id: 1, name: "Ryan" },
  { id: 2, name: "Michael" },
  // ...
];

async function search(_: any, formData: FormData) {
  let query = formData.get("q") as string;
  await new Promise((res) => setTimeout(res, 250));
  return users.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

```tsx
import { useActionState, useTransition } from "react";
import { searchUsers } from "./search-users";

export default function UserSearchCombobox() {
  let [, startTransition] = useTransition();
  let [data, action, pending] = useActionState(
    searchUsers,
    null
  );
  return (
    <div>
      <form action={action}>
        <input
          type="text"
          name="q"
          onChange={(event) => {
            startTransition(() => {
              action(
                new FormData(event.currentTarget.form!)
              );
            });
          }}
        />
      </form>
      {data && (
        <ul style={{ opacity: pending ? 0.25 : 1 }}>
          {data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```
