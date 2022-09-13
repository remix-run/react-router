---
title: useActionData
new: true
---

# `useActionData`

This hook provides the returned value from the previous navigation's `action` result, or `undefined` if there was no submission.

```tsx
import { useActionData } from "react-router-dom";

function SomeComponent() {
  let actionData = useActionData();
  // ...
}
```

The most common use-case for this hook is form validation errors. If the form isn't right, you can return the errors and let the user try again:

```tsx lines=[2,8,47]
import {
  useActionData,
  Form,
  redirect,
} from "react-router-dom";

export default function SignUp() {
  const errors = useActionData();

  return (
    <Form method="post">
      <p>
        <input type="text" name="email" />
        {errors?.email && <span>{errors.email}</span>}
      </p>

      <p>
        <input type="text" name="password" />
        {errors?.password && <span>{errors.password}</span>}
      </p>

      <p>
        <button type="submit">Sign up</button>
      </p>
    </Form>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const errors = {};

  // validate the fields
  if (typeof email !== "string" || !email.includes("@")) {
    errors.email =
      "That doesn't look like an email address";
  }

  if (typeof password !== "string" || password.length < 6) {
    errors.password = "Password must be > 6 characters";
  }

  // return data if we have errors
  if (Object.keys(errors).length) {
    return errors;
  }

  // otherwise create the user and redirect
  await createUser(email, password);
  return redirect("/dashboard");
}
```
