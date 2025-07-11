---
title: RouterProvider
---

# RouterProvider

[MODES: data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.RouterProvider.html)

Accepts a data router, subscribes to its changes, and renders the
matching components. Should typically be at the top of an app's element tree.

```tsx
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

let router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

## Props

### flushSync

[modes: data]

<docs-warning>This is an implementation detail and shouldn't need to be used in your application.</docs-warning>

This prop provides a way to inject the `react-dom` `flushSync` implementation when running `RouterProvider` in a DOM environment for use during routing operations with `flushSync` enabled (i.e., [useNavigate](../hooks/useNavigate#signature)).

- If you're running `RouterProvider` in a memory environment (such as unit tests) you can import it from `react-router` and omit this prop
- If you are running `RouterProvider` in a DOM environment, you should be importing it from `react-router/dom` which automatically passes the `react-dom` `flushSync` implementation for you

### router

[modes: data]

The initialized data router for the application.
