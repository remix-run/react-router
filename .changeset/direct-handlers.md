---
"react-router-dom": minor
---

Add support for inline handler functions to be passed to `fetcher.load` and `fetcher.submit`, allowing you to skip the creation of a new route to handle the fetch. Inline handlers will override any handlers defined on the active route.

```jsx
let router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let fetcher = useFetcher();

      fetcher.load(({ request }) => {
        // Define your inline loader here
      });

      fetcher.submit(data, {
        formMethod: "post",
        encType: null,
        action({ request }) {
          // Define your inline action here
        },
      });
    },
  },
]);
```
