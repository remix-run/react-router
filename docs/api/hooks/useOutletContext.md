---
title: useOutletContext
---

# useOutletContext

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useOutletContext.html)

Returns the parent route [`<Outlet context>`](../components/Outlet).

Often parent routes manage state or other values you want shared with child
routes. You can create your own [context provider](https://react.dev/learn/passing-data-deeply-with-context)
if you like, but this is such a common situation that it's built-into
[`<Outlet>`](../components/Outlet).

```tsx
// Parent route
function Parent() {
  const [count, setCount] = React.useState(0);
  return <Outlet context={[count, setCount]} />;
}
```

```tsx
// Child route
import { useOutletContext } from "react-router";

function Child() {
  const [count, setCount] = useOutletContext();
  const increment = () => setCount((c) => c + 1);
  return <button onClick={increment}>{count}</button>;
}
```

If you're using TypeScript, we recommend the parent component provide a
custom hook for accessing the context value. This makes it easier for
consumers to get nice typings, control consumers, and know who's consuming
the context value.

Here's a more realistic example:

```tsx filename=src/routes/dashboard.tsx lines=[14,20]
import { useState } from "react";
import { Outlet, useOutletContext } from "react-router";

import type { User } from "./types";

type ContextType = { user: User | null };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet context={{ user } satisfies ContextType} />
    </div>
  );
}

export function useUser() {
  return useOutletContext<ContextType>();
}
```

```tsx filename=src/routes/dashboard/messages.tsx lines=[1,4]
import { useUser } from "../dashboard";

export default function DashboardMessages() {
  const { user } = useUser();
  return (
    <div>
      <h2>Messages</h2>
      <p>Hello, {user.name}!</p>
    </div>
  );
}
```

## Signature

```tsx
function useOutletContext<Context = unknown>(): Context
```

## Returns

The context value passed to the parent [`Outlet`](../components/Outlet) component

