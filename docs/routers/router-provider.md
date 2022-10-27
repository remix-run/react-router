---
title: RouterProvider
new: true
---

# `<RouterProvider>`

All router objects are passed to this component to render your app and enable the rest of the APIs.

```jsx lines=[24]
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider
    router={router}
    fallbackElement={<BigSpinner />}
  />
);
```

## `fallbackElement`

If you are not server rendering your app, `DataBrowserRouter` will initiate all matching route loaders when it mounts. During this time, you can provide a `fallbackElement` to give the user some indication that the app is working. Make that static hosting TTFB count!

```tsx
<RouterProvider
  router={router}
  fallbackElement={<SpinnerOfDoom />}
/>
```
