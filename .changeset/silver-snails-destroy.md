---
"@remix-run/router": patch
---

Remove `instanceof` check from `isRouteErrorResponse` to avoid bundling issues on the server
