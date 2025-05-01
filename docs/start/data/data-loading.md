---
title: Data Loading
order: 4
---

# Data Loading

[MODES: data]

## Providing Data

Data is provided to route components from route loaders:

```tsx
createBrowserRouter([
  {
    path: "/",
    loader: () => {
      // return data from here
      return { records: await getSomeRecords() };
    },
    Component: MyRoute,
  },
]);
```

## Accessing Data

The data is available in route components with `useLoaderData`.

```tsx
import { useLoaderData } from "react-router";

function MyRoute() {
  const { records } = useLoaderData();
  return <div>{records.length}</div>;
}
```

As the user navigates between routes, the loaders are called before the route component is rendered.

---

Next: [Actions](./actions)
