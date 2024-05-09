---
title: Testing
order: 8
---

# Testing

When components use things like `useLoaderData`, `<Link>`, etc, they are required to be rendered in context of a React Router app. The `createStub` function creates that context to test components in isolation.

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

We can test this component with `createStub`. It takes an array of objects that resemble route modules with loaders, actions, and components.

```tsx
import * as Test from "@testing-library/react";
import { createStub } from "react-router-dom/testing";
import { LoginForm } from "./LoginForm";

test("LoginForm renders error messages", async () => {
  const USER_MESSAGE = "Username is required";
  const PASSWORD_MESSAGE = "Password is required";

  const Stub = createStub([
    {
      path: "/login",

      // test the LoginForm
      Component: LoginForm,

      // simulate an action that returns errors
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
  Test.render(<Stub initialEntries={["/login"]} />);

  // simulate interactions
  Test.user.click(screen.getByText("Login"));
  await Test.waitFor(() => screen.findByText(USER_MESSAGE));
  await Test.waitFor(() =>
    screen.findByText(PASSWORD_MESSAGE)
  );
});
```

See the [`react-router/testing`][testing_guide] package for more information.

## Integration tests

(TODO: not really react router specific, recommend playright?)

[testing_guide]: #TODO:
