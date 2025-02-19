---
title: Navigating
order: 6
---

# Navigating

Users navigate your application with `<Link>`, `<NavLink>`, `<Form>`, `redirect`, and `useNavigate`.

## NavLink

This component is for navigation links that need to render active and pending states.

```tsx
import { NavLink } from "react-router";

export function MyAppNav() {
  return (
    <nav>
      <NavLink to="/" end>
        Home
      </NavLink>
      <NavLink to="/trending" end>
        Trending Concerts
      </NavLink>
      <NavLink to="/concerts">All Concerts</NavLink>
      <NavLink to="/account">Account</NavLink>
    </nav>
  );
}
```

`NavLink` renders default class names for different states for easy styling with CSS:

```css
a.active {
  color: red;
}

a.pending {
  animate: pulse 1s infinite;
}

a.transitioning {
  /* css transition is running */
}
```

It also has callback props on `className`, `style`, and `children` with the states for inline styling or conditional rendering:

```tsx
// className
<NavLink
  to="/messages"
  className={({ isActive, isPending, isTransitioning }) =>
    [
      isPending ? "pending" : "",
      isActive ? "active" : "",
      isTransitioning ? "transitioning" : "",
    ].join(" ")
  }
>
  Messages
</NavLink>
```

```tsx
// style
<NavLink
  to="/messages"
  style={({ isActive, isPending, isTransitioning }) => {
    return {
      fontWeight: isActive ? "bold" : "",
      color: isPending ? "red" : "black",
      viewTransitionName: isTransitioning ? "slide" : "",
    };
  }}
>
  Messages
</NavLink>
```

```tsx
// children
<NavLink to="/tasks">
  {({ isActive, isPending, isTransitioning }) => (
    <span className={isActive ? "active" : ""}>Tasks</span>
  )}
</NavLink>
```

## Link

Use `<Link>` when the link doesn't need active styling:

```tsx
import { Link } from "react-router";

export function LoggedOutMessage() {
  return (
    <p>
      You've been logged out.{" "}
      <Link to="/login">Login again</Link>
    </p>
  );
}
```

## Form

The form component can be used to navigate with `URLSearchParams` provided by the user.

```tsx
<Form action="/search">
  <input type="text" name="q" />
</Form>
```

If the user enters "journey" into the input and submits it, they will navigate to:

```
/search?q=journey
```

Forms with `<Form method="post" />` will also navigate to the action prop but will submit the data as `FormData` instead of `URLSearchParams`. However, it is more common to `useFetcher()` to POST form data. See [Using Fetchers](../../how-to/fetchers).

## redirect

Inside of route loaders and actions, you can return a `redirect` to another URL.

```tsx
import { redirect } from "react-router";

export async function loader({ request }) {
  let user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return { userName: user.name };
}
```

It is common to redirect to a new record after it has been created:

```tsx
import { redirect } from "react-router";

export async function action({ request }) {
  let formData = await request.formData();
  let project = await createProject(formData);
  return redirect(`/projects/${project.id}`);
}
```

## useNavigate

This hook allows the programmer to navigate the user to a new page without the user interacting. Usage of this hook should be uncommon. It's recommended to use the other APIs in this guide when possible.

Reserve usage of `useNavigate` to situations where the user is _not_ interacting but you need to navigate, for example:

- Logging them out after inactivity
- Timed UIs like quizzes, etc.

```tsx
import { useNavigate } from "react-router";

export function useLogoutAfterInactivity() {
  let navigate = useNavigate();

  useFakeInactivityHook(() => {
    navigate("/logout");
  });
}
```

---

Next: [Pending UI](./pending-ui)
