---
"@react-router/dev": patch
"react-router": patch
---

Add a new `unstable_url: URL` parameter to route handler methods (`loader`, `action`, `middleware`, etc.) representing the normalized URL the application is navigating to or fetching, with React Router implementation details removed (`.data`suffix, `index`/`_routes` query params)

This is being added alongside the new `future.unstable_passthroughRequests` future flag so that users still have a way to access the normalized URL when that flag is enabled and non-normalized `request`'s are being passed to your handlers. When adopting this flag, you will only need to start leveraging this new parameter if you are relying on the normalization of `request.url` in your application code.

If you don't have the flag enabled, then `unstable_url` will match `request.url`.
