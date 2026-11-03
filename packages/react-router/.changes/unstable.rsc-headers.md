Add `unstable_headers()` for setting response headers from RSC server functions, loaders, actions, and middleware

- Returns the response `Headers` for the current request, so server functions can set cookies without redirecting
- `Set-Cookie` headers are appended, and other headers replace values from route `headers` exports or redirect responses
- Throws once the response has been created, including while server components render
