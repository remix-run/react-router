---
"@remix-run/router": minor
---

- Add support for direct `action` functions to be passed to `router.navigate`. This allows you to skip the creation of a new route to handle the `action` , or you can also override the defined route `action` at the call-site.

**Defining an `action` at the callsite:**

```jsx
let routes = [{ path: '/' }]; // No action on route

// Custom actions will behave as a submission navigation to the current location
router.navigate(null, {
  formMethod "post",
  formData: new FormData(),
  action() {
    // You may now define your custom action here
  }
})
```

**Overriding an `action` at the call-site:**

```jsx
let routes = [{ path: '/', action: someAction }];
router.navigate(null, {
  formMethod "post",
  formData: new FormData(),
  action() {
    // This will be called instead of `someAction`
  }
})
```

- Add support for direct `action`/`loader` functions to be passed to `router.fetch`. This allows you to skip the creation of a new route to handle the `loader` or `action`, or you can also override the defined route `loader` or `action` at the call-site.

**Fetching to a direct loader without a defined route:**

```jsx
let routes = [{ path: "/", action: someAction }];
// Note no location required
router.fetch("key", "0", null, {
  loader() {
    // Call this loader for the fetcher and avoid the need for a resource route
  },
});
```

**Fetching to a direct action without a defined route:**

```jsx
let routes = [{ path: '/', action: someAction }];
// Note no location required
router.fetch("key", "0", null, {
  formMethod "post",
  formData: new FormData(),
  action() {
    // Call this action for the fetcher and avoid the need for a resource route
  }
})
```
