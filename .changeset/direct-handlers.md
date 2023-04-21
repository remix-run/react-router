---
"react-router-dom": minor
---

Add direct `action` function support to `useSubmit`/`fetcher.submit` and direct `loader` support to `fetcher.load`. This allows you to skip the creation of a new route to handle the `action` or `loader`. If both a call-site handler and a route-defined handler exist, the call-site handler will be used.

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
