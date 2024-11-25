---
title: Form Validation
---

# Form Validation

This guide walks through a simple signup form implementation. You will likely want to pair these concepts with third-party validation libraries and error components, but this guide only focuses on the moving pieces for React Router.

## 1. Setting Up

We'll start by creating a basic signup route with form.

```ts filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("signup", "signup.tsx"),
] satisfies RouteConfig;
```

```tsx filename=signup.tsx
import type { Route } from "./+types/signup";
import { useFetcher } from "react-router";

export default function Signup(_: Route.ComponentProps) {
  let fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <p>
        <input type="email" name="email" />
      </p>

      <p>
        <input type="password" name="password" />
      </p>

      <button type="submit">Sign Up</button>
    </fetcher.Form>
  );
}
```

## 2. Defining the Action

In this step, we'll define a server `action` in the same file as our `Signup` component. Note that the aim here is to provide a broad overview of the mechanics involved rather than digging deep into form validation rules or error object structures. We'll use rudimentary checks for the email and password to demonstrate the core concepts.

```tsx filename=signup.tsx
import type { Route } from "./+types/signup";
import { redirect, useFetcher, data } from "react-router";

export default function Signup(_: Route.ComponentProps) {
  // omitted for brevity
}

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const errors = {};

  if (!email.includes("@")) {
    errors.email = "Invalid email address";
  }

  if (password.length < 12) {
    errors.password =
      "Password should be at least 12 characters";
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  // Redirect to dashboard if validation is successful
  return redirect("/dashboard");
}
```

If any validation errors are found, they are returned from the `action` to the fetcher. This is our way of signaling to the UI that something needs to be corrected, otherwise the user will be redirected to the dashboard.

Note the `data({ errors }, { status: 400 })` call. Setting a 400 status is the web standard way to signal to the client that there was a validation error (Bad Request). In React Router, only 200 status codes trigger page data revalidation so a 400 prevent that.

## 3. Displaying Validation Errors

Finally, we'll modify the `Signup` component to display validation errors, if any, from `fetcher.data`.

```tsx filename=signup.tsx lines=[3,8,13-15]
export default function Signup(_: Route.ComponentProps) {
  let fetcher = useFetcher();
  let errors = fetcher.data?.errors;
  return (
    <fetcher.Form method="post">
      <p>
        <input type="email" name="email" />
        {errors?.email ? <em>{errors.email}</em> : null}
      </p>

      <p>
        <input type="password" name="password" />
        {errors?.password ? (
          <em>{errors.password}</em>
        ) : null}
      </p>

      <button type="submit">Sign Up</button>
    </fetcher.Form>
  );
}
```
