---
title: Testing
order: 9
---

# Testing

[MODES: framework, data]

## Introduction

When components use things like `useLoaderData`, `<Link>`, etc, they are required to be rendered in context of a React Router app. The `createRoutesStub` function creates that context to test components in isolation.

Consider a login form component that relies on `useActionData`

```tsx
import { useActionData } from "react-router";

export function LoginForm() {
  const actionData = useActionData();
  const errors = actionData?.errors;
  return (
    <Form method="post">
      <label>
        <input type="text" name="username" />
        {errors?.username && <div>{errors.username}</div>}
      </label>

      <label>
        <input type="password" name="password" />
        {errors?.password && <div>{errors.password}</div>}
      </label>

      <button type="submit">Login</button>
    </Form>
  );
}
```

We can test this component with `createRoutesStub`. It takes an array of objects that resemble route modules with loaders, actions, and components.

```tsx
import { createRoutesStub } from "react-router";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

test("LoginForm renders error messages", async () => {
  const USER_MESSAGE = "Username is required";
  const PASSWORD_MESSAGE = "Password is required";

  const Stub = createRoutesStub([
    {
      path: "/login",
      Component: LoginForm,
      action() {
        return {
          errors: {
            username: USER_MESSAGE,
            password: PASSWORD_MESSAGE,
          },
        };
      },
    },
  ]);

  // render the app stub at "/login"
  render(<Stub initialEntries={["/login"]} />);

  // simulate interactions
  userEvent.click(screen.getByText("Login"));
  await waitFor(() => screen.findByText(USER_MESSAGE));
  await waitFor(() => screen.findByText(PASSWORD_MESSAGE));
});
```

## Using with Framework Mode Types

It's important to note that `createRoutesStub` is designed for _unit_ testing of reusable components in your application that rely on on contextual router information (i.e., `loaderData`, `actionData`, `matches`). These components usually obtain this information via the hooks (`useLoaderData`, `useActionData`, `useMatches`) or via props passed down from the ancestor route component. We **strongly** recommend limiting your usage of `createRoutesStub` to unit testing of these types of reusable components.

`createRoutesStub` is _not designed_ for (and is arguably incompatible with) direct testing of Route components using the [`Route.\*`](../../explanation/type-safety) types available in Framework Mode. This is because the `Route.*` types are derived from your actual application - including the real `loader`/`action` functions as well as the structure of your route tree structure (which defines the `matches` type). When you use `createRoutesStub`, you are providing stubbed values for `loaderData`, `actionData`, and even your `matches` based on the route tree you pass to `createRoutesStub`. Therefore, the types won't align with the `Route.*` types and you'll get type issues trying to use a route component in a route stub.

```tsx filename=routes/login.tsx
export default function Login({
  actionData,
}: Route.ComponentProps) {
  return <Form method="post">...</Form>;
}
```

```tsx filename=routes/login.test.tsx
import LoginRoute from "./login";

test("LoginRoute renders error messages", async () => {
  const Stub = createRoutesStub([
    {
      path: "/login",
      Component: LoginRoute,
      // ^ ❌ Types of property 'matches' are incompatible.
      action() {
        /*...*/
      },
    },
  ]);

  // ...
});
```

These type errors are generally accurate if you try to setup your tests like this. As long as your stubbed `loader`/`action` functions match your real implementations, then the types for `loaderData`/`actionData` will be correct, but if they differ your types will be lying to you.

`matches` is more complicated since you don't usually stub out all of the ancestor routes. In this example, there is no `root` route so `matches` will only contain your test route, while it will contain the root route and any other ancestors at runtime. There's no great way to automatically align the typegen types with the runtime types in your test.

Therefore, if you need to test Route level components, we recommend you do that via an Integration/E2E test (Playwright, Cypress, etc.) against a running application because you're venturing out of unit testing territory when testing your route as a whole.

If you _need_ to write a unit test against the route, you can add a `@ts-expect-error` comment in your test to silence the TypeScript error:

```tsx
const Stub = createRoutesStub([
  {
    path: "/login",
    // @ts-expect-error: `matches` won't align between test code and app code
    Component: LoginRoute,
    action() {
      /*...*/
    },
  },
]);
```
