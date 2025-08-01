---
title: createContext
unstable: true
---

# unstable_createContext

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/utils.ts
-->

[MODES: framework, data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_createContext.html)

Creates a type-safe context object that can be used to store and retrieve
values in middleware, [loaders](../../start/framework/route-module#loader),
and [actions](../../start/framework/route-module#action). Similar to React's
[`createContext`](https://react.dev/reference/react/createContext), but
designed for React Router's request/response lifecycle.

If a `defaultValue` is provided, it will be returned from `context.get()` when
no value has been set for the context. Otherwise reading this context when no
value has been set will throw an error.

```tsx filename=app/context.ts
import { unstable_createContext } from "react-router";

// Create a context for user data
export const userContext =
  unstable_createContext<User | null>(null);
```

```tsx filename=app/middleware/auth.ts
import { userContext } from "~/context";
import { getUserFromSession } from "~/auth.server";

export const authMiddleware = async ({
  request,
  context,
}) => {
  const user = await getUserFromSession(request);
  context.set(userContext, user);
};
```

```tsx filename=app/routes/profile.tsx
import { userContext } from "~/context";

export async function loader({
  context,
}: Route.LoaderArgs) {
  const user = context.get(userContext);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { user };
}
```

## Signature

```tsx
function unstable_createContext<T>(
  defaultValue?: T,
): unstable_RouterContext<T>
```

## Params

### defaultValue

An optional default value for the context. This value will be returned if no value has been set for this context.

## Returns

A [`unstable_RouterContext`](https://api.reactrouter.com/v7/interfaces/react_router.unstable_RouterContext.html) object that can be used with
`context.get()` and `context.set()` in middleware, loaders, and actions.

