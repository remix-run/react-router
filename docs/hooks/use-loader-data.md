---
title: useLoaderData
new: true
---

# `useLoaderData`

This hook provides the value returned from your route loader.

```tsx lines=[4,12]
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
} from "react-router-dom";

function loader() {
  return fetchFakeAlbums();
}

export function Albums() {
  const albums = useLoaderData();
  // ...
}

const router = createBrowserRouter([
  {
    path: "/",
    loader: loader,
    element: <Albums />,
  },
]);

ReactDOM.createRoot(el).render(
  <RouterProvider router={router} />
);
```

After route [actions][actions] are called, the data will be revalidated automatically and return the latest result from your loader.

Note that `useLoaderData` _does not initiate a fetch_. It simply reads the result of a fetch React Router manages internally, so you don't need to worry about it refetching when it re-renders for reasons outside of routing.

This also means data returned is stable between renders, so you can safely pass it to dependency arrays in React hooks like `useEffect`. It only changes when the loader is called again after actions or certain navigations. In these cases the identity will change (even if the values don't).

You can use this hook in any component or any custom hook, not just the Route element. It will return the data from the nearest route on context.

To get data from any active route on the page, see [`useRouteLoaderData`][routeloaderdata].

[actions]: ../components/route#action
[routeloaderdata]: ./use-route-loader-data
