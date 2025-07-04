---
title: createContext
unstable: true
---

# unstable_createContext

[MODES: framework, data]

<br/>
<br/>

<docs-warning>This API is experimental and subject to breaking changes. Enable it with the `future.unstable_middleware` flag.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_createContext.html)

Creates a type-safe context object that can be used to store and retrieve values in middleware, loaders, and actions. Similar to React's `createContext`, but designed for React Router's request/response lifecycle.

## Signature

```tsx
unstable_createContext<T>(defaultValue?: T): RouterContext<T>
```

## Params

### defaultValue

An optional default value for the context. This value will be returned if no value has been set for this context.

## Returns

A `RouterContext<T>` object that can be used with `context.get()` and `context.set()` in middleware, loaders, and actions.

## Examples

### Basic Usage

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

## See Also

- [Middleware Guide](../../how-to/middleware)
