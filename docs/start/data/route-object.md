---
title: Route Object
order: 3
---

# Route Object

[MODES: data]

## Introduction

The objects passed to `createBrowserRouter` are called Route Objects.

```tsx lines=[2-5]
createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
]);
```

Route modules are the foundation of React Router's data features, they define:

- data loading
- actions
- revalidation
- error boundaries
- and more

This guide is a quick overview of every route object feature.

## Component

The `Component` property in a route object defines the component that will render when the route matches.

```tsx lines=[4]
createBrowserRouter([
  {
    path: "/",
    Component: MyRouteComponent,
  },
]);

function MyRouteComponent() {
  return (
    <div>
      <h1>Look ma!</h1>
      <p>
        I'm still using React Router after like 10 years.
      </p>
    </div>
  );
}
```

## `loader`

Route loaders provide data to route components before they are rendered.

```tsx
import {
  useLoaderData,
  createBrowserRouter,
} from "react-router";

createBrowserRouter([
  {
    path: "/",
    loader: loader,
    Component: MyRoute,
  },
]);

async function loader({ params }) {
  return { message: "Hello, world!" };
}

function MyRoute() {
  let data = useLoaderData();
  return <h1>{data.message}</h1>;
}
```

See also:

- [`loader` params][loader-params]

## `action`

Route actions allow server-side data mutations with automatic revalidation of all loader data on the page when called from `<Form>`, `useFetcher`, and `useSubmit`.

```tsx
import {
  createBrowserRouter,
  useLoaderData,
  useActionData,
  Form,
} from "react-router";
import { TodoList } from "~/components/TodoList";

createBrowserRouter([
  {
    path: "/items",
    action: action,
    loader: loader,
    Component: Items,
  },
]);

async function action({ request }) {
  const data = await request.formData();
  const todo = await fakeDb.addItem({
    title: data.get("title"),
  });
  return { ok: true };
}

// this data will be revalidated after the action completes...
async function loader() {
  const items = await fakeDb.getItems();
  return { items };
}

// ...so that the list here is updated automatically
export default function Items() {
  let data = useLoaderData();
  return (
    <div>
      <List items={data.items} />
      <Form method="post" navigate={false}>
        <input type="text" name="title" />
        <button type="submit">Create Todo</button>
      </Form>
    </div>
  );
}
```

## `shouldRevalidate`

By default, all routes are revalidated after actions. This function allows a route to opt-out of revalidation for actions that don't affect its data.

```tsx
import type { ShouldRevalidateFunctionArgs } from "react-router";

function shouldRevalidate(
  arg: ShouldRevalidateFunctionArgs
) {
  return true; // false
}

createBrowserRouter([
  {
    path: "/",
    shouldRevalidate: shouldRevalidate,
    Component: MyRoute,
  },
]);
```

## `lazy`

Most properties can be lazily imported to reduce the initial bundle size.

```tsx
createBrowserRouter([
  {
    path: "/app",
    lazy: async () => {
      // load component and loader in parallel before rendering
      const [Component, loader] = await Promise.all([
        import("./app"),
        import("./app-loader"),
      ]);
      return { Component, loader };
    },
  },
]);
```

---

Next: [Data Loading](./data-loading)

[loader-params]: https://api.reactrouter.com/v7/interfaces/react_router.LoaderFunctionArgs
