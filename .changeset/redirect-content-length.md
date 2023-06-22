---
"@remix-run/router": patch
---

Ensure `redirect` responses have a `Content-Length` header to be spec compliant. We also add a small HTML body indicating the new location to follow best practices.
