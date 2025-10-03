---
"@react-router/dev": patch
"react-router": patch
---

New (unstable) `useRoute` hook for accessing data from specific routes

For example, let's say you have an `admin` route somewhere in your app and you want any child routes of `admin` to all have access to the `loaderData` and `actionData` from `admin.`

```tsx
// app/routes/admin.tsx
import { Outlet } from "react-router";

export const loader = () => ({ message: "Hello, loader!" });

export const action = () => ({ count: 1 });

export default function Component() {
  return (
    <div>
      {/* ... */}
      <Outlet />
      {/* ... */}
    </div>
  );
}
```

You might even want to create a reusable widget that all of the routes nested under `admin` could use:

```tsx
import { unstable_useRoute as useRoute } from "react-router";

export function AdminWidget() {
  // How to get `message` and `count` from `admin` route?
}
```

In framework mode, `useRoute` knows all your app's routes and gives you TS errors when invalid route IDs are passed in:

```tsx
export function AdminWidget() {
  const admin = useRoute("routes/dmin");
  //                      ^^^^^^^^^^^
}
```

`useRoute` returns `undefined` if the route is not part of the current page:

```tsx
export function AdminWidget() {
  const admin = useRoute("routes/admin");
  if (!admin) {
    throw new Error(`AdminWidget used outside of "routes/admin"`);
  }
}
```

Note: the `root` route is the exception since it is guaranteed to be part of the current page.
As a result, `useRoute` never returns `undefined` for `root`.

`loaderData` and `actionData` are marked as optional since they could be accessed before the `action` is triggered or after the `loader` threw an error:

```tsx
export function AdminWidget() {
  const admin = useRoute("routes/admin");
  if (!admin) {
    throw new Error(`AdminWidget used outside of "routes/admin"`);
  }
  const { loaderData, actionData } = admin;
  console.log(loaderData);
  //          ^? { message: string } | undefined
  console.log(actionData);
  //          ^? { count: number } | undefined
}
```

If instead of a specific route, you wanted access to the _current_ route's `loaderData` and `actionData`, you can call `useRoute` without arguments:

```tsx
export function AdminWidget() {
  const currentRoute = useRoute();
  currentRoute.loaderData;
  currentRoute.actionData;
}
```

This usage is equivalent to calling `useLoaderData` and `useActionData`, but consolidates all route data access into one hook: `useRoute`.

Note: when calling `useRoute()` (without a route ID), TS has no way to know which route is the current route.
As a result, `loaderData` and `actionData` are typed as `unknown`.
If you want more type-safety, you can either narrow the type yourself with something like `zod` or you can refactor your app to pass down typed props to your `AdminWidget`:

```tsx
export function AdminWidget({
  message,
  count,
}: {
  message: string;
  count: number;
}) {
  /* ... */
}
```
