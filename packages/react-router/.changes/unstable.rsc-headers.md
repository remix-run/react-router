Add `unstable_headers()` for setting response headers from RSC server functions, loaders, actions, resource routes, and middleware

- Server functions can set cookies without redirecting
- Calls are applied to the final response, and `Set-Cookie` headers are always appended
- Headers React Router manages, such as `Content-Type` and `Location`, can't be set, and writes throw once the response has been created
- `unstable_getRequest()` now also works in RSC resource routes
