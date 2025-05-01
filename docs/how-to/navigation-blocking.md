---
title: Navigation Blocking
---

# Navigation Blocking

[MODES: framework, data]

## Overview

When users are in the middle of a workflow, like filling out an important form, you may want to prevent them from navigating away from the page.

This example will show:

- Setting up a route with a form and action called with a fetcher
- Blocking navigation when the form is dirty
- Showing a confirmation when the user tries to leave the page

## 1. Set up a route with a form

Add a route with the form, we'll use a "contact" route for this example:

```ts filename=routes.ts
import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("contact", "routes/contact.tsx"),
] satisfies RouteConfig;
```

Add the form to the contact route module:

```tsx filename=routes/contact.tsx
import { useFetcher } from "react-router";
import type { Route } from "./+types/contact";

export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let email = formData.get("email");
  let message = formData.get("message");
  console.log(email, message);
  return { ok: true };
}

export default function Contact() {
  let fetcher = useFetcher();

  return (
    <fetcher.Form method="post">
      <p>
        <label>
          Email: <input name="email" type="email" />
        </label>
      </p>
      <p>
        <textarea name="message" />
      </p>
      <p>
        <button type="submit">
          {fetcher.state === "idle" ? "Send" : "Sending..."}
        </button>
      </p>
    </fetcher.Form>
  );
}
```

## 2. Add dirty state and onChange handler

To track the dirty state of the form, we'll use a single boolean and a quick form onChange handler. You may want to track the dirty state differently but this works for this guide.

```tsx filename=routes/contact.tsx lines=[2,8-12]
export default function Contact() {
  let [isDirty, setIsDirty] = useState(false);
  let fetcher = useFetcher();

  return (
    <fetcher.Form
      method="post"
      onChange={(event) => {
        let email = event.currentTarget.email.value;
        let message = event.currentTarget.message.value;
        setIsDirty(Boolean(email || message));
      }}
    >
      {/* existing code */}
    </fetcher.Form>
  );
}
```

## 3. Block navigation when the form is dirty

```tsx filename=routes/contact.tsx lines=[1,6-8]
import { useBlocker } from "react-router";

export default function Contact() {
  let [isDirty, setIsDirty] = useState(false);
  let fetcher = useFetcher();
  let blocker = useBlocker(
    useCallback(() => isDirty, [isDirty])
  );

  // ... existing code
}
```

While this will now block a navigation, there's no way for the user to confirm it.

## 4. Show confirmation UI

This uses a simple div, but you may want to use a modal dialog.

```tsx filename=routes/contact.tsx lines=[19-41]
export default function Contact() {
  let [isDirty, setIsDirty] = useState(false);
  let fetcher = useFetcher();
  let blocker = useBlocker(
    useCallback(() => isDirty, [isDirty])
  );

  return (
    <fetcher.Form
      method="post"
      onChange={(event) => {
        let email = event.currentTarget.email.value;
        let message = event.currentTarget.message.value;
        setIsDirty(Boolean(email || message));
      }}
    >
      {/* existing code */}

      {blocker.state === "blocked" && (
        <div>
          <p>Wait! You didn't send the message yet:</p>
          <p>
            <button
              type="button"
              onClick={() => blocker.proceed()}
            >
              Leave
            </button>{" "}
            <button
              type="button"
              onClick={() => blocker.reset()}
            >
              Stay here
            </button>
          </p>
        </div>
      )}
    </fetcher.Form>
  );
}
```

If the user clicks "leave" then `blocker.proceed()` will proceed with the navigation. If they click "stay here" then `blocker.reset()` will clear the blocker and keep them on the current page.

## 5. Reset the blocker when the action resolves

If the user doesn't click either "leave" or "stay here", then then submits the form, the blocker will still be active. Let's reset the blocker when the action resolves with an effect.

```tsx filename=routes/contact.tsx
useEffect(() => {
  if (fetcher.data?.ok) {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }
}, [fetcher.data]);
```

## 6. Clear the form when the action resolves

While unrelated to navigation blocking, let's clear the form when the action resolves with a ref.

```tsx
let formRef = useRef<HTMLFormElement>(null);

// put it on the form
<fetcher.Form
  ref={formRef}
  method="post"
  onChange={(event) => {
    // ... existing code
  }}
>
  {/* existing code */}
</fetcher.Form>;
```

```tsx
useEffect(() => {
  if (fetcher.data?.ok) {
    // clear the form in the effect
    formRef.current?.reset();
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }
}, [fetcher.data]);
```

Alternatively, if a navigation is currently blocked, instead of resetting the blocker, you can proceed through to the blocked navigation.

```tsx
useEffect(() => {
  if (fetcher.data?.ok) {
    if (blocker.state === "blocked") {
      // proceed with the blocked navigation
      blocker.proceed();
    } else {
      formRef.current?.reset();
    }
  }
}, [fetcher.data]);
```

In this case the user flow is:

- User fills out the form
- User forgets to click "send" and clicks a link instead
- The navigation is blocked, and the confirmation message is shown
- Instead of clicking "leave" or "stay here", the user submits the form
- The user is taken to the requested page
