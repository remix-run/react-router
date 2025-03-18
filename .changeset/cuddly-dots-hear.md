---
"@react-router/dev": patch
---

When `future.unstable_splitRouteModules` is set to `"enforce"`, allow both splittable and unsplittable root route exports since it's always in a single chunk.
