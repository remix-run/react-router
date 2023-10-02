---
title: RouterProvider
new: true
---

# `<RouterProvider>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function RouterProvider(
  props: RouterProviderProps
): React.ReactElement;

interface RouterProviderProps {
  fallbackElement?: React.ReactNode;
  router: Router;
  future?: Partial<FutureConfig>;
}
```

</details>

All [data router][picking-a-router] objects are passed to this component to render your app and enable the rest of the data APIs.

<docs-info>Due to the decoupling of fetching and rendering in the design of the data APIs, you should create your router outside of the React tree with a statically defined set of routes. For more information on this design, please see the [Remixing React Router][remixing-react-router] blog post and the [When to Fetch][when-to-fetch] conference talk.</docs-info>

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

If you are not server rendering your app, `createBrowserRouter` will initiate all matching route loaders when it mounts. During this time, you can provide a `fallbackElement` to give the user some indication that the app is working. Make that static hosting TTFB count!

```tsx
<RouterProvider
  router={router}
  fallbackElement={<SpinnerOfDoom />}
/>
```

## `future`

An optional set of [Future Flags][api-development-strategy] to enable. We recommend opting into newly released future flags sooner rather than later to ease your eventual migration to v7.

```jsx
function App() {
  return (
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true }}
    />
  );
}
```

[picking-a-router]: ./picking-a-router
[api-development-strategy]: ../guides/api-development-strategy
[remixing-react-router]: https://remix.run/blog/remixing-react-router
[when-to-fetch]: https://www.youtube.com/watch?v=95B8mnhzoCM
