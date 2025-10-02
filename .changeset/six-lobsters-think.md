---
"@react-router/dev": patch
"react-router": patch
---

New (unstable) `useRoute` hook for accessing data from specific routes

`useRouteLoaderData` has many shortcomings:

1. Its `routeId` arg is typed as `string`, so TS won't complain if you pass in a non-existent route ID
2. Type-safety was limited to a `typeof loader` generic that required you to manually import and pass in the type for the corresponding `loader`
3. Even with `typeof loader`, the types were not aware of `clientLoader`, `HydrateFallback`, and `clientLoader.hydrate = true`, which all affect the type for `loaderData`
4. It is limited solely to `loader` data, but does not provide `action` data
5. It introduced confusion about when to use `useLoaderData` and when to use `useRouteLoaderData`

```ts
// app/routes/admin.tsx
export const loader = () => ({ message: "Hello, loader!" });

export const action = () => ({ message: "Hello, action!" });
```

```ts
import { type loader } from "../routes/admin";

export function Widget() {
  const loaderData = useRouteLoaderData<typeof loader>("routes/admin");
  // ...
}
```

With `useRoute`, all of these concerns have been fixed:

```ts
import { unstable_useRoute as useRoute } from "react-router";

export function Widget() {
  const admin = useRoute("routes/admin");
  console.log(admin?.loaderData?.message);
  console.log(admin?.actionData?.message);
  // ...
}
```

Note: `useRoute` returns `undefined` if the route is not part of the current page.

The `root` route is special because it is guaranteed to be part of the current page, so no need to use `?.` or any other `undefined` checks:

```ts
export function Widget() {
  const root = useRoute("root");
  console.log(root.loaderData?.message, root.actionData?.message);
  // ...
}
```

You may have noticed that `loaderData` and `actionData` are marked as optional.
This is intentional as there's no guarantee that `loaderData` nor `actionData` exists when called in certain contexts like within an `ErrorBoundary`:

```ts
export function ErrorBoundary() {
  const admin = useRoute("routes/admin");
  console.log(admin?.loaderData?.message);
  //                           ^^
  // `loader` for itself could have thrown an error,
  // so you need to check if `loaderData` exists!
}
```

In an effort to consolidate on fewer, more intuitive hooks, `useRoute` can be called without arguments as a replacement for `useLoaderData` and `useActionData`:

```ts
export function Widget() {
  const currentRoute = useRoute();
  currentRoute.loaderData;
  currentRoute.actionData;
}
```

Since `Widget` is a reusable component that could be within any route, we have no guarantees about the types for `loaderData` nor `actionData`.
As a result, they are both typed as `unknown` and it is up to you to narrow the type to what your reusable component needs (for example, via `zod`).
