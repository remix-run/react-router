---
title: useRouteLoaderData
new: true
---

# `useRouterLoaderData`

This hook makes the data at any currently rendered route available anywhere in the tree. This is useful for components deep in the tree needing data from routes much farther up, as well as parent routes needing the data of child routes deeper in the tree.

```tsx
import { useRouteLoaderData } from "react-router-dom";

function SomeComp() {
  const user = useRouteLoaderData("root");
  // ...
}
```

React Router stores data internally with deterministic, auto-generated route ids, but you can supply your own route id to make this hook much easier to work with.

```tsx [6]
<DataBrowserRouter>
  <Route
    path="/"
    loader={() => fetchUser()}
    element={<Root />}
    id="root"
  >
    <Route
      path="jobs/$jobId"
      loader={({ params }) => fetchJob(params.jobId)}
      element={<Job />}
    />
  </Route>
</DataBrowserRouter>
```

Now the user is available anywhere in the app.

```tsx
const user = useRouteLoaderData("root");
```

The only data available is the routes that are currently rendered. If you ask for data from a route that is not currently rendered, the hook will return `undefined`.
