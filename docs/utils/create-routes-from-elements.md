---
title: createRoutesFromElements
---

# `createRoutesFromElements`

`createRoutesFromElements` is a helper that creates route objects from `<Route>` elements. It's useful if you prefer to create your routes as JSX instead of objects.

```jsx
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";

// You can do this:
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="about" element={<About />} />
    </Route>
  )
);

// Instead of this:
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "about",
        element: <About />,
      },
    ],
  },
]);
```

It's also used internally by [`<Routes>`][routes] to generate a route objects from its [`<Route>`][route] children.

## Type declaration

```tsx
declare function createRoutesFromElements(
  children: React.ReactNode
): RouteObject[];

interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}
```

[routes]: ../components/routes
[route]: ../components/route
