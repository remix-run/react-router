---
"react-router": patch
---

[UNSTABLE] Add `location`/`params` as arguments to client-side `unstable_onError` to permit enhanced error reporting.

⚠️ This is a breaking change if you've already adopted `unstable_onError`. The second `errorInfo` parameter is now an object with `location` and `params`:

```tsx
// Before
function errorHandler(error: unknown, errorInfo?: React.errorInfo) {
  /*...*/
}

// After
function errorHandler(
  error: unknown,
  info: {
    location: Location;
    params: Params;
    errorInfo?: React.ErrorInfo;
  },
) {
  /*...*/
}
```
