---
"@remix-run/react-router": patch
---

fix(react-router): guard encodeLocation against backslashes in splat paths so URL paths round-trip without breaking the router
