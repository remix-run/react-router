---
"react-router-dom": patch
---

Use `pagehide` instead of `beforeunload` for `<ScrollRestoration>`. This has better cross-browser support, specifically on Mobile Safari.
