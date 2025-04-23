---
"react-router": patch
---

Update Single Fetch to also handle the 204 redirects used in `?_data` requests in Remix v2

- This allows applications to return a redirect on `.data` requests from outside the scope of React Router (i.e., an `express`/`hono` middleware)
- ⚠️ Please note that doing so relies on implementation details that are subject to change without a SemVer major release
- This is primarily done to ease upgrading to Single Fetch for existing Remix v2 applications, but the recommended way to handle this is redirecting from a route middleware
