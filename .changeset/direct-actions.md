---
"react-router-dom": minor
---

Add direct `action` function support to `useSubmit`/`fetcher.submit`. This allows you to skip the creation of a new route to handle the `action` (generally useful for fetching to a different endpoint). If both a call-site `action` and a route-defined `action` exist, the call-site action will be used

```jsx
let router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let submit = useSubmit();
      return (
        <button
          onClick={() => {
            submit(
              { key: value },
              {
                formMethod: "post",
                encType: null,
                action({ payload }) {
                  // You may now define your action here
                },
              }
            );
          }}
        >
          Submit
        </button>
      );
    },
  },
]);
```
