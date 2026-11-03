Add `unstable_headers()` for setting response headers from RSC server functions, loaders, actions, resource routes, and middleware

- Returns the outgoing response `Headers` for the current request, so server functions can set cookies without redirecting
- `set`, `append`, and `delete` calls are applied in order on top of route `headers` exports and returned or thrown responses
- `Set-Cookie` headers are always appended, and exact duplicates are skipped
- Headers React Router manages, such as `Content-Type`, `Content-Length`, and `Location`, can't be set
- Writes throw once the response has been created, including while server components render
- RSC resource routes now run with the same server context as other routes, so `unstable_getRequest()` also works there
