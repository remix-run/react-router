---
title: Testing
order: 9
---

# Testing

When components use things like `useLoaderData`, `<Link>`, etc, they are required to be rendered in context of a React Router app. The `createRoutesStub` function creates that context to test components in isolation.

Consider a login form component that relies on `useActionData`

```tsx
import { useActionData } from "react-router";

export function LoginForm() {
  const errors = useActionData();
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
import * as Test from "@testing-library/react";
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
    }),
  ]);

  // render the app stub at "/login"
  Test.render(<Stub initialEntries={["/login"]} />);

  // simulate interactions
  Test.user.click(screen.getByText("Login"));
  await Test.waitFor(() => screen.findByText(USER_MESSAGE));
  await Test.waitFor(() =>
    screen.findByText(PASSWORD_MESSAGE)
  );
});
```
