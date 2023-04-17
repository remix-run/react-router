---
"@remix-run/router": minor
---

Add support for direct `action` functions to be passed to `router.navigate` and `router.fetch`. This allows you to skip the creation of a new route to handle the `action` (generally useful for fetching to a different endpoint), or you can also override the defined route `action` at the call-site.

**Defining an `action` at the callsite:**

```jsx
let routes = [{ path: '/' }]; // No action on route
router.navigate("/", {
  formMethod "post",
  formData: new FormData(),
  action({ request }) {
    // You may now define your action here
  }
})
```

**Overriding an `action` at the callsite:**

```jsx
let routes = [{ path: '/', action: someAction }];
router.navigate("/", {
  formMethod "post",
  formData: new FormData(),
  action({ request }) {
    // This will be called instead of `someAction`
  }
})
```

**Fetching to a direct action without a defined route:**

```jsx
let routes = [{ path: '/', action: someAction }];
// Note no location required
router.fetch("key", "0", null, {
  formMethod "post",
  formData: new FormData(),
  action({ request }) {
    // Call this action for the fetcher and avoid the need for a resource route
  }
})
```
