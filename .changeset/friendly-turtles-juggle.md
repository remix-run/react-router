---
"@react-router/dev": patch
---

Skip `?route-entry=1` virtual module in development. This is an optimization for the production build and results in an unnecessary additional module request to the Vite dev server.
