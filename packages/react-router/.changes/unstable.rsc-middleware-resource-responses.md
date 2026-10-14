Return middleware short-circuit responses as-is for document requests in RSC modes, including resource routes, instead of decoding non-RSC bodies as Flight

- Include server middleware in both eager and lazy RSC route configuration types
- Preserve HTML rendering for cached Flight responses returned by middleware, and pass through raw responses that replace the result of `next()`
