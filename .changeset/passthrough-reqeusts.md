---
"@react-router/dev": patch
"react-router": patch
---

Add `future.unstable_passThroughRequests` flag

By default, React Router normalizes the `request.url` passed to your `loader`, `action`, and `middleware` functions by removing React Router's internal implementation details (`.data` suffixes, `index` + `_routes` query params).

Enabling this flag removes that normalization and passes the raw HTTP `request` instance to your handlers. This provides a few benefits:

- Reduces server-side overhead by eliminating multiple `new Request()` calls on the critical path
- Allows you to distinguish document from data requests in your handlers base don the presence of a `.data` suffix (useful for observability purposes)

If you were previously relying on the normalization of `request.url`, you can switch to use the new sibling `unstable_url` parameter which contains a `URL` instance representing the normalized location:

```tsx
// ❌ Before: you could assume there was no `.data` suffix in `request.url`
export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  if (url.pathname === "/path") {
    // This check will fail with the flag enabled because the `.data` suffix will
    // exist on data requests
  }
}

// ✅ After: use `unstable_url` for normalized routing logic and `request.url`
// for raw routing logic
export async function loader({ request, unstable_url }: Route.LoaderArgs) {
  if (unstable_url.pathname === "/path") {
    // This will always have the `.data` suffix stripped
  }

  // And now you can distinguish between document versus data requests
  let isDataRequest = new URL(request.url).pathname.endsWith(".data");
}
```
