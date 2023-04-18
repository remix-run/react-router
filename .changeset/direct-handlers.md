---
"react-router-dom": minor
---

Add direct `handler` function support to `useSubmit`/`fetcher.submit`/`fetcher.load`. This allows you to skip the creation of a new route to handle the `loader` or `action` (generally useful for fetching to a different endpoint). If both a call-site handler and a route-defined handler exist, the call-site hndler will be used

**`useSubmit:`**

```jsx
let router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let submit = useSubmit();

      submit(data, {
        formMethod: "post",
        encType: null,
        action({ payload }) {
          // You may now define your action here
        },
      });
    },
  },
]);
```

**`fetcher.load`/`fetcher.submit`:**

```jsx
let router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let fetcher = useFetcher();

      fetcher.load(() => {
        // You may now define a loader here
      });

      fetcher.submit(data, {
        formMethod: "post",
        encType: null,
        action({ payload }) {
          // You may now define your action here
        },
      });
    },
  },
]);
```
