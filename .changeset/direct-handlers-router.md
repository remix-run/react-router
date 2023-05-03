---
"@remix-run/router": minor
---

Add support for inline handler functions (`loader`/`action`) to be passed to `router.fetch`, allowing you to skip the creation of a new route to handle the fetch. Inline handlers will override any handlers defined on the active route.

To leverage an inline handler, pass the function instead of a string `href` in your `router.fetch(key, routeId, href, opts?)` call.

```jsx
let routes = [{ path: "/" }];

// Inline loader
router.fetch("key", "0", ({ request }) => {
  // Call this loader
});

// Inline action
router.fetch(
  "key",
  "0",
  ({ request }) => {
    // Call this action
  },
  {
    formMethod "post",
    formData: new FormData(),
  }
)
```
