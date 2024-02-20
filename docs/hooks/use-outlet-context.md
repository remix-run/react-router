---
title: useOutletContext
---

# `useOutletContext`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useOutletContext<
  Context = unknown
>(): Context;
```

</details>

Often parent routes manage state or other values you want shared with child routes. You can create your own [context provider](https://react.dev/learn/passing-data-deeply-with-context) if you like, but this is such a common situation that it's built-into `<Outlet />`:

```tsx lines=[3]
function Parent() {
  const [count, setCount] = React.useState(0);
  return <Outlet context={[count, setCount]} />;
}
```

```tsx lines=[4]
import { useOutletContext } from "react-router-dom";

function Child() {
  const [count, setCount] = useOutletContext();
  const increment = () => setCount((c) => c + 1);
  return <button onClick={increment}>{count}</button>;
}
```

If you're using TypeScript, we recommend the parent component provide a custom hook for accessing the context value. This makes it easier for consumers to get nice typings, control consumers, and know who's consuming the context value. Here's a more realistic example:

```tsx filename=src/routes/dashboard.tsx lines=[13,19]
import * as React from "react";
import type { User } from "./types";
import { Outlet, useOutletContext } from "react-router-dom";

type ContextType = { user: User | null };

export default function Dashboard() {
  const [user, setUser] = React.useState<User | null>(null);

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
