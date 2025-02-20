---
"@react-router/dev": patch
---

Stub all routes except root in "SPA Mode" server builds to avoid issues when route modules or their dependencies import non-SSR-friendly modules
