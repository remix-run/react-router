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

## `middleware`

Route [middleware][middleware] runs sequentially before and after navigations. This gives you a singular place to do things like logging and authentication. The `next` function continues down the chain, and on the leaf route the `next` function executes the loaders/actions for the navigation.

```tsx
createBrowserRouter([
  {
    path: "/",
    middleware: [loggingMiddleware],
    loader: rootLoader,
    Component: Root,
    children: [{
      path: 'auth',
      middleware: [authMiddleware],
      loader: authLoader,
      Component: Auth,
      children: [...]
    }]
  },
]);

async function loggingMiddleware({ request }, next) {
  let url = new URL(request.url);
  console.log(`Starting navigation: ${url.pathname}${url.search}`);
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  console.log(`Navigation completed in ${duration}ms`);
}

const userContext = createContext<User>();

async function authMiddleware ({ context }) {
  const userId = getUserId();

  if (!userId) {
    throw redirect("/login");
  }

  context.set(userContext, await getUserById(userId));
};
```

See also:

- [Middleware][middleware]

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

Loader data is automatically revalidated after certain events like navigations and form submissions.

This hook enables you to opt in or out of the default revalidation behavior. The default behavior is nuanced to avoid calling loaders unnecessarily.

A route loader is revalidated when:

- its own route params change
- any change to URL search params
- after an action is called and returns a non-error status code

By defining this function, you opt out of the default behavior completely and can manually control when loader data is revalidated for navigations and form submissions.

```tsx
import type { ShouldRevalidateFunctionArgs } from "react-router";

function shouldRevalidate(
  arg: ShouldRevalidateFunctionArgs,
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

[`ShouldRevalidateFunctionArgs` Reference Documentation ↗](https://api.reactrouter.com/v7/interfaces/react_router.ShouldRevalidateFunctionArgs.html)

Please note the default behavior is different in [Framework Mode](../modes).

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
[middleware]: ../../how-to/middleware
