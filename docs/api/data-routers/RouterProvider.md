---
title: RouterProvider
---

# RouterProvider

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.RouterProvider.html)

Initializes a data router, subscribes to its changes, and renders the
matching components. Should typically be at the top of an app's element tree.

```tsx
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router";
import { createRoot } from "react-dom/client";
let router = createBrowserRouter();
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## Props

### flushSync

[modes: data]

Provides `flushSync` implementation required for using the `flushSync` option in navigation functions provided by [`useNavigate`](/api/hooks/useNavigate#signature) and [`useSearchParams`](/api/hooks/useSearchParams#setsearchparams-function).

```tsx
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router";
import { flushSync } from 'react-dom'
import { createRoot } from "react-dom/client";
let router = createBrowserRouter();
createRoot(document.getElementById("root")).render(
  <RouterProvider
    router={router}
    flushSync={(fn) => {
      flushSync(fn);
    }}
  />
);
```

### router

[modes: data]

_No documentation_
